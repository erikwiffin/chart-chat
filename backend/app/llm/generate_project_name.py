"""Generate a short project name from a user prompt."""

from langchain_core.messages import HumanMessage

from .common import _get_llm


async def generate_project_name(prompt: str) -> str:
    llm = _get_llm()
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
