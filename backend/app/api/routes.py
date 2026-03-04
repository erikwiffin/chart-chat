"""REST API endpoints using FastAPI APIRouter with Depends(get_db)."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from ..data import get_data_source_preview, read_csv_dataframe
from ..database import get_db
from ..models import DataSource, Project
from ..storage import THUMBNAILS_DIR, parse_csv, save_upload

router = APIRouter(prefix="/api")


@router.get("/data-sources/{data_source_id}/data")
async def get_data_source_data(data_source_id: int, db: Session = Depends(get_db)):
    ds = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found.")
    df = read_csv_dataframe(ds.file_path)
    return JSONResponse(df.to_dict(orient="records"))


@router.get("/data-sources/{data_source_id}/preview")
async def get_data_source_preview_endpoint(
    data_source_id: int, db: Session = Depends(get_db)
):
    ds = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found.")
    return get_data_source_preview(ds.file_path)


@router.post("/projects/{project_id}/upload")
async def upload_data_source(
    project_id: int, file: UploadFile, db: Session = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    content = await file.read()
    parsed = parse_csv(content)
    file_path = save_upload(project.uuid, file.filename, content)

    data_source = DataSource(
        project_id=project_id,
        name=file.filename,
        file_path=file_path,
        columns=parsed["columns"],
        row_count=parsed["row_count"],
        sample_rows=parsed["sample_rows"],
    )
    db.add(data_source)
    db.commit()
    db.refresh(data_source)

    return {
        "id": data_source.id,
        "name": data_source.name,
        "columns": data_source.columns,
        "row_count": data_source.row_count,
    }


@router.get("/charts/{chart_id}/thumbnail")
async def get_chart_thumbnail(chart_id: int):
    path = THUMBNAILS_DIR / f"chart_{chart_id}.png"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found.")
    return FileResponse(path, media_type="image/png")
