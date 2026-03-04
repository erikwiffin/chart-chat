"""Executor agent node — executes a single plan step."""

import logging

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage

from ..pubsub import pubsub
from .context import PlanExecute, ToolContext
from .prompts import EXECUTOR_SYSTEM_PROMPT
from .summarize_task import summarize_task
from .tools import build_tools

logger = logging.getLogger(__name__)


def make_execute_step(llm, ctx: ToolContext):
    tools = build_tools(ctx)
    executor_tools = [v for k, v in tools.items() if k != "get_conversation_history"]
    executor = create_agent(llm, executor_tools, system_prompt=EXECUTOR_SYSTEM_PROMPT)

    async def execute_step(state: PlanExecute):
        plan = state["plan"]
        plan_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(plan))
        task = plan[0]
        logger.info("Executing step 1/%d: %s", len(plan), task)
        if ctx.project_id is not None:
            summary = await summarize_task(task, project_id=ctx.project_id)
            await pubsub.publish(
                f"status:{ctx.project_id}", {"task": task, "message": summary}
            )
        past = "\n".join(f"- {s}: {r}" for s, r in state.get("past_steps", []))
        task_input = f"Plan:\n{plan_str}\n\nCompleted steps:\n{past}\n\nExecute: {task}"
        response = await executor.ainvoke(
            {"messages": [HumanMessage(content=task_input)]}
        )
        return {"past_steps": [(task, response["messages"][-1].content)]}

    return execute_step
