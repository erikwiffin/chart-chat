"""Generate a short project name from a user prompt."""

from langchain_core.messages import HumanMessage

from .common import get_llm


async def generate_project_name(prompt: str, project_id: int | None = None) -> str:
    tags = (
        [f"project:{project_id}", "task:generate-project-name"] if project_id else None
    )
    llm = get_llm(tags=tags)
    msg = HumanMessage(
        content=(
            "Generate a 2-4 word title-case project name for a conversation starting with: "
            f"{prompt}\n\nRespond with only the project name."
        )
    )
    response = await llm.ainvoke([msg])
    content = response.content
    assert isinstance(content, str)
    return content
