"""Shared types for the LLM package."""

import operator
from dataclasses import dataclass, field
from typing import Annotated, List, Tuple, Union

from pydantic import BaseModel, Field, model_validator
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

    @model_validator(mode="before")
    @classmethod
    def normalize_action(cls, data):
        """Handle LLM returning action dicts with unexpected keys.

        The LLM frequently invents schemas like {'Response': '...'},
        {'type': 'response', 'summary': '...'}, etc. If the action dict
        doesn't already have a valid 'response' or 'steps' key, try to
        extract a usable value.
        """
        if not isinstance(data, dict):
            return data
        action = data.get("action")
        if not isinstance(action, dict):
            return data
        # Already valid
        if "response" in action or "steps" in action:
            return data
        # Find the best string value to use as the response.
        # Skip keys like 'type' that are discriminators, not content.
        skip_keys = {"type", "kind", "action_type"}
        best = None
        for key, value in action.items():
            if isinstance(value, str):
                if key not in skip_keys:
                    data["action"] = {"response": value}
                    return data
                if best is None:
                    best = value
        # Fall back to a skipped key's value if nothing else found
        if best is not None:
            data["action"] = {"response": best}
        return data
