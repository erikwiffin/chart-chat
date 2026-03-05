import asyncio

import click

from app.charts import generate_chart_thumbnail
from app.database import SessionLocal
from app.llm.common import get_llm
from app.llm.context import ToolContext
from app.llm.execute import make_execute_step
from app.llm.plan import make_plan_step
from app.models import Chart, DataSource, Project
from app.services.chart_service import _get_data_source_file_path
from app.storage import THUMBNAILS_DIR


@click.group()
def cli():
    """Chart Chat CLI tools."""
    pass


@cli.command("plan")
@click.argument("chart_id", type=int)
@click.argument("directive")
def plan(chart_id: int, directive: str):
    """Run the plan step for CHART_ID with the given DIRECTIVE."""
    asyncio.run(_run_plan(chart_id, directive))


async def _run_plan(chart_id: int, directive: str):
    db = SessionLocal()
    try:
        chart = db.query(Chart).filter(Chart.id == chart_id).one()
        project_id = chart.project_id
        project = db.query(Project).filter(Project.id == project_id).one()
        messages = [{"role": m.role, "content": m.content} for m in project.messages]
        data_sources = (
            db.query(DataSource).filter(DataSource.project_id == project_id).all()
        )
        existing_charts = db.query(Chart).filter(Chart.project_id == project_id).all()
        ctx = ToolContext(
            db=db,
            project_id=project_id,
            active_chart_id=str(chart_id),
            messages=messages,
            data_sources=data_sources,
            charts=existing_charts,
        )
        plan_step = make_plan_step(get_llm(), ctx)
        result = await plan_step(
            {"input": directive, "plan": [], "past_steps": [], "response": ""}
        )
        click.echo(f'\nPlanning: "{directive}"\n')
        click.echo("Plan steps:")
        for i, step in enumerate(result["plan"], 1):
            click.echo(f"  {i}. {step}")
    finally:
        db.close()


@cli.command("execute")
@click.argument("chart_id", type=int)
@click.argument("step")
def execute(chart_id: int, step: str):
    """Run one execute step for CHART_ID with the given STEP."""
    asyncio.run(_run_execute(chart_id, step))


async def _run_execute(chart_id: int, step: str):
    db = SessionLocal()
    try:
        chart = db.query(Chart).filter(Chart.id == chart_id).one()
        project_id = chart.project_id
        project = db.query(Project).filter(Project.id == project_id).one()
        messages = [{"role": m.role, "content": m.content} for m in project.messages]
        data_sources = (
            db.query(DataSource).filter(DataSource.project_id == project_id).all()
        )
        existing_charts = db.query(Chart).filter(Chart.project_id == project_id).all()
        ctx = ToolContext(
            db=db,
            project_id=project_id,
            active_chart_id=str(chart_id),
            messages=messages,
            data_sources=data_sources,
            charts=existing_charts,
        )
        execute_step = make_execute_step(get_llm(), ctx)
        result = await execute_step(
            {"input": step, "plan": [step], "past_steps": [], "response": ""}
        )
        click.echo(f'\nExecuting: "{step}"\n')
        click.echo("Result:")
        for task, output in result["past_steps"]:
            click.echo(f"  Step: {task}")
            click.echo(f"  Output: {output}")
    finally:
        db.close()


@cli.command("render-thumbnail")
@click.argument("chart_id", type=int)
def render_thumbnail(chart_id: int):
    """Re-render the thumbnail for CHART_ID and print its path."""
    db = SessionLocal()
    try:
        chart = db.query(Chart).filter(Chart.id == chart_id).one()
        file_path = _get_data_source_file_path(db, chart)
        generate_chart_thumbnail(chart.spec, file_path, chart.id)
        thumbnail_path = THUMBNAILS_DIR / f"chart_{chart_id}.png"
        click.echo(str(thumbnail_path))
    finally:
        db.close()
