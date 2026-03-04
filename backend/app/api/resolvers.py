import asyncio
import json
import logging

from ariadne import MutationType, ObjectType, QueryType, SubscriptionType

from ..models import Chart, ChartRevision, DataSource, Message, Project, User
from ..pubsub import pubsub
from ..services import chart_service
from ..services.generation import (
    generate_and_update_project_name,
    generate_assistant_response,
)
from ..storage import THUMBNAILS_DIR

logger = logging.getLogger(__name__)

query = QueryType()
mutation = MutationType()
subscription = SubscriptionType()
project_type = ObjectType("Project")
message_type = ObjectType("Message")
data_source_type = ObjectType("DataSource")
chart_type = ObjectType("Chart")
chart_revision_type = ObjectType("ChartRevision")

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


@query.field("chartRevisions")
def resolve_chart_revisions(_, info, chartId):
    return (
        info.context["db"]
        .query(ChartRevision)
        .filter(ChartRevision.chart_id == int(chartId))
        .order_by(ChartRevision.version.desc())
        .all()
    )


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

    task = asyncio.create_task(generate_assistant_response(project.id))
    _active_tasks[project.id] = task
    task.add_done_callback(lambda _: _active_tasks.pop(project.id, None))
    asyncio.create_task(generate_and_update_project_name(project.id, content))

    return project


@mutation.field("sendMessage")
async def resolve_send_message(_, info, projectId, content, activeChartId=None):
    db = info.context["db"]
    project_id = int(projectId)
    message = Message(project_id=project_id, content=content, role="user")
    db.add(message)
    db.commit()
    db.refresh(message)

    task = asyncio.create_task(generate_assistant_response(project_id, activeChartId))
    _active_tasks[project_id] = task
    task.add_done_callback(lambda _: _active_tasks.pop(project_id, None))

    project = db.query(Project).filter(Project.id == project_id).first()
    if project and len(project.messages) == 1:
        asyncio.create_task(generate_and_update_project_name(project_id, content))

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
    updated = await chart_service.update_chart(db, chart, spec=parsed_spec, title=title)
    db.expunge(updated)
    await pubsub.publish(f"chart_updated:{updated.project_id}", updated)
    return updated


@mutation.field("revertChart")
async def resolve_revert_chart(_, info, chartId, version):
    db = info.context["db"]
    chart = db.query(Chart).filter(Chart.id == int(chartId)).first()
    if not chart:
        raise ValueError(f"Chart {chartId} not found")
    reverted = await chart_service.revert_chart(db, chart, version)
    db.expunge(reverted)
    await pubsub.publish(f"chart_updated:{reverted.project_id}", reverted)
    return reverted


@mutation.field("deleteChart")
def resolve_delete_chart(_, info, chartId):
    db = info.context["db"]
    chart = db.query(Chart).filter(Chart.id == int(chartId)).first()
    if not chart:
        raise ValueError(f"Chart {chartId} not found")
    chart_service.delete_chart(db, chart)
    return True


@mutation.field("deleteDataSource")
def resolve_delete_data_source(_, info, dataSourceId):
    db = info.context["db"]
    ds = db.query(DataSource).filter(DataSource.id == int(dataSourceId)).first()
    if not ds:
        raise ValueError(f"DataSource {dataSourceId} not found")
    db.delete(ds)
    db.commit()
    return True


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
def resolve_chart_spec(obj: Chart, *_):
    spec = dict(obj.spec)
    if obj.data_source_id:
        spec["data"] = {"url": f"/api/data-sources/{obj.data_source_id}/data"}
    return json.dumps(spec)


@chart_type.field("createdAt")
def resolve_chart_created_at(obj, *_):
    return obj.created_at.isoformat()


@chart_type.field("thumbnailUrl")
def resolve_chart_thumbnail_url(obj, *_):
    path = THUMBNAILS_DIR / f"chart_{obj.id}.svg"
    return f"/api/charts/{obj.id}/thumbnail" if path.exists() else None


@chart_revision_type.field("createdAt")
def resolve_chart_revision_created_at(obj, *_):
    return obj.created_at.isoformat()


@chart_revision_type.field("spec")
def resolve_chart_revision_spec(obj, *_):
    return json.dumps(obj.spec)
