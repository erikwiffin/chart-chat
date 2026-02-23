import uuid as _uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, JSON, String, Text
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
    uuid: Mapped[str] = mapped_column(
        String(36), default=lambda: str(_uuid.uuid4()), unique=True
    )
    name: Mapped[str] = mapped_column(String(255))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="projects")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="project", order_by="Message.created_at"
    )
    data_sources: Mapped[list["DataSource"]] = relationship(
        back_populates="project", order_by="DataSource.created_at"
    )
    charts: Mapped[list["Chart"]] = relationship(
        back_populates="project", order_by="Chart.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    content: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(20))  # "user" | "assistant"
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="messages")


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(Text)
    source_type: Mapped[str] = mapped_column(String(50), default="csv")
    columns: Mapped[list] = mapped_column(JSON)
    row_count: Mapped[int] = mapped_column(Integer)
    sample_rows: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="data_sources")


class Chart(Base):
    __tablename__ = "charts"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(255))
    spec: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="charts")
