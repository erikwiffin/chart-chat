"""LLM factory shared across submodules."""

from langchain_openai import ChatOpenAI

from ..config import settings


def _get_llm(tags: list[str] | None = None) -> ChatOpenAI:
    kwargs: dict = {
        "api_key": settings.litellm_api_key,  # pyright: ignore[reportArgumentType]
        "base_url": settings.litellm_base_url,
        "model": settings.litellm_model,
    }
    if tags:
        kwargs["extra_body"] = {"metadata": {"tags": tags}}
    return ChatOpenAI(**kwargs)
