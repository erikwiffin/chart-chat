"""Tests for LLM tools in _build_tools."""

import json
from unittest.mock import patch

from app.llm import _build_tools, _validate_vega_lite_spec

SAMPLE_DS = [
    {
        "id": 1,
        "name": "sales",
        "columns": ["year", "revenue"],
        "sample_rows": [{"year": 2020, "revenue": 100}],
        "url": "/api/data-sources/1/data",
    }
]

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


def make_tools(data_sources=None, collected=None, existing=None, modified=None):
    tools_list = _build_tools(
        data_sources if data_sources is not None else [],
        collected if collected is not None else [],
        existing if existing is not None else [],
        modified if modified is not None else [],
    )
    return {t.name: t for t in tools_list}


# ---------------------------------------------------------------------------
# _validate_vega_lite_spec
# ---------------------------------------------------------------------------


def test_validate_valid_spec():
    assert _validate_vega_lite_spec(VALID_SPEC) is None


def test_validate_invalid_spec():
    error = _validate_vega_lite_spec({"not": "a valid spec"})
    assert error is not None
    assert isinstance(error, str)


# ---------------------------------------------------------------------------
# list_datasources
# ---------------------------------------------------------------------------


def test_list_datasources_empty():
    tools = make_tools(data_sources=[])
    result = tools["list_datasources"].invoke({})
    assert result == "No data sources available."


def test_list_datasources_populated():
    tools = make_tools(data_sources=SAMPLE_DS)
    result = tools["list_datasources"].invoke({})
    assert "sales" in result
    assert "/api/data-sources/1/data" in result
    assert "year" in result
    assert "revenue" in result


# ---------------------------------------------------------------------------
# preview_data
# ---------------------------------------------------------------------------


def test_preview_data_found():
    tools = make_tools(data_sources=SAMPLE_DS)
    result = tools["preview_data"].invoke({"source_name": "sales"})
    data = json.loads(result)
    assert data == [{"year": 2020, "revenue": 100}]


def test_preview_data_not_found():
    tools = make_tools(data_sources=SAMPLE_DS)
    result = tools["preview_data"].invoke({"source_name": "unknown"})
    assert "not found" in result


# ---------------------------------------------------------------------------
# describe_data
# ---------------------------------------------------------------------------


def test_describe_data_found():
    tools = make_tools(data_sources=SAMPLE_DS)
    result = tools["describe_data"].invoke({"source_name": "sales"})
    assert "year" in result
    assert "revenue" in result


def test_describe_data_not_found():
    tools = make_tools(data_sources=SAMPLE_DS)
    result = tools["describe_data"].invoke({"source_name": "missing"})
    assert "not found" in result


# ---------------------------------------------------------------------------
# create_chart
# ---------------------------------------------------------------------------


def test_create_chart_valid_spec():
    collected = []
    tools = make_tools(data_sources=SAMPLE_DS, collected=collected)
    result = tools["create_chart"].invoke(
        {"title": "My Chart", "spec": VALID_SPEC_WITH_DATA}
    )
    assert "My Chart" in result
    assert len(collected) == 1
    assert "data" not in collected[0]["spec"]
    assert collected[0]["data_source_id"] == 1
    assert collected[0]["title"] == "My Chart"


def test_create_chart_invalid_spec():
    collected = []
    tools = make_tools(collected=collected)
    result = tools["create_chart"].invoke({"title": "Bad", "spec": {"bad": "spec"}})
    assert "Invalid" in result
    assert len(collected) == 0


def test_create_chart_no_data_url():
    collected = []
    tools = make_tools(collected=collected)
    result = tools["create_chart"].invoke({"title": "Plain", "spec": VALID_SPEC})
    assert "Plain" in result
    assert collected[0]["data_source_id"] is None
    assert "data" not in collected[0]["spec"]


# ---------------------------------------------------------------------------
# list_charts
# ---------------------------------------------------------------------------


def test_list_charts_empty():
    tools = make_tools()
    result = tools["list_charts"].invoke({})
    assert result == "No charts available."


def test_list_charts_existing_only():
    existing = [{"id": "5", "title": "Old Chart", "spec": VALID_SPEC}]
    tools = make_tools(existing=existing)
    result = tools["list_charts"].invoke({})
    assert "5" in result
    assert "Old Chart" in result


def test_list_charts_new_only():
    collected = [{"title": "New Chart", "spec": VALID_SPEC, "data_source_id": None}]
    tools = make_tools(collected=collected)
    result = tools["list_charts"].invoke({})
    assert "new-0" in result
    assert "New Chart" in result


def test_list_charts_both():
    collected = [{"title": "New Chart", "spec": VALID_SPEC, "data_source_id": None}]
    existing = [{"id": "3", "title": "Old Chart", "spec": VALID_SPEC}]
    tools = make_tools(collected=collected, existing=existing)
    result = tools["list_charts"].invoke({})
    assert "3" in result
    assert "Old Chart" in result
    assert "new-0" in result
    assert "New Chart" in result


# ---------------------------------------------------------------------------
# get_chart_spec
# ---------------------------------------------------------------------------


def test_get_chart_spec_existing_injects_url():
    existing = [
        {"id": "7", "title": "Existing", "spec": VALID_SPEC, "data_source_id": 1}
    ]
    tools = make_tools(existing=existing)
    result = tools["get_chart_spec"].invoke({"chart_id": "7"})
    spec = json.loads(result)
    assert spec["data"] == {"url": "/api/data-sources/1/data"}


def test_get_chart_spec_new_chart():
    collected = [{"title": "New", "spec": VALID_SPEC, "data_source_id": 1}]
    tools = make_tools(collected=collected)
    result = tools["get_chart_spec"].invoke({"chart_id": "new-0"})
    spec = json.loads(result)
    assert spec["data"] == {"url": "/api/data-sources/1/data"}


def test_get_chart_spec_not_found():
    tools = make_tools()
    result = tools["get_chart_spec"].invoke({"chart_id": "999"})
    assert "not found" in result


# ---------------------------------------------------------------------------
# render_chart
# ---------------------------------------------------------------------------


def test_render_chart_found():
    collected = [{"title": "Render Me", "spec": VALID_SPEC, "data_source_id": 1}]
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    with patch("app.llm.vlc.vegalite_to_png", return_value=fake_png):
        tools = make_tools(data_sources=SAMPLE_DS, collected=collected)
        result = tools["render_chart"].invoke({"chart_id": "new-0"})
    assert isinstance(result, list)
    assert any(item.get("type") == "image" for item in result)
    assert any("Render Me" in item.get("text", "") for item in result)


def test_render_chart_injects_inline_data():
    collected = [{"title": "Chart", "spec": VALID_SPEC, "data_source_id": 1}]
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    captured = {}

    def fake_render(spec_json):
        captured["spec"] = json.loads(spec_json)
        return fake_png

    with patch("app.llm.vlc.vegalite_to_png", side_effect=fake_render):
        tools = make_tools(data_sources=SAMPLE_DS, collected=collected)
        tools["render_chart"].invoke({"chart_id": "new-0"})
    assert captured["spec"]["data"] == {"values": [{"year": 2020, "revenue": 100}]}


def test_render_chart_not_found():
    tools = make_tools()
    result = tools["render_chart"].invoke({"chart_id": "new-99"})
    assert any("not found" in item.get("text", "") for item in result)


# ---------------------------------------------------------------------------
# edit_chart
# ---------------------------------------------------------------------------


def test_edit_chart_existing():
    existing = [{"id": "2", "title": "Chart", "spec": VALID_SPEC, "data_source_id": 1}]
    modified = []
    tools = make_tools(existing=existing, modified=modified)
    patch_ops = [{"op": "replace", "path": "/mark", "value": "line"}]
    result = tools["edit_chart"].invoke({"chart_id": "2", "patch": patch_ops})
    assert "updated" in result
    assert len(modified) == 1
    assert modified[0]["spec"]["mark"] == "line"
    assert modified[0]["data_source_id"] == 1


def test_edit_chart_new():
    collected = [{"title": "New", "spec": VALID_SPEC, "data_source_id": None}]
    tools = make_tools(collected=collected)
    patch_ops = [{"op": "replace", "path": "/mark", "value": "point"}]
    result = tools["edit_chart"].invoke({"chart_id": "new-0", "patch": patch_ops})
    assert "updated" in result
    assert collected[0]["spec"]["mark"] == "point"


def test_edit_chart_not_found():
    tools = make_tools()
    result = tools["edit_chart"].invoke(
        {
            "chart_id": "999",
            "patch": [{"op": "replace", "path": "/mark", "value": "bar"}],
        }
    )
    assert "not found" in result


def test_edit_chart_invalid_patch_result():
    # Patch that replaces the entire spec with something invalid
    existing = [
        {"id": "1", "title": "Chart", "spec": VALID_SPEC, "data_source_id": None}
    ]
    modified = []
    tools = make_tools(existing=existing, modified=modified)
    patch_ops = [{"op": "replace", "path": "/mark", "value": 12345}]
    result = tools["edit_chart"].invoke({"chart_id": "1", "patch": patch_ops})
    # Should fail validation
    assert "invalid" in result.lower()
    assert len(modified) == 0
