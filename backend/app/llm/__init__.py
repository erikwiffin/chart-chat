"""LLM package — public API."""

from sqlalchemy.orm import Session

from ..models import Chart, DataSource
from ..pubsub import ProjectPubSub, pubsub
from .context import PlanExecute, ToolContext
from .generate_project_name import generate_project_name
from .graph import build_plan_execute_graph


async def get_ai_response(
    db: Session,
    project_id: int,
    messages: list[dict],
    data_sources: list[DataSource],
    existing_charts: list[Chart],
    active_chart_id: int | None = None,
) -> tuple[str, ToolContext]:
    user_input = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )

    project_pubsub = ProjectPubSub(pubsub, project_id)

    ctx = ToolContext(
        db=db,
        project_id=project_id,
        pubsub=project_pubsub,
        active_chart_id=active_chart_id,
        messages=messages,
        data_sources=data_sources,
        charts=existing_charts,
    )

    graph = build_plan_execute_graph(ctx)
    state = PlanExecute(
        input=user_input,
        plan=[],
        past_steps=[],
        response="",
    )
    result = await graph.ainvoke(
        state,
        version="v2",
    )
    final_text = result.value.response or "Done."
    return final_text, ctx


__all__ = ["get_ai_response", "generate_project_name", "ToolContext"]
