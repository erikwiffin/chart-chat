"""Planner agent node — generates a plan from user input."""

import logging

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from .context import Plan, PlanExecute, ToolContext
from .prompts import PLANNER_SYSTEM_PROMPT
from .tools import build_tools

logger = logging.getLogger(__name__)


def make_plan_step(llm, ctx: ToolContext):
    tools = build_tools(ctx)
    planner_tools = [tools["get_conversation_history"]]
    planner_agent = create_agent(llm, planner_tools, system_prompt=PLANNER_SYSTEM_PROMPT)
    plan_parser_prompt = ChatPromptTemplate.from_template(
        "Based on the planner's response below, extract the ordered steps as a Plan.\n\n"
        "Planner response:\n{response}"
    )
    plan_parser = plan_parser_prompt | llm.with_structured_output(Plan)

    async def plan_step(state: PlanExecute):
        logger.info("Planning input: %.120s", state["input"])
        response = await planner_agent.ainvoke(
            {"messages": [HumanMessage(content=state["input"])]}
        )
        last_msg = response["messages"][-1].content
        plan = plan_parser.invoke({"response": last_msg})
        assert isinstance(plan, Plan)
        logger.info("Plan (%d steps): %s", len(plan.steps), plan.steps)
        return {"plan": plan.steps}

    return plan_step
