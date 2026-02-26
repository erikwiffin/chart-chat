import csv
import io
import json
import os
from pathlib import Path

import pandas as pd
import vl_convert as vlc

UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "uploads"))
THUMBNAILS_DIR = UPLOADS_DIR / "thumbnails"


def generate_chart_thumbnail(spec: dict, file_path: str | None, chart_id: int) -> None:
    """Render a chart spec to PNG and save it. Full CSV data injected as inline data if file_path provided."""
    spec = dict(spec)
    if file_path:
        try:
            df = pd.read_csv(file_path)
            rows = [{k: _coerce(v) for k, v in row.items()} for row in df.to_dict(orient="records")]
            spec["data"] = {"values": rows}
        except Exception:
            if "data" in spec:
                del spec["data"]
    elif "data" in spec:
        del spec["data"]
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    png_bytes = vlc.vegalite_to_png(json.dumps(spec))
    (THUMBNAILS_DIR / f"chart_{chart_id}.png").write_bytes(png_bytes)


def get_project_upload_dir(project_uuid: str) -> Path:
    project_dir = UPLOADS_DIR / project_uuid
    project_dir.mkdir(parents=True, exist_ok=True)
    return project_dir


def save_upload(project_uuid: str, filename: str, content: bytes) -> str:
    project_dir = get_project_upload_dir(project_uuid)
    file_path = project_dir / filename
    file_path.write_bytes(content)
    return str(file_path)


def _coerce(val) -> object:
    """Convert numpy/pandas scalars to JSON-safe native Python types."""
    try:
        if pd.isna(val):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(val, "item"):  # numpy scalar → native Python
        return val.item()
    return val


def get_data_source_preview(file_path: str) -> dict:
    try:
        df = pd.read_csv(file_path)
        preview_rows = [
            {k: _coerce(v) for k, v in row.items()}
            for row in df.head(10).to_dict(orient="records")
        ]

        desc = df.describe(include="all")
        describe_columns = list(desc.columns)
        describe_rows = []
        for stat_name, row in desc.iterrows():
            row_dict = {"_stat": str(stat_name)}
            for col in describe_columns:
                row_dict[col] = _coerce(row[col])
            describe_rows.append(row_dict)

        return {
            "preview_rows": preview_rows,
            "describe_columns": describe_columns,
            "describe_rows": describe_rows,
        }
    except Exception:
        return {"preview_rows": [], "describe_columns": [], "describe_rows": []}


def parse_csv(content: bytes) -> dict:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    columns = reader.fieldnames or []
    rows = []
    row_count = 0
    for row in reader:
        row_count += 1
        if row_count <= 5:
            rows.append(dict(row))
    return {
        "columns": list(columns),
        "row_count": row_count,
        "sample_rows": rows,
    }
