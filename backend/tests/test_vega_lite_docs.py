"""Tests for Vega-Lite docs FTS search."""

from unittest.mock import patch

from app import vega_lite_docs


def test_search_empty_query():
    assert "No search query provided" in vega_lite_docs.search_vega_lite_docs("")
    assert "No search query provided" in vega_lite_docs.search_vega_lite_docs("   ")


def test_search_docs_dir_missing(tmp_path):
    with patch.object(vega_lite_docs, "DOCS_DIR", tmp_path / "nonexistent"):
        with patch.object(
            vega_lite_docs, "DB_PATH", tmp_path / "nonexistent" / "docs.db"
        ):
            assert "not found" in vega_lite_docs.search_vega_lite_docs("encoding")


def test_search_creates_db_and_returns_top_result(tmp_path):
    (tmp_path / "encoding.md").write_text(
        "---\ntitle: Encoding\n---\n\nEncoding data with visual properties."
    )
    (tmp_path / "overview.md").write_text("Overview of Vega-Lite.")
    with patch.object(vega_lite_docs, "DOCS_DIR", tmp_path):
        with patch.object(vega_lite_docs, "DB_PATH", tmp_path / "docs.db"):
            result = vega_lite_docs.search_vega_lite_docs("encoding")
    assert "Encoding data with visual properties" in result
    assert "encoding" in result.lower() or "Encoding" in result


def test_search_no_match(tmp_path):
    (tmp_path / "overview.md").write_text("Overview of Vega-Lite.")
    with patch.object(vega_lite_docs, "DOCS_DIR", tmp_path):
        with patch.object(vega_lite_docs, "DB_PATH", tmp_path / "docs.db"):
            result = vega_lite_docs.search_vega_lite_docs("xyzzynonexistent")
    assert "No matching" in result or "not found" in result.lower()


def test_search_malformed_query_returns_friendly_message(tmp_path):
    (tmp_path / "a.md").write_text("Content.")
    with patch.object(vega_lite_docs, "DOCS_DIR", tmp_path):
        with patch.object(vega_lite_docs, "DB_PATH", tmp_path / "docs.db"):
            # FTS5 treats certain chars as syntax; double-quote only is invalid
            result = vega_lite_docs.search_vega_lite_docs('"')
    assert "Invalid" in result or "simpler" in result or "No matching" in result
