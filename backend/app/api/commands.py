import asyncio

import click

from app.charts import generate_chart_thumbnail
from app.database import SessionLocal
from app.vega_lite_docs import search_vega_lite_docs
from app.llm.common import get_llm
from app.llm.context import PlanExecute, ToolContext
from app.llm.execute import make_execute_step
from app.llm.plan import make_plan_step
from app.llm.replan import make_replan_step
from app.models import Chart, DataSource, Project
from app.pubsub import ProjectPubSub, pubsub
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


async def _run_plan(project_id: int, directive: str):
    db = SessionLocal()
    try:
        # chart = db.query(Chart).filter(Chart.id == chart_id).one()
        # project_id = chart.project_id
        project = db.query(Project).filter(Project.id == project_id).one()
        messages = [{"role": m.role, "content": m.content} for m in project.messages]
        data_sources = (
            db.query(DataSource).filter(DataSource.project_id == project_id).all()
        )
        existing_charts = db.query(Chart).filter(Chart.project_id == project_id).all()
        ctx = ToolContext(
            db=db,
            project_id=project_id,
            active_chart_id=None,
            messages=messages,
            data_sources=data_sources,
            charts=existing_charts,
            pubsub=ProjectPubSub(pubsub, project_id),
        )
        plan_step = make_plan_step(get_llm(), ctx)
        state = PlanExecute(
            input=directive,
            plan=[],
            past_steps=[],
            response="",
        )
        result = await plan_step(state)
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
            active_chart_id=chart_id,
            messages=messages,
            data_sources=data_sources,
            charts=existing_charts,
            pubsub=ProjectPubSub(pubsub, project_id),
        )
        execute_step = make_execute_step(get_llm(), ctx)
        state = PlanExecute(
            input=step,
            plan=[step],
            past_steps=[],
            response="",
        )
        result = await execute_step(state)
        click.echo(f'\nExecuting: "{step}"\n')
        click.echo("Result:")
        for task, output in result["past_steps"]:
            click.echo(f"  Step: {task}")
            click.echo(f"  Output: {output}")
    finally:
        db.close()


@cli.command("replan")
@click.argument("chart_id", type=int)
@click.argument("objective")
@click.option(
    "--plan-step",
    "plan_steps",
    multiple=True,
    help="A remaining plan step. Repeat to pass multiple steps.",
)
@click.option(
    "--past-step",
    "past_steps_raw",
    multiple=True,
    help='A completed step in the form "task::result". Repeatable.',
)
def replan(
    chart_id: int,
    objective: str,
    plan_steps: tuple[str, ...],
    past_steps_raw: tuple[str, ...],
):
    """Run the replan step for CHART_ID with objective, plan, and past step outputs."""
    past_steps: list[tuple[str, str]] = []
    for value in past_steps_raw:
        if "::" not in value:
            raise click.BadParameter(
                f'Invalid format: "{value}". Expected "task::result".',
                param_hint="--past-step",
            )
        task, result = value.split("::", 1)
        if not task.strip():
            raise click.BadParameter(
                "Task in --past-step cannot be empty.",
                param_hint="--past-step",
            )
        past_steps.append((task.strip(), result.strip()))
    asyncio.run(_run_replan(chart_id, objective, list(plan_steps), past_steps))


async def _run_replan(
    chart_id: int,
    objective: str,
    plan_steps: list[str],
    past_steps: list[tuple[str, str]],
):
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
            pubsub=ProjectPubSub(pubsub, project_id),
            active_chart_id=chart_id,
            messages=messages,
            data_sources=data_sources,
            charts=existing_charts,
        )
        replan_step = make_replan_step(get_llm(), ctx)
        state = PlanExecute(
            input=objective,
            plan=plan_steps,
            past_steps=past_steps,
            response="",
        )
        result = await replan_step(state)
        click.echo(f'\nReplanning objective: "{objective}"\n')
        if result.get("response"):
            click.echo("Response:")
            click.echo(f'  {result["response"]}')
            return
        click.echo("Remaining steps:")
        for i, step in enumerate(result.get("plan", []), 1):
            click.echo(f"  {i}. {step}")
    finally:
        db.close()


@cli.command("search-docs")
@click.argument("query")
def search_docs(query: str):
    """Search the Vega-Lite documentation for QUERY."""
    result = search_vega_lite_docs(query)
    click.echo(result)


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
