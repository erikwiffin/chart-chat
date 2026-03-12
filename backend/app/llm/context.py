"""Shared types for the LLM package."""

import operator
from dataclasses import dataclass, field
from typing import Annotated, List, Tuple, Union

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing_extensions import TypedDict

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


class PlanExecute(TypedDict):
    input: str
    plan: List[str]
    past_steps: Annotated[List[Tuple[str, str]], operator.add]
    response: str


class Plan(BaseModel):
    steps: List[str] = Field(description="Ordered steps to accomplish the task")


class Response(BaseModel):
    response: str


class Act(BaseModel):
    action: Union[Response, Plan] = Field(
        description="Use Response to finish, Plan to continue with more steps"
    )
