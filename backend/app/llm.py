import base64
import json
import operator
import os
import re
from typing import Annotated, List, Literal, Protocol, Tuple, Union

import altair as alt
import jsonpatch
import vl_convert as vlc
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from . import vega_lite_docs as vega_lite_docs_module


class StatusCallback(Protocol):
    """Protocol for status callbacks: async callable with named params task and message."""

    async def __call__(self, task: str, message: str) -> None: ...


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=os.getenv(
            "LITELLM_API_KEY", "dummy"
        ),  # pyright: ignore[reportArgumentType]
        base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
        model=os.getenv("LITELLM_MODEL", "gpt-3.5-turbo"),
    )


def _validate_vega_lite_spec(spec: dict) -> str | None:
    """Validate a Vega-Lite spec using altair. Returns None on success, error string on failure."""
    try:
        # Inject placeholder data so altair validation works on specs stored without data
        validation_spec = spec if "data" in spec else {**spec, "data": {"values": []}}
        alt.Chart.from_dict(validation_spec)
        return None
    except Exception as e:
        return str(e)


async def _summarize_task(task: str) -> str:
    """Use a brief LLM call to summarize a task into a 4-5 word present-participle phrase."""
    llm = _get_llm()
    msg = HumanMessage(
        content=(
            "Summarize this task in 4-5 words as a present-participle phrase "
            "(e.g., 'drawing bar chart', 'reviewing data'). "
            f"Task: {task}\n\nRespond with only the short phrase, no punctuation."
        )
    )
    response = await llm.ainvoke([msg])
    content = response.content
    assert isinstance(content, str)
    return content.strip()


class PlanExecute(TypedDict):
    input: str
    plan: List[str]
    past_steps: Annotated[List[Tuple[str, str]], operator.add]
    response: str
    collected_charts: List[dict]
    existing_charts: List[dict]
    modified_charts: List[dict]


class Plan(BaseModel):
    steps: List[str] = Field(description="Ordered steps to accomplish the task")


class Response(BaseModel):
    response: str


class Act(BaseModel):
    action: Union[Response, Plan] = Field(
        description="Use Response to finish, Plan to continue with more steps"
    )


EXECUTOR_SYSTEM_PROMPT = """You are a data visualization expert using Vega-Lite.

## Data Access
Use list_datasources() to find available data sources and their URLs.
Use preview_data() to inspect sample rows from a data source.
Use describe_data() to see column names and types.
Reference data in Vega-Lite specs via URL: {"data": {"url": "/api/data-sources/{id}/data"}}

## Chart Creation
Call create_chart(title, spec) with a complete valid Vega-Lite specification.
Always set "$schema": "https://vega.github.io/schema/vega-lite/v6.json" in every spec.
Always use Vega transforms to process data — never use pandas or Python data manipulation.

## Chart Inspection and Editing
Use list_charts() to see all available charts (existing and newly created).
Use get_chart_spec(chart_id) to retrieve the full spec of a chart.
Use render_chart(chart_id) to render a chart as an image and visually inspect it.
Use edit_chart(chart_id, patch) to modify a chart using JSON Patch (RFC 6902).

## Vega-Lite Documentation
Use search_vega_lite_docs(query) to look up Vega-Lite documentation when you need spec details, encoding, marks, or transforms.

## Vega Transform Patterns
- Aggregate: {"transform": [{"aggregate": [{"op": "sum", "field": "n", "as": "total"}], "groupby": ["year"]}]}
- Fold columns: {"transform": [{"fold": ["col1", "col2"], "as": ["category", "value"]}]}
- Calculate: {"transform": [{"calculate": "datum.value / 1000", "as": "value_k"}]}
- Filter: {"transform": [{"filter": "datum.year >= 1990"}]}
- Bin/density: Use Vega-Lite's built-in bin and aggregate transforms
"""

REPLANNER_TEMPLATE = """For the given objective, you have a plan and have completed some steps. \
Decide if you need more steps or if the task is complete.

Objective: {input}

Original plan:
{plan}

Completed steps and results:
{past_steps}

Based on the results above:
- Before responding that the task is complete, use render_chart to preview any created or edited chart and confirm it looks correct.
- If the objective is complete (e.g., charts have been created and the user's question answered), \
respond with a final Response message summarizing what was accomplished.
- If more steps are needed, respond with an updated Plan containing only the remaining steps to complete.
"""


def _build_tools(
    messages: list[dict],
    data_sources: list[dict],
    collected_charts: list[dict],
    existing_charts: list[dict],
    modified_charts: list[dict],
) -> dict:
    @tool
    def get_conversation_history(n: int = 5) -> str:
        """Get the last n messages from the conversation history (default 5).
        Use this when the user's request is ambiguous and prior context would help."""
        recent = messages[-n:]
        if not recent:
            return "No conversation history available."
        return "\n".join(f"{m['role']}: {m['content']}" for m in recent)

    @tool
    def search_vega_lite_docs(query: str) -> str:
        """Search Vega-Lite documentation. Returns the markdown of the top matching doc."""
        return vega_lite_docs_module.search_vega_lite_docs(query)

    @tool
    def list_datasources() -> str:
        """List available data sources and their data URLs."""
        lines = []
        for ds in data_sources:
            lines.append(
                f"- {ds['name']} (URL: {ds['url']}, columns: {', '.join(ds['columns'])})"
            )
        return "\n".join(lines) if lines else "No data sources available."

    @tool
    def preview_data(source_name: str) -> str:
        """Show sample rows from a data source."""
        for ds in data_sources:
            if ds["name"] == source_name:
                return json.dumps(ds["sample_rows"], indent=2)
        return f"Data source '{source_name}' not found."

    @tool
    def describe_data(source_name: str) -> str:
        """Show column names and types for a data source."""
        for ds in data_sources:
            if ds["name"] == source_name:
                return f"Columns: {', '.join(ds['columns'])}"
        return f"Data source '{source_name}' not found."

    @tool
    def create_chart(title: str, spec: dict) -> str:
        """Create a Vega-Lite chart. Call this when ready to produce a visualization."""
        spec = dict(spec)
        ds_id = None
        data_url = (spec.get("data") or {}).get("url", "")
        m = re.search(r"/api/data-sources/(\d+)/data", data_url)
        if m:
            ds_id = int(m.group(1))
        spec.pop("data", None)
        error = _validate_vega_lite_spec(spec)
        if error:
            return f"Invalid Vega-Lite spec: {error}"
        collected_charts.append({"title": title, "spec": spec, "data_source_id": ds_id})
        return f"Chart '{title}' created."

    @tool
    def list_charts() -> str:
        """List all available charts (existing DB charts and newly created charts this session)."""
        lines = []
        for chart in existing_charts:
            lines.append(f"- ID: {chart['id']}, Title: {chart['title']}")
        for i, chart in enumerate(collected_charts):
            temp_id = f"new-{i}"
            lines.append(f"- ID: {temp_id} (new), Title: {chart['title']}")
        return "\n".join(lines) if lines else "No charts available."

    @tool
    def get_chart_spec(chart_id: str) -> str:
        """Get the Vega-Lite spec of a chart by its ID."""
        for chart in existing_charts:
            if str(chart["id"]) == chart_id:
                spec = dict(chart["spec"])
                ds_id = chart.get("data_source_id")
                if ds_id:
                    spec["data"] = {"url": f"/api/data-sources/{ds_id}/data"}
                return json.dumps(spec, indent=2)
        if chart_id.startswith("new-"):
            try:
                idx = int(chart_id[4:])
                if 0 <= idx < len(collected_charts):
                    chart = collected_charts[idx]
                    spec = dict(chart["spec"])
                    ds_id = chart.get("data_source_id")
                    if ds_id:
                        spec["data"] = {"url": f"/api/data-sources/{ds_id}/data"}
                    return json.dumps(spec, indent=2)
            except ValueError:
                pass
        return f"Chart '{chart_id}' not found."

    @tool
    def render_chart(chart_id: str) -> list:
        """Render a chart as a PNG image and return it for visual inspection."""
        spec = None
        title = None
        chart_ds_id = None
        for chart in existing_charts:
            if str(chart["id"]) == chart_id:
                spec = chart["spec"]
                title = chart["title"]
                chart_ds_id = chart.get("data_source_id")
                break
        if spec is None and chart_id.startswith("new-"):
            try:
                idx = int(chart_id[4:])
                if 0 <= idx < len(collected_charts):
                    spec = collected_charts[idx]["spec"]
                    title = collected_charts[idx]["title"]
                    chart_ds_id = collected_charts[idx].get("data_source_id")
            except ValueError:
                pass
        if spec is None:
            return [{"type": "text", "text": f"Chart '{chart_id}' not found."}]
        spec = dict(spec)
        if chart_ds_id:
            for ds in data_sources:
                if ds["id"] == chart_ds_id:
                    spec["data"] = {"values": ds["sample_rows"]}
                    break
        spec_json = json.dumps(spec)
        png_bytes = vlc.vegalite_to_png(spec_json)
        b64 = base64.b64encode(png_bytes).decode("utf-8")
        return [
            {
                "type": "image",
                "source": {"type": "base64", "media_type": "image/png", "data": b64},
            },
            {"type": "text", "text": f"Rendered chart: {title}"},
        ]

    @tool
    def edit_chart(chart_id: str, patch: list) -> str:
        """Edit a chart spec using a JSON Patch (RFC 6902) document.
        patch should be a list of operation dicts, e.g.
        [{"op": "replace", "path": "/mark", "value": "bar"}]
        """
        target_chart = None
        is_existing = False
        existing_idx = None

        for chart in existing_charts:
            if str(chart["id"]) == chart_id:
                target_chart = chart
                is_existing = True
                break

        if target_chart is None and chart_id.startswith("new-"):
            try:
                idx = int(chart_id[4:])
                if 0 <= idx < len(collected_charts):
                    target_chart = collected_charts[idx]
                    existing_idx = idx
            except ValueError:
                pass

        if target_chart is None:
            return f"Chart '{chart_id}' not found."

        try:
            new_spec = jsonpatch.apply_patch(target_chart["spec"], patch)
        except Exception as e:
            return f"Failed to apply patch: {e}"

        error = _validate_vega_lite_spec(new_spec)
        if error:
            return f"Patched spec is invalid: {error}"

        target_chart["spec"] = new_spec

        if is_existing:
            modified_charts.append(
                {
                    "id": chart_id,
                    "title": target_chart["title"],
                    "spec": new_spec,
                    "data_source_id": target_chart.get("data_source_id"),
                }
            )
        elif existing_idx is not None:
            collected_charts[existing_idx]["spec"] = new_spec

        return f"Chart '{chart_id}' updated successfully."

    return {
        "get_conversation_history": get_conversation_history,
        "search_vega_lite_docs": search_vega_lite_docs,
        "list_datasources": list_datasources,
        "preview_data": preview_data,
        "describe_data": describe_data,
        "create_chart": create_chart,
        "list_charts": list_charts,
        "get_chart_spec": get_chart_spec,
        "render_chart": render_chart,
        "edit_chart": edit_chart,
    }


PLANNER_SYSTEM_PROMPT = (
    "You are a planning assistant. Break the user's request into concrete, ordered steps. "
    "Each step should be independently executable. No superfluous steps. "
    "If the user's request is ambiguous, use get_conversation_history to look up prior context."
)


def _build_plan_execute_graph(
    messages: list[dict],
    data_sources: list[dict],
    collected_charts: list[dict],
    existing_charts: list[dict],
    modified_charts: list[dict],
    status_callback: StatusCallback | None = None,
):
    llm = _get_llm()
    tools = _build_tools(
        messages, data_sources, collected_charts, existing_charts, modified_charts
    )

    # Tool subsets
    executor_tools = [v for k, v in tools.items() if k != "get_conversation_history"]
    planner_tools = [tools["get_conversation_history"]]
    replanner_tools = [tools["render_chart"], tools["get_conversation_history"]]

    # Planner: agent with history tool, then parser to get Plan
    planner_agent = create_agent(llm, planner_tools, system_prompt=PLANNER_SYSTEM_PROMPT)
    plan_parser_prompt = ChatPromptTemplate.from_template(
        "Based on the planner's response below, extract the ordered steps as a Plan.\n\n"
        "Planner response:\n{response}"
    )
    plan_parser = plan_parser_prompt | llm.with_structured_output(Plan)

    # Executor (ReAct agent)
    executor = create_agent(llm, executor_tools, system_prompt=EXECUTOR_SYSTEM_PROMPT)

    # Replanner: agent with render_chart + history, then parser to get Act
    replanner_agent = create_agent(
        llm,
        replanner_tools,
        system_prompt=(
            "You are the replanner. You have access to render_chart to preview charts. "
            "Use it to preview any created or edited chart before concluding the task is complete. "
            "Then decide: either summarize what was accomplished (task complete) or list remaining steps (more work needed)."
        ),
    )
    act_parser_prompt = ChatPromptTemplate.from_template(
        "Based on the replanner's conversation below, output Act. "
        "If the replanner concluded the task is complete, use Response with their summary. "
        "If they indicated more steps are needed, use Plan with the list of remaining steps.\n\n"
        "Conversation:\n{conversation}"
    )
    act_parser = act_parser_prompt | llm.with_structured_output(Act)

    async def plan_step(state: PlanExecute):
        response = await planner_agent.ainvoke(
            {"messages": [HumanMessage(content=state["input"])]}
        )
        last_msg = response["messages"][-1].content
        plan = plan_parser.invoke({"response": last_msg})
        assert isinstance(plan, Plan)
        return {"plan": plan.steps}

    async def execute_step(state: PlanExecute):
        plan = state["plan"]
        plan_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(plan))
        task = plan[0]
        if status_callback:
            summary = await _summarize_task(task)
            await status_callback(task, summary)
        past = "\n".join(f"- {s}: {r}" for s, r in state.get("past_steps", []))
        task_input = f"Plan:\n{plan_str}\n\nCompleted steps:\n{past}\n\nExecute: {task}"
        response = await executor.ainvoke(
            {"messages": [HumanMessage(content=task_input)]}
        )
        return {"past_steps": [(task, response["messages"][-1].content)]}

    async def replan_step(state: PlanExecute):
        past_steps_str = "\n".join(
            f"- {s}: {r}" for s, r in state.get("past_steps", [])
        )
        plan_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(state.get("plan", [])))
        replanner_input = REPLANNER_TEMPLATE.format(
            input=state["input"],
            plan=plan_str,
            past_steps=past_steps_str,
        )
        response = await replanner_agent.ainvoke(
            {"messages": [HumanMessage(content=replanner_input)]}
        )
        messages = response.get("messages", [])
        conversation = "\n".join(
            f"{getattr(m, 'type', type(m).__name__)}: {getattr(m, 'content', str(m))}"
            for m in messages
        )
        output = act_parser.invoke({"conversation": conversation})
        assert isinstance(output, Act)
        if isinstance(output.action, Response):
            return {"response": output.action.response}
        return {"plan": output.action.steps}

    def should_end(state: PlanExecute) -> Literal["agent", "__end__"]:
        return "__end__" if state.get("response") else "agent"

    workflow = StateGraph(PlanExecute)
    workflow.add_node("planner", plan_step)
    workflow.add_node("agent", execute_step)
    workflow.add_node("replan", replan_step)
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "agent")
    workflow.add_edge("agent", "replan")
    workflow.add_conditional_edges("replan", should_end, ["agent", END])
    return workflow.compile()


async def get_ai_response(
    messages: list[dict],
    data_sources: list[dict],
    existing_charts: list[dict] | None = None,
    active_chart_id: str | None = None,
    status_callback: StatusCallback | None = None,
) -> tuple[str, list[dict], list[dict]]:
    user_input = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )

    if existing_charts is None:
        existing_charts = []

    if active_chart_id:
        active_title = None
        for chart in existing_charts:
            if str(chart["id"]) == active_chart_id:
                active_title = chart["title"]
                break
        context = (
            f"\n\n[Context: The user is currently viewing chart ID {active_chart_id}"
        )
        if active_title:
            context += f" titled '{active_title}'"
        context += ".]"
        user_input += context

    collected_charts: list[dict] = []
    modified_charts: list[dict] = []
    graph = _build_plan_execute_graph(
        messages,
        data_sources,
        collected_charts,
        existing_charts,
        modified_charts,
        status_callback,
    )
    result = await graph.ainvoke(
        {
            "input": user_input,
            "plan": [],
            "past_steps": [],
            "response": "",
            "collected_charts": [],
            "existing_charts": existing_charts,
            "modified_charts": [],
        }
    )
    final_text = result.get("response", "Done.")
    return final_text, collected_charts, modified_charts


async def generate_project_name(prompt: str) -> str:
    llm = _get_llm()
    msg = HumanMessage(
        content=(
            "Generate a 2-4 word title-case project name for a conversation starting with: "
            f"{prompt}\n\nRespond with only the project name."
        )
    )
    response = await llm.ainvoke([msg])
    content = response.content
    assert isinstance(content, str)
    return content
