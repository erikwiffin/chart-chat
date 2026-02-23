import asyncio
import json

from ariadne import MutationType, ObjectType, QueryType, SubscriptionType

from .database import SessionLocal
from .llm import generate_project_name, get_ai_response
from .models import Chart, DataSource, Message, Project, User
from .pubsub import pubsub

query = QueryType()
mutation = MutationType()
subscription = SubscriptionType()
project_type = ObjectType("Project")
message_type = ObjectType("Message")
data_source_type = ObjectType("DataSource")
chart_type = ObjectType("Chart")


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

    asyncio.create_task(_generate_assistant_response(project.id))
    asyncio.create_task(_generate_and_update_project_name(project.id, content))

    return project


@mutation.field("sendMessage")
async def resolve_send_message(_, info, projectId, content):
    db = info.context["db"]
    message = Message(project_id=int(projectId), content=content, role="user")
    db.add(message)
    db.commit()
    db.refresh(message)

    asyncio.create_task(_generate_assistant_response(int(projectId)))

    return message


async def _generate_and_update_project_name(project_id: int, prompt: str):
    db = SessionLocal()
    try:
        name = await generate_project_name(prompt)
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


async def _generate_assistant_response(project_id: int):
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return

        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in project.messages
        ]

        # Prepend data source context if any exist
        data_sources = (
            db.query(DataSource).filter(DataSource.project_id == project_id).all()
        )
        if data_sources:
            context_lines = ["The following data sources are available:\n"]
            for ds in data_sources:
                context_lines.append(f"File: {ds.name}")
                context_lines.append(f"Columns: {', '.join(ds.columns)}")
                if ds.sample_rows:
                    context_lines.append(
                        f"Sample rows (first {len(ds.sample_rows)}):\n"
                        + json.dumps(ds.sample_rows, indent=2)
                    )
                context_lines.append("")
            system_content = "\n".join(context_lines)
            messages = [{"role": "system", "content": system_content}] + messages

        content, created_charts = await get_ai_response(messages)

        # Save and publish charts
        for chart_data in created_charts:
            chart = Chart(
                project_id=project_id,
                title=chart_data["title"],
                spec=chart_data["spec"],
            )
            db.add(chart)
            db.commit()
            db.refresh(chart)
            await pubsub.publish(f"chart:{project_id}", chart)

        assistant_msg = Message(project_id=project_id, content=content, role="assistant")
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        await pubsub.publish(f"project:{project_id}", assistant_msg)
    except Exception as e:
        print(f"Error generating assistant response: {e}")
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
    return json.dumps(obj.spec)


@chart_type.field("createdAt")
def resolve_chart_created_at(obj, *_):
    return obj.created_at.isoformat()
