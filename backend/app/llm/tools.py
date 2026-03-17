"""Tool logic functions and build_tools(ctx) for the LLM agents."""

import base64
import json
import logging
import re

import jsonpatch
from langchain_core.tools import tool

from app.services import chart_service

from .. import vega_lite_docs as vega_lite_docs_module
from ..charts import render_spec_to_png, validate_vega_lite_spec
from .context import ToolContext

logger = logging.getLogger(__name__)

_DATA_SOURCE_URL_RE = re.compile(r"/api/data-sources/(\d+)/data")


def _find_chart(ctx: ToolContext, chart_id: int):
    """Find a chart by ID (supports both DB IDs and 'new-N' synthetic IDs)."""
    for chart in ctx.charts:
        if chart.id is not None and chart.id == chart_id:
            return chart
    return None


def _get_file_path_for_ds(ctx: ToolContext, data_source_id: int | None) -> str | None:
    """Look up the file_path for a data_source_id from context."""
    if data_source_id is None:
        return None
    for ds in ctx.data_sources:
        if ds.id == data_source_id:
            return ds.file_path
    return None


# --- Tool logic functions ---


def _get_conversation_history(ctx: ToolContext, n: int = 5) -> str:
    logger.info("Tool get_conversation_history called: n=%d", n)
    recent = ctx.messages[-n:]
    if not recent:
        return "No conversation history available."
    return "\n".join(f"{m['role']}: {m['content']}" for m in recent)


def _search_vega_lite_docs(query: str) -> str:
    logger.info("Tool search_vega_lite_docs called: query=%r", query)
    return vega_lite_docs_module.search_vega_lite_docs(query)


def _list_datasources(ctx: ToolContext) -> str:
    logger.info("Tool list_datasources called")
    lines = []
    for ds in ctx.data_sources:
        lines.append(
            f"- {ds.name} (URL: /api/data-sources/{ds.id}/data, columns: {', '.join(ds.columns)})"
        )
    return "\n".join(lines) if lines else "No data sources available."


def _preview_data(ctx: ToolContext, source_name: str) -> str:
    logger.info("Tool preview_data called: source_name=%r", source_name)
    for ds in ctx.data_sources:
        if ds.name == source_name:
            return json.dumps(ds.sample_rows or [], indent=2)
    return f"Data source '{source_name}' not found."


def _describe_data(ctx: ToolContext, source_name: str) -> str:
    logger.info("Tool describe_data called: source_name=%r", source_name)
    for ds in ctx.data_sources:
        if ds.name == source_name:
            return f"Columns: {', '.join(ds.columns)}"
    return f"Data source '{source_name}' not found."


async def _create_chart(ctx: ToolContext, title: str, spec: dict) -> str:
    logger.info("Tool create_chart called: title=%r", title)
    spec = dict(spec)
    ds_id = None
    data = spec.pop("data", None)
    if data and isinstance(data, dict) and "url" in data:
        m = _DATA_SOURCE_URL_RE.search(data["url"])
        if m:
            ds_id = int(m.group(1))
    error = validate_vega_lite_spec(spec | {"data": {"values": []}})
    if error:
        logger.info("Tool create_chart: invalid spec for %r: %s", title, error)
        return f"Invalid Vega-Lite spec: {error}"

    chart = await chart_service.create_chart(ctx.db, ctx.project_id, title, spec, ds_id)
    ctx.db.expunge(instance=chart)
    ctx.charts.append(chart)
    await ctx.pubsub.publish("chart_added", chart)
    logger.info("Tool create_chart: created %r successfully", title)
    return f"Chart created. id={chart.id} title={chart.title}."


def _list_charts(ctx: ToolContext) -> str:
    logger.info("Tool list_charts called")
    lines = []
    for chart in ctx.charts:
        lines.append(
            f"- ID: {chart.id}, Title: {chart.title} {', Active Chart' if chart.id == ctx.active_chart_id else ''}"
        )
    return "\n".join(lines) if lines else "No charts available."


def _get_chart_spec(ctx: ToolContext, chart_id: int) -> str:
    logger.info("Tool get_chart_spec called: chart_id=%r", chart_id)
    chart = _find_chart(ctx, chart_id)
    if chart is None:
        return f"Chart '{chart_id}' not found."
    spec = dict(chart.spec)
    if chart.data_source_id:
        spec["data"] = {"url": f"/api/data-sources/{chart.data_source_id}/data"}
    return json.dumps(spec, indent=2)


def _render_chart(ctx: ToolContext, chart_id: int) -> list:
    logger.info("Tool render_chart called: chart_id=%r", chart_id)
    chart = _find_chart(ctx, chart_id)
    if chart is None:
        return [
            {
                "type": "text",
                "text": f"Chart '{chart_id}' not found. Try calling list_charts to find the chart ID.",
            }
        ]
    file_path = _get_file_path_for_ds(ctx, chart.data_source_id)
    try:
        png_bytes = render_spec_to_png(chart.spec, file_path)
    except Exception as e:
        return [{"type": "text", "text": f"Render failed: {e}"}]
    b64 = base64.b64encode(png_bytes).decode("utf-8")
    logger.info(
        "Tool render_chart: rendered %r (%d bytes)", chart.title, len(png_bytes)
    )
    return [
        {
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": b64},
        },
        {"type": "text", "text": f"Rendered chart: {chart.title}"},
    ]


async def _edit_chart(ctx: ToolContext, chart_id: int, patch: list) -> str:
    logger.info("Tool edit_chart called: chart_id=%r, patch=%s", chart_id, patch)
    chart = _find_chart(ctx, chart_id)
    if chart is None:
        return f"Chart '{chart_id}' not found."
    try:
        new_spec = jsonpatch.apply_patch(chart.spec, patch)
    except Exception as e:
        return f"Failed to apply patch: {e}"
    error = validate_vega_lite_spec(new_spec | {"data": {"values": []}})
    if error:
        return f"Patched spec is invalid: {error}"

    await chart_service.update_chart(ctx.db, chart, new_spec)
    ctx.modified_chart_ids.add(chart.id)
    await ctx.pubsub.publish("chart_updated", chart)
    return f"Chart '{chart_id}' updated successfully."


async def _revert_chart(ctx: ToolContext, chart_id: int, version: int) -> str:
    logger.info("Tool revert_chart called: chart_id=%r, version=%d", chart_id, version)
    chart = _find_chart(ctx, chart_id)
    if chart is None:
        return f"Chart '{chart_id}' not found."
    if chart.id is None or ctx.db is None:
        return "Chart revert is not available."

    reverted = await chart_service.revert_chart(ctx.db, chart, version)
    ctx.db.expunge(instance=reverted)
    ctx.modified_chart_ids.add(reverted.id)
    await ctx.pubsub.publish("chart_updated", reverted)
    return f"Chart {chart.id} reverted to version {version}."


def build_tools(ctx: ToolContext) -> dict:
    """Build LangChain tool wrappers with context pre-bound."""

    @tool
    def get_conversation_history(n: int = 5) -> str:
        """Get the last n messages from the conversation history (default 5).
        Use this when the user's request is ambiguous and prior context would help."""
        return _get_conversation_history(ctx, n)

    @tool
    def search_vega_lite_docs(query: str) -> str:
        """Search Vega-Lite documentation. Returns the markdown of the top matching doc."""
        return _search_vega_lite_docs(query)

    @tool
    def list_datasources() -> str:
        """List available data sources and their data URLs."""
        return _list_datasources(ctx)

    @tool
    def preview_data(source_name: str) -> str:
        """Show sample rows from a data source."""
        return _preview_data(ctx, source_name)

    @tool
    def describe_data(source_name: str) -> str:
        """Show column names and types for a data source."""
        return _describe_data(ctx, source_name)

    @tool
    async def create_chart(title: str, spec: dict) -> str:
        """Create a Vega-Lite chart. Call this when ready to produce a visualization."""
        return await _create_chart(ctx, title, spec)

    @tool
    def list_charts() -> str:
        """List all available charts (existing DB charts and newly created charts this session)."""
        return _list_charts(ctx)

    @tool
    def get_chart_spec(chart_id: int) -> str:
        """Get the Vega-Lite spec of a chart by its ID."""
        return _get_chart_spec(ctx, chart_id)

    @tool
    def render_chart(chart_id: int) -> list:
        """Render a chart as a PNG image and return it for visual inspection."""
        return _render_chart(ctx, chart_id)

    @tool
    async def edit_chart(chart_id: int, patch: list) -> str:
        """Edit a chart spec using a JSON Patch (RFC 6902) document.
        patch should be a list of operation dicts, e.g.
        [{"op": "replace", "path": "/mark", "value": "bar"}]
        """
        return await _edit_chart(ctx, chart_id, patch)

    @tool
    async def revert_chart(chart_id: int, version: int) -> str:
        """Revert a chart to a previous version. Use list_charts to find the chart ID,
        then specify the version number to revert to. This is useful when edits have
        gone wrong and you want to restore a known-good state rather than trying to
        patch your way back."""
        return await _revert_chart(ctx, chart_id, version)

    return {
        "get_conversation_history": get_conversation_history,
        "search_vega_lite_docs": search_vega_lite_docs,
        "list_datasources": list_datasources,
        "preview_data": preview_data,
        "describe_data": describe_data,
        "create_chart": create_chart,
        "list_charts": list_charts,
        "get_chart_spec": get_chart_spec,
        "render_chart": render_chart,
        "edit_chart": edit_chart,
        "revert_chart": revert_chart,
    }
