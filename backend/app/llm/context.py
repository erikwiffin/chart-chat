"""Shared types for the LLM package."""

import operator
from dataclasses import dataclass, field
from typing import Annotated, List, Protocol, Tuple, Union

from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from ..models import Chart, DataSource


class StatusCallback(Protocol):
    """Protocol for status callbacks: async callable with named params task and message."""

    async def __call__(self, task: str, message: str) -> None: ...


@dataclass
class ToolContext:
    messages: list[dict]
    data_sources: list[DataSource]
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
