"""Planner agent node — generates a plan from user input."""

import json
import logging

from langchain.agents import create_agent
from langchain_core.exceptions import OutputParserException
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError

from .context import Plan, PlanExecute, ToolContext
from .tools import build_tools

logger = logging.getLogger(__name__)


PLANNER_SYSTEM_PROMPT = """
You are a data visualization expert using Vega-Lite.

You will be given a user request and a chart spec.
You will need to break the user's request into concrete, ordered steps.
Each step should be independently executable. No superfluous steps.

For simple requests, like changing the title or the axis labels, you can usually do it in one step.
For more complex requests, you may need to break it down into multiple steps.
For example, if the user wants to change how data is aggregated, you may need to:

- Review the data source and understand the data
- Change the transform to use the correct aggregation function
- Update the encoding to show the correct data
- Confirm the changes are correct
"""


def make_plan_step(llm, ctx: ToolContext):
    tools = build_tools(ctx)
    planner_tools = [tools["get_conversation_history"]]
    planner_tools = []
    planner_agent = create_agent(
        llm, planner_tools, system_prompt=PLANNER_SYSTEM_PROMPT
    )
    plan_parser_prompt = ChatPromptTemplate.from_template(
        "Based on the planner's response below, extract the ordered steps as a Plan.\n\n"
        "Planner response:\n{response}"
    )
    plan_parser = (plan_parser_prompt | llm.with_structured_output(Plan)).with_retry(
        retry_if_exception_type=(ValidationError, OutputParserException),
        stop_after_attempt=3,
    )

    async def plan_step(state: PlanExecute):
        plan_input = state.input
        if ctx.active_chart_id:
            chart = next(
                (c for c in ctx.charts if str(c.id) == ctx.active_chart_id), None
            )
            if chart:
                plan_input += f"\n\nSpec: {json.dumps(chart.spec, indent=2)}"
            else:
                logging.info(ctx.charts)
                raise ValueError(f"Chart {ctx.active_chart_id} not found")
        logger.info("Planning input: %.120s", state.input)
        response = await planner_agent.ainvoke(
            {
                "messages": [
                    HumanMessage(content=plan_input),
                ]
            }
        )
        last_msg = response["messages"][-1].content
        plan = plan_parser.invoke({"response": last_msg})
        assert isinstance(plan, Plan)
        logger.info("Created plan")
        for step in plan.steps:
            logger.info("- %s", step)
        return {"plan": plan.steps}

    return plan_step
