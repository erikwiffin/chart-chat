"""LLM factory shared across submodules."""

import os

from langchain_openai import ChatOpenAI


def _get_llm(tags: list[str] | None = None) -> ChatOpenAI:
    kwargs: dict = {
        "api_key": os.environ["LITELLM_API_KEY"],  # pyright: ignore[reportArgumentType]
        "base_url": os.environ["LITELLM_BASE_URL"],
        "model": os.environ["LITELLM_MODEL"],
    }
    if tags:
        kwargs["extra_body"] = {"metadata": {"tags": tags}}
    return ChatOpenAI(**kwargs)
