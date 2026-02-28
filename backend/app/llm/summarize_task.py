"""Summarize a task into a short present-participle phrase."""

from langchain_core.messages import HumanMessage

from .common import _get_llm


async def summarize_task(task: str, project_id: int | None = None) -> str:
    """Use a brief LLM call to summarize a task into a 4-5 word present-participle phrase."""
    tags = [f"project:{project_id}", "task:summarize-task"] if project_id else None
    llm = _get_llm(tags=tags)
    msg = HumanMessage(
        content=(
            "Summarize this task in 4-5 words as a present-participle phrase "
            "(e.g., 'drawing bar chart', 'reviewing data'). "
            f"Task: {task}\n\nRespond with only the short phrase, no punctuation."
        )
    )
    response = await llm.ainvoke([msg])
    content = response.content
    assert isinstance(content, str)
    return content.strip()
