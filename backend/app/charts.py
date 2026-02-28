"""Canonical vega-lite/chart operations — spec validation, rendering, thumbnails."""

import copy
import json

import altair as alt
import vl_convert as vlc

from .data import read_csv_records
from .storage import THUMBNAILS_DIR


def validate_vega_lite_spec(spec: dict) -> str | None:
    """Validate a Vega-Lite spec using altair. Returns None on success, error string on failure."""
    try:
        alt.Chart.from_dict(spec)
        return None
    except Exception as e:
        return str(e)


def inject_inline_data(spec: dict, file_path: str) -> dict:
    """Return a copy of spec with inline data values from the CSV file."""
    spec = copy.deepcopy(spec)
    rows = read_csv_records(file_path)
    spec["data"] = {"values": rows}
    return spec


def render_spec_to_png(spec: dict, file_path: str | None = None) -> bytes:
    """Render a Vega-Lite spec to PNG bytes. Injects CSV data if file_path provided."""
    spec = copy.deepcopy(spec)
    if file_path:
        spec = inject_inline_data(spec, file_path)

    spec["width"] = 600
    spec["height"] = 400
    return vlc.vegalite_to_png(json.dumps(spec))


def generate_chart_thumbnail(spec: dict, file_path: str | None, chart_id: int) -> None:
    """Render a chart spec to PNG and save as a thumbnail."""
    # TODO: this should go in the project directory, not need mkdir
    png_bytes = render_spec_to_png(spec, file_path)
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    (THUMBNAILS_DIR / f"chart_{chart_id}.png").write_bytes(png_bytes)
