import logging
import os

from ariadne import load_schema_from_path, make_executable_schema
from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLTransportWSHandler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.resolvers import (
    chart_revision_type,
    chart_type,
    data_source_type,
    message_type,
    mutation,
    project_type,
    query,
    subscription,
)
from .api.routes import router as api_router
from .config import settings
from .database import Base, SessionLocal, engine

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

type_defs = load_schema_from_path(
    os.path.join(os.path.dirname(__file__), "api/schema.graphql")
)

schema = make_executable_schema(
    type_defs,
    query,
    mutation,
    subscription,
    project_type,
    message_type,
    data_source_type,
    chart_type,
    chart_revision_type,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
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
app.include_router(api_router)
