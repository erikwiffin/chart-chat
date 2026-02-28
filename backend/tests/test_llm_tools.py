"""Tests for LLM tools."""

import json
from unittest.mock import patch

from app.charts import validate_vega_lite_spec
from app.llm.context import ToolContext
from app.llm.tools import build_tools
from app.models import Chart, DataSource

# Helper to create DataSource instances without DB
def _ds(id=1, name="sales", columns=None, sample_rows=None, file_path="/tmp/sales.csv"):
    ds = DataSource(
        name=name,
        columns=columns or ["year", "revenue"],
        sample_rows=sample_rows if sample_rows is not None else [{"year": 2020, "revenue": 100}],
        file_path=file_path,
        source_type="csv",
        row_count=1,
        project_id=1,
    )
    # Set id bypassing SQLAlchemy instrumentation
    object.__setattr__(ds, "id", id)
    return ds


def _chart(id=None, title="Chart", spec=None, data_source_id=None):
    c = Chart(
        title=title,
        spec=spec if spec is not None else VALID_SPEC.copy(),
        data_source_id=data_source_id,
        project_id=1,
    )
    if id is not None:
        object.__setattr__(c, "id", id)
    return c


SAMPLE_DS = [_ds()]

VALID_SPEC = {
    "mark": "bar",
    "encoding": {
        "x": {"field": "year", "type": "ordinal"},
        "y": {"field": "revenue", "type": "quantitative"},
    },
}

VALID_SPEC_WITH_DATA = {
    **VALID_SPEC,
    "data": {"url": "/api/data-sources/1/data"},
}


def make_tools(data_sources=None, charts=None, modified_chart_ids=None):
    ctx = ToolContext(
        messages=[],
        data_sources=data_sources if data_sources is not None else [],
        charts=charts if charts is not None else [],
        modified_chart_ids=modified_chart_ids if modified_chart_ids is not None else set(),
    )
    return build_tools(ctx), ctx


# ---------------------------------------------------------------------------
# get_conversation_history
# ---------------------------------------------------------------------------


def test_get_conversation_history_empty():
    tools, _ = make_tools()
    result = tools["get_conversation_history"].invoke({})
    assert "No conversation history" in result


def test_get_conversation_history_returns_recent():
    msgs = [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hi"},
        {"role": "user", "content": "make a chart"},
    ]
    ctx = ToolContext(messages=msgs, data_sources=[])
    tools = build_tools(ctx)
    result = tools["get_conversation_history"].invoke({"n": 2})
    assert "make a chart" in result
    assert "hello" not in result  # only last 2


# ---------------------------------------------------------------------------
# validate_vega_lite_spec
# ---------------------------------------------------------------------------


def test_validate_valid_spec():
    assert validate_vega_lite_spec(VALID_SPEC) is None


def test_validate_invalid_spec():
    error = validate_vega_lite_spec({"not": "a valid spec"})
    assert error is not None
    assert isinstance(error, str)


# ---------------------------------------------------------------------------
# search_vega_lite_docs
# ---------------------------------------------------------------------------


def test_search_vega_lite_docs_present():
    tools, _ = make_tools()
    assert "search_vega_lite_docs" in tools


def test_search_vega_lite_docs_returns_string():
    with patch("app.llm.tools.vega_lite_docs_module.search_vega_lite_docs", return_value="# Vega-Lite doc"):
        tools, _ = make_tools()
        result = tools["search_vega_lite_docs"].invoke({"query": "encoding"})
    assert isinstance(result, str)
    assert "Vega-Lite" in result


# ---------------------------------------------------------------------------
# list_datasources
# ---------------------------------------------------------------------------


def test_list_datasources_empty():
    tools, _ = make_tools(data_sources=[])
    result = tools["list_datasources"].invoke({})
    assert result == "No data sources available."


def test_list_datasources_populated():
    tools, _ = make_tools(data_sources=SAMPLE_DS)
    result = tools["list_datasources"].invoke({})
    assert "sales" in result
    assert "/api/data-sources/1/data" in result
    assert "year" in result
    assert "revenue" in result


# ---------------------------------------------------------------------------
# preview_data
# ---------------------------------------------------------------------------


def test_preview_data_found():
    tools, _ = make_tools(data_sources=SAMPLE_DS)
    result = tools["preview_data"].invoke({"source_name": "sales"})
    data = json.loads(result)
    assert data == [{"year": 2020, "revenue": 100}]


def test_preview_data_not_found():
    tools, _ = make_tools(data_sources=SAMPLE_DS)
    result = tools["preview_data"].invoke({"source_name": "unknown"})
    assert "not found" in result


# ---------------------------------------------------------------------------
# describe_data
# ---------------------------------------------------------------------------


def test_describe_data_found():
    tools, _ = make_tools(data_sources=SAMPLE_DS)
    result = tools["describe_data"].invoke({"source_name": "sales"})
    assert "year" in result
    assert "revenue" in result


def test_describe_data_not_found():
    tools, _ = make_tools(data_sources=SAMPLE_DS)
    result = tools["describe_data"].invoke({"source_name": "missing"})
    assert "not found" in result


# ---------------------------------------------------------------------------
# create_chart
# ---------------------------------------------------------------------------


def test_create_chart_valid_spec():
    tools, ctx = make_tools(data_sources=SAMPLE_DS)
    result = tools["create_chart"].invoke(
        {"title": "My Chart", "spec": VALID_SPEC_WITH_DATA}
    )
    assert "My Chart" in result
    new_charts = [c for c in ctx.charts if c.id is None]
    assert len(new_charts) == 1
    assert "data" not in new_charts[0].spec
    assert new_charts[0].data_source_id == 1
    assert new_charts[0].title == "My Chart"


def test_create_chart_invalid_spec():
    tools, ctx = make_tools()
    result = tools["create_chart"].invoke({"title": "Bad", "spec": {"bad": "spec"}})
    assert "Invalid" in result
    assert len(ctx.charts) == 0


def test_create_chart_no_data_url():
    tools, ctx = make_tools()
    result = tools["create_chart"].invoke({"title": "Plain", "spec": VALID_SPEC})
    assert "Plain" in result
    new_charts = [c for c in ctx.charts if c.id is None]
    assert new_charts[0].data_source_id is None
    assert "data" not in new_charts[0].spec


# ---------------------------------------------------------------------------
# list_charts
# ---------------------------------------------------------------------------


def test_list_charts_empty():
    tools, _ = make_tools()
    result = tools["list_charts"].invoke({})
    assert result == "No charts available."


def test_list_charts_existing_only():
    existing = [_chart(id=5, title="Old Chart")]
    tools, _ = make_tools(charts=existing)
    result = tools["list_charts"].invoke({})
    assert "5" in result
    assert "Old Chart" in result


def test_list_charts_new_only():
    new = [_chart(id=None, title="New Chart")]
    tools, _ = make_tools(charts=new)
    result = tools["list_charts"].invoke({})
    assert "new-0" in result
    assert "New Chart" in result


def test_list_charts_both():
    charts = [_chart(id=3, title="Old Chart"), _chart(id=None, title="New Chart")]
    tools, _ = make_tools(charts=charts)
    result = tools["list_charts"].invoke({})
    assert "3" in result
    assert "Old Chart" in result
    assert "new-0" in result
    assert "New Chart" in result


# ---------------------------------------------------------------------------
# get_chart_spec
# ---------------------------------------------------------------------------


def test_get_chart_spec_existing_injects_url():
    existing = [_chart(id=7, title="Existing", data_source_id=1)]
    tools, _ = make_tools(charts=existing)
    result = tools["get_chart_spec"].invoke({"chart_id": "7"})
    spec = json.loads(result)
    assert spec["data"] == {"url": "/api/data-sources/1/data"}


def test_get_chart_spec_new_chart():
    new = [_chart(id=None, title="New", data_source_id=1)]
    tools, _ = make_tools(charts=new)
    result = tools["get_chart_spec"].invoke({"chart_id": "new-0"})
    spec = json.loads(result)
    assert spec["data"] == {"url": "/api/data-sources/1/data"}


def test_get_chart_spec_not_found():
    tools, _ = make_tools()
    result = tools["get_chart_spec"].invoke({"chart_id": "999"})
    assert "not found" in result


# ---------------------------------------------------------------------------
# render_chart
# ---------------------------------------------------------------------------


def test_render_chart_found():
    ds = SAMPLE_DS[0]
    new = [_chart(id=None, title="Render Me", data_source_id=1)]
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    with patch("app.llm.tools.render_spec_to_png", return_value=fake_png):
        tools, _ = make_tools(data_sources=[ds], charts=new)
        result = tools["render_chart"].invoke({"chart_id": "new-0"})
    assert isinstance(result, list)
    assert any(item.get("type") == "image" for item in result)
    assert any("Render Me" in item.get("text", "") for item in result)


def test_render_chart_passes_file_path():
    ds = SAMPLE_DS[0]
    new = [_chart(id=None, title="Chart", data_source_id=1)]
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    captured = {}

    def fake_render(spec, file_path):
        captured["file_path"] = file_path
        return fake_png

    with patch("app.llm.tools.render_spec_to_png", side_effect=fake_render):
        tools, _ = make_tools(data_sources=[ds], charts=new)
        tools["render_chart"].invoke({"chart_id": "new-0"})
    assert captured["file_path"] == "/tmp/sales.csv"


def test_render_chart_not_found():
    tools, _ = make_tools()
    result = tools["render_chart"].invoke({"chart_id": "new-99"})
    assert any("not found" in item.get("text", "") for item in result)


# ---------------------------------------------------------------------------
# edit_chart
# ---------------------------------------------------------------------------


def test_edit_chart_existing():
    existing = [_chart(id=2, title="Chart", data_source_id=1)]
    tools, ctx = make_tools(charts=existing)
    patch_ops = [{"op": "replace", "path": "/mark", "value": "line"}]
    result = tools["edit_chart"].invoke({"chart_id": "2", "patch": patch_ops})
    assert "updated" in result
    assert 2 in ctx.modified_chart_ids
    assert ctx.charts[0].spec["mark"] == "line"


def test_edit_chart_new():
    new = [_chart(id=None, title="New")]
    tools, ctx = make_tools(charts=new)
    patch_ops = [{"op": "replace", "path": "/mark", "value": "point"}]
    result = tools["edit_chart"].invoke({"chart_id": "new-0", "patch": patch_ops})
    assert "updated" in result
    assert ctx.charts[0].spec["mark"] == "point"


def test_edit_chart_not_found():
    tools, _ = make_tools()
    result = tools["edit_chart"].invoke(
        {
            "chart_id": "999",
            "patch": [{"op": "replace", "path": "/mark", "value": "bar"}],
        }
    )
    assert "not found" in result


def test_edit_chart_invalid_patch_result():
    existing = [_chart(id=1, title="Chart")]
    tools, ctx = make_tools(charts=existing)
    patch_ops = [{"op": "replace", "path": "/mark", "value": 12345}]
    result = tools["edit_chart"].invoke({"chart_id": "1", "patch": patch_ops})
    assert "invalid" in result.lower()
    assert 1 not in ctx.modified_chart_ids
