from ariadne import graphql as run_graphql, make_executable_schema
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import Base, SessionLocal, engine
from .resolvers import message_type, mutation, project_type, query
from .schema import type_defs

Base.metadata.create_all(bind=engine)

schema = make_executable_schema(type_defs, query, mutation, project_type, message_type)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/graphql/")
async def graphql_endpoint(request: Request):
    data = await request.json()
    db = SessionLocal()
    try:
        success, result = await run_graphql(
            schema,
            data,
            context_value={"db": db},
            debug=True,
        )
    finally:
        db.close()
    return JSONResponse(result, status_code=200 if success else 400)
