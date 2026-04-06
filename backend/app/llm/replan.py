"""Replanner agent node — decides whether to continue or finish."""

import logging
from typing import Literal

from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from langchain_core.exceptions import OutputParserException
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError

from .context import Act, PlanExecute, Response, ToolContext, ctx_to_markdown
from .tools import build_tools

logger = logging.getLogger(__name__)


REPLANNER_SYSTEM_PROMPT = """
You are a data visualization expert using Vega-Lite.

You will be provided with a task, a report on the work done so far, and the remaining plan.
Your job is to review the project so far and determine if the task has been accomplished.

If the task is complete, summarize the work that has been done.
If more work is required, list the remaining steps or make a new plan if the old plan is no longer valid.

Use the render_chart tool to visually confirm that the chart is correctly rendering and the task is complete.
Don't include any vega-lite in your response.
"""

REPLANNER_TEMPLATE = """
Task: {input}

Project: {project}

Progress:
{progress}

Plan:
{plan}

---

Based on the results above:
- Before responding that the task is complete, use render_chart to preview any created or edited chart and confirm it looks correct.
- If the objective is complete (e.g., charts have been created and the user's question answered), \
respond with a final Response message summarizing what was accomplished.
- If more steps are needed, respond with an updated Plan containing only the remaining steps to complete.
"""


def make_replan_step(llm, ctx: ToolContext):
    tools = build_tools(ctx)
    replanner_tools = [
        tools["list_charts"],
        tools["render_chart"],
        tools["get_conversation_history"],
    ]
    replanner_agent = create_agent(
        llm,
        replanner_tools,
        system_prompt=REPLANNER_SYSTEM_PROMPT,
    )
    act_parser_prompt = ChatPromptTemplate.from_template(
        "Based on the replanner's response below, output Act. "
        "If the replanner concluded the task is complete, use Response with their summary. "
        "If they indicated more steps are needed, use Plan with the list of remaining steps.\n\n"
        "Replanner response:\n{response}\n\n"
    )
    act_parser = (act_parser_prompt | llm.with_structured_output(Act)).with_retry(
        retry_if_exception_type=(ValidationError, OutputParserException),
        stop_after_attempt=3,
    )

    async def replan_step(state: PlanExecute):
        logger.info("Replanning step")
        logger.info("Plan:")
        for step in state.plan:
            logger.info("- %s", step)
        logger.info("Past steps:")
        for step in state.past_steps:
            logger.info("- %s: %s", step[0], step[1])

        progress_str = "\n\n".join(
            f"{i+1}. {plan}\n{result}"
            for i, (plan, result) in enumerate(state.past_steps)
        )
        plan_str = "\n".join(f"{i+1}. {step}" for i, step in enumerate(state.plan))
        replanner_input = REPLANNER_TEMPLATE.format(
            input=state.input,
            project=ctx_to_markdown(ctx),
            progress=progress_str,
            plan=plan_str,
        )
        response = await replanner_agent.ainvoke(
            {"messages": [HumanMessage(content=replanner_input)]}
        )
        last_msg = response["messages"][-1].content
        output = act_parser.invoke(
            {
                "response": last_msg,
            },
            response_format=ToolStrategy(Act),
        )
        assert isinstance(output, Act)
        if isinstance(output.action, Response):
            logger.info("Replan: complete — %.120s", output.action.response)
            return {"response": output.action.response}
        logger.info("Replan: %d steps remaining:", len(output.action.steps))
        for step in output.action.steps:
            logger.info("- %s", step)
        return {"plan": output.action.steps}

    return replan_step


def should_end(state: PlanExecute) -> Literal["agent", "__end__"]:
    return "__end__" if state.response else "agent"
