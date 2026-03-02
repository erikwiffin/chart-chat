#!/usr/bin/env python
"""CLI for iterating on the planning step of the plan-execute loop.

Usage:
    uv run python plan_debug.py <chart_id> "<directive>"
    # or, if added to pyproject.toml scripts:
    uv run plan-debug <chart_id> "<directive>"
"""

import asyncio

import click
from dotenv import load_dotenv

load_dotenv()  # Must precede app imports that read os.environ

from app.database import SessionLocal
from app.llm.common import _get_llm
from app.llm.context import ToolContext
from app.llm.plan import make_plan_step
from app.models import Chart, DataSource, Project


async def run(chart_id: int, directive: str):
    db = SessionLocal()
    try:
        chart = db.query(Chart).filter(Chart.id == chart_id).one()
        project_id = chart.project_id
        project = db.query(Project).filter(Project.id == project_id).one()

        # Replicate context loading from _generate_assistant_response
        messages = [{"role": m.role, "content": m.content} for m in project.messages]
        data_sources = (
            db.query(DataSource).filter(DataSource.project_id == project_id).all()
        )
        existing_charts = db.query(Chart).filter(Chart.project_id == project_id).all()

        # Replicate active-chart context augmentation from get_ai_response
        ctx = ToolContext(
            active_chart_id=str(chart_id),
            messages=messages,
            data_sources=data_sources,
            charts=existing_charts,
        )

        plan_step = make_plan_step(_get_llm(), ctx)
        result = await plan_step(
            {
                "input": directive,
                "plan": [],
                "past_steps": [],
                "response": "",
            }
        )

        click.echo(f'\nPlanning: "{directive}"\n')
        click.echo("Plan steps:")
        for i, step in enumerate(result["plan"], 1):
            click.echo(f"  {i}. {step}")
    finally:
        db.close()


@click.command()
@click.argument("chart_id", type=int)
@click.argument("directive")
def cli(chart_id: int, directive: str):
    """Run the plan step for CHART_ID with the given DIRECTIVE."""
    asyncio.run(run(chart_id, directive))


if __name__ == "__main__":
    cli()
