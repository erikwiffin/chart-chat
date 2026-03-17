"""Shared types for the LLM package."""

import operator
from dataclasses import dataclass, field
from typing import Annotated, List, Tuple, Union

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..models import Chart, DataSource
from ..pubsub import ProjectPubSub


@dataclass
class ToolContext:
    db: Session
    messages: list[dict]
    data_sources: list[DataSource]
    project_id: int
    pubsub: ProjectPubSub
    active_chart_id: str | None = None
    charts: list[Chart] = field(default_factory=list)
    modified_chart_ids: set[int] = field(default_factory=set)


def ctx_to_markdown(ctx: ToolContext) -> str:
    data_sources = "\n".join([f"- {ds.id} {ds.name}" for ds in ctx.data_sources])
    charts = "\n".join(
        [
            f"- {c.id} {c.title}{', Active Chart' if c.id == ctx.active_chart_id else ''}"
            for c in ctx.charts
        ]
    )
    return f"""
Project: {ctx.project_id}
Charts:
{charts}
Data sources:
{data_sources}
"""


@dataclass
class PlanExecute:
    input: str = ""
    plan: List[str] = field(default_factory=list)
    past_steps: Annotated[List[Tuple[str, str]], operator.add] = field(
        default_factory=list
    )
    response: str = ""


class Plan(BaseModel):
    steps: List[str] = Field(description="Ordered steps to accomplish the task")


class Response(BaseModel):
    response: str


class Act(BaseModel):
    action: Union[Response, Plan] = Field(
        description="Use Response to finish, Plan to continue with more steps"
    )
