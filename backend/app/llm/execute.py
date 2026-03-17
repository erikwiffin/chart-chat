"""Executor agent node — executes a single plan step."""

import logging

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage

from .context import PlanExecute, ToolContext
from .summarize_task import summarize_task
from .tools import build_tools

logger = logging.getLogger(__name__)


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

## Chart Reversion
Use revert_chart(chart_id, version) to restore a chart to a previous version.
Each edit_chart call creates a new version. If a series of edits goes wrong,
prefer reverting to a known-good version rather than trying to patch your way back.
"""


def make_execute_step(llm, ctx: ToolContext):
    tools = build_tools(ctx)
    executor_tools = [v for k, v in tools.items() if k != "get_conversation_history"]
    executor = create_agent(llm, executor_tools, system_prompt=EXECUTOR_SYSTEM_PROMPT)

    async def execute_step(state: PlanExecute):
        plan = state.plan
        plan_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(plan))
        task = plan[0]
        logger.info("Executing step 1/%d: %s", len(plan), task)
        if ctx.project_id is not None:
            summary = await summarize_task(task, project_id=ctx.project_id)
            await ctx.pubsub.publish(
                "status", {"task": task, "message": summary, "isGenerating": True}
            )
        past = "\n".join(f"- {s}: {r}" for s, r in state.past_steps)
        task_input = f"Plan:\n{plan_str}\n\nCompleted steps:\n{past}\n\nExecute: {task}"
        response = await executor.ainvoke(
            {"messages": [HumanMessage(content=task_input)]}
        )
        return {"past_steps": [(task, response["messages"][-1].content)]}

    return execute_step
