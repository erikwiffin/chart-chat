from ariadne import MutationType, ObjectType, QueryType

from .models import Message, Project, User

query = QueryType()
mutation = MutationType()
project_type = ObjectType("Project")
message_type = ObjectType("Message")


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


@mutation.field("sendMessage")
def resolve_send_message(_, info, projectId, content):
    db = info.context["db"]
    message = Message(project_id=int(projectId), content=content, role="user")
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


# --- Field resolvers (camelCase mapping) ---

@project_type.field("createdAt")
def resolve_project_created_at(obj, *_):
    return obj.created_at.isoformat()


@message_type.field("createdAt")
def resolve_message_created_at(obj, *_):
    return obj.created_at.isoformat()
