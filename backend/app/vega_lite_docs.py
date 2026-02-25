"""Standalone SQLite FTS index for Vega-Lite markdown documentation."""

import os
import re
import sqlite3
from pathlib import Path

# Project root: backend/app -> backend -> chart-chat
_APP_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _APP_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

DEFAULT_DOCS_DIR = _PROJECT_ROOT / "vega-lite-docs"
DOCS_DIR = Path(os.getenv("VEGA_LITE_DOCS_DIR", str(DEFAULT_DOCS_DIR)))
DB_PATH = DOCS_DIR / "docs.db"

_FRONTMATTER_TITLE_RE = re.compile(r"^\s*title:\s*(.+)$", re.MULTILINE)


def _parse_title(content: str) -> str:
    """Extract title from YAML frontmatter if present."""
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            fm = content[3:end]
            m = _FRONTMATTER_TITLE_RE.search(fm)
            if m:
                return m.group(1).strip().strip('"\'')
    return ""


def _ensure_db() -> None:
    """Build or rebuild the FTS DB if missing or docs are newer than DB."""
    if not DOCS_DIR.exists():
        return
    db_exists = DB_PATH.exists()
    db_mtime = DB_PATH.stat().st_mtime if db_exists else 0
    newest_md = 0
    for p in DOCS_DIR.glob("*.md"):
        newest_md = max(newest_md, p.stat().st_mtime)
    if db_exists and newest_md <= db_mtime:
        return
    # Build or rebuild
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("DROP TABLE IF EXISTS docs_fts")
        conn.execute(
            "CREATE VIRTUAL TABLE docs_fts USING fts5(path, title, content)"
        )
        for path in sorted(DOCS_DIR.glob("*.md")):
            content = path.read_text(encoding="utf-8", errors="replace")
            title = _parse_title(content) or path.stem
            conn.execute(
                "INSERT INTO docs_fts(path, title, content) VALUES (?, ?, ?)",
                (path.name, title, content),
            )
        conn.commit()
    finally:
        conn.close()


def search_vega_lite_docs(query: str) -> str:
    """Search the Vega-Lite docs index and return the markdown of the top result."""
    if not query or not query.strip():
        return "No search query provided."
    if not DOCS_DIR.exists():
        return "Vega-Lite docs directory not found."
    _ensure_db()
    if not DB_PATH.exists():
        return "Vega-Lite docs index not available."
    conn = sqlite3.connect(DB_PATH)
    try:
        # FTS5 MATCH and ORDER BY rank; use placeholder to avoid injection
        cur = conn.execute(
            "SELECT content FROM docs_fts WHERE docs_fts MATCH ? ORDER BY rank LIMIT 1",
            (query.strip(),),
        )
        row = cur.fetchone()
        if row:
            return row[0]
        return "No matching Vega-Lite documentation found for that query."
    except sqlite3.OperationalError as e:
        err = str(e).lower()
        if "malformed" in err or "syntax" in err or "unterminated" in err:
            return "Invalid search query; try simpler or different terms."
        raise
    finally:
        conn.close()
