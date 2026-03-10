"""LLM response orchestration — generate assistant responses and project names."""

import logging

from ..database import SessionLocal
from ..llm import get_ai_response
from ..llm.generate_project_name import generate_project_name
from ..models import Chart, DataSource, Message, Project
from ..pubsub import pubsub

logger = logging.getLogger(__name__)


async def generate_assistant_response(
    project_id: int, active_chart_id: str | None = None
):
    db = SessionLocal()
    try:
        await pubsub.publish(
            f"status:{project_id}",
            {"task": "", "message": "Thinking...", "isGenerating": True},
        )

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

        content, ctx = await get_ai_response(
            db=db,
            project_id=project_id,
            messages=messages,
            data_sources=data_sources,
            existing_charts=existing_charts,
            active_chart_id=active_chart_id,
        )

        # Expunge charts from the session (publishing now happens in tools)
        for chart in ctx.charts:
            db.expunge(instance=chart)

        # Save assistant message
        assistant_msg = Message(
            project_id=project_id, content=content, role="assistant"
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)
        await pubsub.publish(f"message_added:{project_id}", assistant_msg)
    except Exception as e:
        logger.error("Error generating assistant response: %s", e, exc_info=True)
        try:
            error_msg = Message(
                project_id=project_id,
                content="I'm sorry, I encountered an error while generating a response. Please try again.",
                role="assistant",
            )
            db.add(error_msg)
            db.commit()
            db.refresh(error_msg)
            await pubsub.publish(f"message_added:{project_id}", error_msg)
        except Exception:
            logger.exception("Failed to send error message to frontend")
    finally:
        await pubsub.publish(
            f"status:{project_id}",
            {"task": "", "message": "", "isGenerating": False},
        )
        db.close()


async def generate_and_update_project_name(project_id: int, prompt: str):
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
        logger.error("Error generating project name: %s", e)
    finally:
        db.close()
