"""LLM package — public API."""

from ..models import Chart, DataSource
from .context import ChartRevertCallback, ChartSaveCallback, StatusCallback, ToolContext
from .generate_project_name import generate_project_name
from .graph import build_plan_execute_graph


async def get_ai_response(
    messages: list[dict],
    data_sources: list[DataSource],
    existing_charts: list[Chart] | None = None,
    active_chart_id: str | None = None,
    status_callback: StatusCallback | None = None,
    project_id: int | None = None,
    on_chart_saved: ChartSaveCallback | None = None,
    on_chart_reverted: ChartRevertCallback | None = None,
) -> tuple[str, ToolContext]:
    user_input = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )

    if existing_charts is None:
        existing_charts = []

    if active_chart_id:
        active_title = None
        for chart in existing_charts:
            if str(chart.id) == active_chart_id:
                active_title = chart.title
                break
        context = (
            f"\n\n[Context: The user is currently viewing chart ID {active_chart_id}"
        )
        if active_title:
            context += f" titled '{active_title}'"
        context += ".]"
        user_input += context

    ctx = ToolContext(
        messages=messages,
        data_sources=data_sources,
        charts=existing_charts,
        on_chart_saved=on_chart_saved,
        on_chart_reverted=on_chart_reverted,
    )

    graph = build_plan_execute_graph(ctx, status_callback, project_id=project_id)
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


__all__ = ["get_ai_response", "generate_project_name", "ToolContext", "StatusCallback"]
