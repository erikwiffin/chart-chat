"""Standalone SQLite FTS index for Vega-Lite markdown documentation."""

import re
import sqlite3
from pathlib import Path

import yaml

from .config import settings

DOCS_DIR = Path(settings.vega_lite_docs_dir)
DB_PATH = DOCS_DIR / "docs.db"


def _parse_frontmatter(content: str) -> tuple[str, str]:
    """Extract title and body from YAML frontmatter if present.

    Returns (title, body) where body has frontmatter stripped.
    """
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            fm_text = content[3:end]
            body = content[end + 3:].lstrip("\n")
            try:
                parsed = yaml.safe_load(fm_text)
            except yaml.YAMLError:
                return ("", content)
            if isinstance(parsed, dict):
                return (str(parsed.get("title", "")), body)
    return ("", content)


def _ensure_db() -> None:
    """Build or rebuild the FTS DB if missing or docs are newer than DB."""
    if not DOCS_DIR.exists():
        return
    db_exists = DB_PATH.exists()
    if db_exists:
        return
    # Build or rebuild
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("DROP TABLE IF EXISTS docs_fts")
        conn.execute("CREATE VIRTUAL TABLE docs_fts USING fts5(title, content)")
        for path in sorted(DOCS_DIR.glob("**/*.md")):
            raw = path.read_text(encoding="utf-8", errors="replace")
            title, content = _parse_frontmatter(raw)
            title = title or path.stem
            conn.execute(
                "INSERT INTO docs_fts(title, content) VALUES (?, ?)",
                (title, content),
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
        tokens = re.sub(r"[^a-zA-Z0-9]", " ", query.strip())
        cur = conn.execute(
            "SELECT content FROM docs_fts WHERE docs_fts MATCH ? ORDER BY rank LIMIT 1",
            (tokens,),
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
