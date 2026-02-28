"""LLM factory shared across submodules."""

import os

from langchain_openai import ChatOpenAI


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=os.getenv(
            "LITELLM_API_KEY", "dummy"
        ),  # pyright: ignore[reportArgumentType]
        base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
        model=os.getenv("LITELLM_MODEL", "gpt-3.5-turbo"),
    )
