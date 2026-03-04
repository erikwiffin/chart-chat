"""Chart lifecycle: create, update, revert, delete.

Every chart mutation goes through this module. Each function owns the full
side-effect chain: version management, revision creation, thumbnail generation.
"""

import asyncio
import logging

from sqlalchemy.orm import Session

from ..charts import generate_chart_thumbnail
from ..models import Chart, ChartRevision, DataSource

logger = logging.getLogger(__name__)


def _get_data_source_file_path(db: Session, chart: Chart) -> str | None:
    if not chart.data_source_id:
        return None
    ds = db.query(DataSource).filter(DataSource.id == chart.data_source_id).first()
    return ds.file_path if ds else None


async def _generate_thumbnail(db: Session, chart: Chart) -> None:
    file_path = _get_data_source_file_path(db, chart)
    try:
        await asyncio.to_thread(
            generate_chart_thumbnail, chart.spec, file_path, chart.id
        )
    except Exception as e:
        logger.warning("Thumbnail generation failed for chart %s: %s", chart.id, e)


async def create_chart(
    db: Session,
    project_id: int,
    title: str,
    spec: dict,
    data_source_id: int | None = None,
) -> Chart:
    """Persist a new chart with its first revision and thumbnail."""
    chart = Chart(
        project_id=project_id,
        title=title,
        spec=spec,
        data_source_id=data_source_id,
    )
    db.add(chart)
    db.commit()
    revision = ChartRevision(
        chart_id=chart.id, version=chart.version, spec=dict(chart.spec)
    )
    db.add(revision)
    db.commit()
    await _generate_thumbnail(db, chart)
    return chart


async def update_chart(
    db: Session,
    chart: Chart,
    spec: dict,
    title: str | None = None,
) -> Chart:
    """Update spec, bump version, create revision, regenerate thumbnail."""
    if title is not None:
        chart.title = title
    chart.spec = spec
    chart.version += 1
    db.commit()
    revision = ChartRevision(
        chart_id=chart.id, version=chart.version, spec=dict(chart.spec)
    )
    db.add(revision)
    db.commit()
    await _generate_thumbnail(db, chart)
    return chart


async def revert_chart(db: Session, chart: Chart, version: int) -> Chart:
    """Revert to a previous version (creates a new version via update_chart)."""
    revision = (
        db.query(ChartRevision)
        .filter(
            ChartRevision.chart_id == chart.id,
            ChartRevision.version == version,
        )
        .first()
    )
    if not revision:
        raise ValueError(f"Version {version} not found for chart {chart.id}")
    return await update_chart(db, chart, spec=dict(revision.spec))


def delete_chart(db: Session, chart: Chart) -> None:
    db.delete(chart)
    db.commit()
