from dotenv import load_dotenv

load_dotenv()

import os

from ariadne import make_executable_schema
from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLTransportWSHandler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .resolvers import message_type, mutation, project_type, query, subscription
from .schema import type_defs

Base.metadata.create_all(bind=engine)

schema = make_executable_schema(
    type_defs, query, mutation, subscription, project_type, message_type
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
