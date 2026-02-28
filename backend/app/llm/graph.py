"""Build the plan-execute-replan LangGraph workflow."""

from langgraph.graph import END, START, StateGraph

from .common import _get_llm
from .context import PlanExecute, StatusCallback, ToolContext
from .execute import make_execute_step
from .plan import make_plan_step
from .replan import make_replan_step, should_end


def build_plan_execute_graph(
    ctx: ToolContext,
    status_callback: StatusCallback | None = None,
    project_id: int | None = None,
):
    def tags(task: str) -> list[str] | None:
        if project_id is None:
            return None
        return [f"project:{project_id}", f"task:{task}"]

    plan_step = make_plan_step(_get_llm(tags("plan")), ctx)
    execute_step = make_execute_step(_get_llm(tags("execute")), ctx, status_callback, project_id)
    replan_step = make_replan_step(_get_llm(tags("replan")), ctx)

    workflow = StateGraph(PlanExecute)
    workflow.add_node("planner", plan_step)
    workflow.add_node("agent", execute_step)
    workflow.add_node("replan", replan_step)
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "agent")
    workflow.add_edge("agent", "replan")
    workflow.add_conditional_edges("replan", should_end, ["agent", END])
    return workflow.compile()
