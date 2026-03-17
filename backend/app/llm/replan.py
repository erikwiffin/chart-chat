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


REPLANNER_TEMPLATE = """For the given objective, you have a plan and have completed some steps. 
Decide if you need more steps or if the task is complete.

Objective: {input}

Project: {project}

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
        system_prompt=(
            "You are the replanner. You have access to render_chart to preview charts. "
            "Use it to preview any created or edited chart before concluding the task is complete. "
            "Then decide: either summarize what was accomplished (task complete) or list remaining steps (more work needed)."
        ),
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
        past_steps_str = "\n".join(f"- {s}: {r}" for s, r in state.past_steps)
        plan_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(state.plan))
        replanner_input = REPLANNER_TEMPLATE.format(
            input=state.input,
            plan=plan_str,
            past_steps=past_steps_str,
            project=ctx_to_markdown(ctx),
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
