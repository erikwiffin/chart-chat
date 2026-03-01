import asyncio
import json
import logging

from ariadne import MutationType, ObjectType, QueryType, SubscriptionType

from .charts import generate_chart_thumbnail
from .database import SessionLocal
from .llm import get_ai_response
from .llm.generate_project_name import generate_project_name
from .models import Chart, DataSource, Message, Project, User
from .pubsub import pubsub
from .storage import THUMBNAILS_DIR

logger = logging.getLogger(__name__)

query = QueryType()
mutation = MutationType()
subscription = SubscriptionType()
project_type = ObjectType("Project")
message_type = ObjectType("Message")
data_source_type = ObjectType("DataSource")
chart_type = ObjectType("Chart")

_active_tasks: dict[int, asyncio.Task] = {}


# --- Queries ---


@query.field("hello")
def resolve_hello(*_):
    return "Hello from chart-chat!"


@query.field("users")
def resolve_users(_, info):
    return info.context["db"].query(User).all()


@query.field("projects")
def resolve_projects(_, info):
    return info.context["db"].query(Project).all()


@query.field("project")
def resolve_project(_, info, id):
    return info.context["db"].query(Project).filter(Project.id == int(id)).first()


# --- Mutations ---


@mutation.field("createUser")
def resolve_create_user(_, info, name, email):
    db = info.context["db"]
    user = User(name=name, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@mutation.field("createProject")
def resolve_create_project(_, info, name):
    db = info.context["db"]
    project = Project(name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@mutation.field("createProjectFromPrompt")
async def resolve_create_project_from_prompt(_, info, content):
    db = info.context["db"]
    project = Project(name="")
    db.add(project)
    db.commit()
    db.refresh(project)

    message = Message(project_id=project.id, content=content, role="user")
    db.add(message)
    db.commit()
    db.refresh(message)

    task = asyncio.create_task(_generate_assistant_response(project.id))
    _active_tasks[project.id] = task
    asyncio.create_task(_generate_and_update_project_name(project.id, content))

    return project


@mutation.field("sendMessage")
async def resolve_send_message(_, info, projectId, content, activeChartId=None):
    db = info.context["db"]
    project_id = int(projectId)
    message = Message(project_id=project_id, content=content, role="user")
    db.add(message)
    db.commit()
    db.refresh(message)

    task = asyncio.create_task(_generate_assistant_response(project_id, activeChartId))
    _active_tasks[project_id] = task

    # If this is the first message, generate project name from prompt (same as createProjectFromPrompt)
    project = db.query(Project).filter(Project.id == project_id).first()
    if project and len(project.messages) == 1:
        asyncio.create_task(_generate_and_update_project_name(project_id, content))

    return message


@mutation.field("stopGeneration")
async def resolve_stop_generation(_, info, projectId):
    task = _active_tasks.pop(int(projectId), None)
    if task:
        task.cancel()
        return True
    return False


@mutation.field("updateChart")
async def resolve_update_chart(_, info, chartId, title, spec):
    db = info.context["db"]
    chart = db.query(Chart).filter(Chart.id == int(chartId)).first()
    if not chart:
        raise ValueError(f"Chart {chartId} not found")
    parsed_spec = json.loads(spec)
    parsed_spec.pop("data", None)
    chart.title = title
    chart.spec = parsed_spec
    db.commit()
    db.refresh(chart)
    await _update_thumbnail(chart, db)
    await pubsub.publish(f"chart_updated:{chart.project_id}", chart)
    return chart


async def _update_thumbnail(chart: Chart, db):
    file_path = None
    if chart.data_source_id:
        ds = db.query(DataSource).filter(DataSource.id == chart.data_source_id).first()
        if ds:
            file_path = ds.file_path
    try:
        await asyncio.to_thread(
            generate_chart_thumbnail, chart.spec, file_path, chart.id
        )
    except Exception as e:
        print(f"Thumbnail generation failed for chart {chart.id}: {e}")


async def _generate_and_update_project_name(project_id: int, prompt: str):
    db = SessionLocal()
    try:
        name = await generate_project_name(prompt, project_id=project_id)
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return
        project.name = name
        db.commit()
        db.refresh(project)
        await pubsub.publish(f"project_name:{project_id}", project)
    except Exception as e:
        print(f"Error generating project name: {e}")
    finally:
        db.close()


async def _generate_assistant_response(
    project_id: int, active_chart_id: str | None = None
):
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return

        messages = [
            {"role": msg.role, "content": msg.content} for msg in project.messages
        ]

        data_sources = (
            db.query(DataSource).filter(DataSource.project_id == project_id).all()
        )

        existing_charts = db.query(Chart).filter(Chart.project_id == project_id).all()

        async def on_status(task: str, message: str):
            await pubsub.publish(
                f"status:{project_id}", {"task": task, "message": message}
            )

        content, ctx = await get_ai_response(
            messages,
            data_sources,
            existing_charts,
            active_chart_id,
            status_callback=on_status,
            project_id=project_id,
        )

        # Save new charts and update modified charts
        for chart in ctx.charts:
            if chart.id is None:
                # New chart created by tools
                chart.project_id = project_id
            db.add(chart)
            db.commit()
            db.refresh(chart)
            await _update_thumbnail(chart, db)
            await pubsub.publish(f"chart:{project_id}", chart)

        assistant_msg = Message(
            project_id=project_id, content=content, role="assistant"
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        await pubsub.publish(f"project:{project_id}", assistant_msg)
        _active_tasks.pop(project_id, None)
    except Exception as e:
        logger.error("Error generating assistant response: %s", e, exc_info=True)
        _active_tasks.pop(project_id, None)
        try:
            error_msg = Message(
                project_id=project_id,
                content="I'm sorry, I encountered an error while generating a response. Please try again.",
                role="assistant",
            )
            db.add(error_msg)
            db.commit()
            db.refresh(error_msg)
            await pubsub.publish(f"project:{project_id}", error_msg)
        except Exception:
            logger.exception("Failed to send error message to frontend", exc_info=True)
    finally:
        db.close()


# --- Subscriptions ---


@subscription.source("messageAdded")
async def message_added_source(obj, info, projectId):
    async for message in pubsub.subscribe(f"project:{projectId}"):
        yield message


@subscription.field("messageAdded")
def message_added_resolver(message, info, projectId):
    return message


@subscription.source("projectNameUpdated")
async def project_name_updated_source(obj, info, projectId):
    async for project in pubsub.subscribe(f"project_name:{projectId}"):
        yield project


@subscription.field("projectNameUpdated")
def project_name_updated_resolver(project, info, projectId):
    return project


@subscription.source("chartAdded")
async def chart_added_source(obj, info, projectId):
    async for chart in pubsub.subscribe(f"chart:{projectId}"):
        yield chart


@subscription.field("chartAdded")
def chart_added_resolver(chart, info, projectId):
    return chart


@subscription.source("chartUpdated")
async def chart_updated_source(obj, info, projectId):
    async for chart in pubsub.subscribe(f"chart_updated:{projectId}"):
        yield chart


@subscription.field("chartUpdated")
def chart_updated_resolver(chart, info, projectId):
    return chart


@subscription.source("statusUpdate")
async def status_update_source(obj, info, projectId):
    async for event in pubsub.subscribe(f"status:{projectId}"):
        yield event


@subscription.field("statusUpdate")
def status_update_resolver(event, info, projectId):
    return event


# --- Field resolvers (camelCase mapping) ---


@project_type.field("createdAt")
def resolve_project_created_at(obj, *_):
    return obj.created_at.isoformat()


@project_type.field("dataSources")
def resolve_project_data_sources(obj, *_):
    return obj.data_sources


@project_type.field("charts")
def resolve_project_charts(obj, *_):
    return obj.charts


@message_type.field("createdAt")
def resolve_message_created_at(obj, *_):
    return obj.created_at.isoformat()


@data_source_type.field("sourceType")
def resolve_data_source_source_type(obj, *_):
    return obj.source_type


@data_source_type.field("rowCount")
def resolve_data_source_row_count(obj, *_):
    return obj.row_count


@data_source_type.field("createdAt")
def resolve_data_source_created_at(obj, *_):
    return obj.created_at.isoformat()


@chart_type.field("spec")
def resolve_chart_spec(obj, *_):
    spec = dict(obj.spec)
    if obj.data_source_id:
        spec["data"] = {"url": f"/api/data-sources/{obj.data_source_id}/data"}
    return json.dumps(spec)


@chart_type.field("createdAt")
def resolve_chart_created_at(obj, *_):
    return obj.created_at.isoformat()


@chart_type.field("thumbnailUrl")
def resolve_chart_thumbnail_url(obj, *_):
    path = THUMBNAILS_DIR / f"chart_{obj.id}.png"
    return f"/api/charts/{obj.id}/thumbnail" if path.exists() else None
