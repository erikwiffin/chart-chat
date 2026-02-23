import os

from ariadne import load_schema_from_path, make_executable_schema
from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLTransportWSHandler
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .models import DataSource, Project
from .resolvers import (
    chart_type,
    data_source_type,
    message_type,
    mutation,
    project_type,
    query,
    subscription,
)
from .storage import get_data_source_preview, parse_csv, save_upload

Base.metadata.create_all(bind=engine)

type_defs = load_schema_from_path(os.path.join(os.path.dirname(__file__), "schema.graphql"))

schema = make_executable_schema(
    type_defs,
    query,
    mutation,
    subscription,
    project_type,
    message_type,
    data_source_type,
    chart_type,
)

app = FastAPI()

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_context_value(request, *args):
    return {"db": SessionLocal()}


graphql_app = GraphQL(
    schema,
    debug=True,
    context_value=get_context_value,
    websocket_handler=GraphQLTransportWSHandler(),
)

app.mount("/graphql", graphql_app)


@app.get("/api/data-sources/{data_source_id}/preview")
async def get_data_source_preview_endpoint(data_source_id: int):
    db = SessionLocal()
    try:
        ds = db.query(DataSource).filter(DataSource.id == data_source_id).first()
        if not ds:
            raise HTTPException(status_code=404, detail="Data source not found.")
        return get_data_source_preview(ds.file_path)
    finally:
        db.close()


@app.post("/api/projects/{project_id}/upload")
async def upload_data_source(project_id: int, file: UploadFile):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    db = SessionLocal()
    try:
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
    finally:
        db.close()
