from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)

    projects: Mapped[list["Project"]] = relationship(back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="projects")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="project", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    content: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(20))  # "user" | "assistant"
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="messages")
