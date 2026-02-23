from ariadne import make_executable_schema
from ariadne.asgi import GraphQL
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .resolvers import query
from .schema import type_defs

Base.metadata.create_all(bind=engine)

schema = make_executable_schema(type_defs, query)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/graphql", GraphQL(schema, debug=True))
