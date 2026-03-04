"""LLM package — public API."""

from sqlalchemy.orm import Session

from ..models import Chart, DataSource
from .context import ToolContext
from .generate_project_name import generate_project_name
from .graph import build_plan_execute_graph


async def get_ai_response(
    db: Session,
    project_id: int,
    messages: list[dict],
    data_sources: list[DataSource],
    existing_charts: list[Chart],
    active_chart_id: str | None = None,
) -> tuple[str, ToolContext]:
    user_input = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )

    ctx = ToolContext(
        db=db,
        project_id=project_id,
        active_chart_id=active_chart_id,
        messages=messages,
        data_sources=data_sources,
        charts=existing_charts,
    )

    graph = build_plan_execute_graph(ctx)
    result = await graph.ainvoke(
        {
            "input": user_input,
            "plan": [],
            "past_steps": [],
            "response": "",
        }
    )
    final_text = result.get("response", "Done.")
    return final_text, ctx


__all__ = ["get_ai_response", "generate_project_name", "ToolContext"]
