import csv
import io
from pathlib import Path

from .config import settings

UPLOADS_DIR = Path(settings.uploads_dir)
THUMBNAILS_DIR = UPLOADS_DIR / "thumbnails"


def get_project_upload_dir(project_uuid: str) -> Path:
    project_dir = UPLOADS_DIR / project_uuid
    project_dir.mkdir(parents=True, exist_ok=True)
    return project_dir


def save_upload(project_uuid: str, filename: str, content: bytes) -> str:
    project_dir = get_project_upload_dir(project_uuid)
    file_path = project_dir / filename
    file_path.write_bytes(content)
    return str(file_path)


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
