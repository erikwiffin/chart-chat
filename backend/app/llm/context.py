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


class ChartSaveCallback(Protocol):
    """Protocol for immediate chart save: async callable receiving the chart."""

    async def __call__(self, chart: Chart) -> None: ...


class ChartRevertCallback(Protocol):
    """Protocol for chart revert: async callable receiving the chart and target version."""

    async def __call__(self, chart: Chart, version: int) -> str: ...


@dataclass
class ToolContext:
    active_chart_id: str | None
    messages: list[dict]
    data_sources: list[DataSource]
    charts: list[Chart] = field(default_factory=list)
    on_chart_saved: ChartSaveCallback | None = None
    on_chart_reverted: ChartRevertCallback | None = None


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
