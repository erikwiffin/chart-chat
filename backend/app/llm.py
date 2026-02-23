import os
from typing import Annotated

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=os.getenv("LITELLM_API_KEY", "dummy"),
        base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
        model=os.getenv("LITELLM_MODEL", "gpt-3.5-turbo"),
    )


def _build_graph(collected_charts: list[dict]):
    @tool
    def create_chart(
        title: Annotated[str, "A descriptive title for the chart"],
        spec: Annotated[dict, "A valid Vega-Lite specification object"],
    ) -> str:
        """Create a Vega-Lite chart from data. Call this when the user asks to visualize data or create a chart."""
        collected_charts.append({"title": title, "spec": spec})
        return f"Chart '{title}' created."

    llm = _get_llm().bind_tools([create_chart])

    def chat_node(state: MessagesState) -> dict:
        response = llm.invoke(state["messages"])
        return {"messages": [response]}

    def should_continue(state: MessagesState) -> str:
        last = state["messages"][-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "tools"
        return END

    builder = StateGraph(MessagesState)
    builder.add_node("chat", chat_node)
    builder.add_node("tools", ToolNode([create_chart]))
    builder.set_entry_point("chat")
    builder.add_conditional_edges("chat", should_continue)
    builder.add_edge("tools", "chat")
    return builder.compile()


async def get_ai_response(messages: list[dict]) -> tuple[str, list[dict]]:
    lc_messages = []
    for msg in messages:
        if msg["role"] == "system":
            lc_messages.append(SystemMessage(content=msg["content"]))
        elif msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))

    collected_charts: list[dict] = []
    graph = _build_graph(collected_charts)
    result = await graph.ainvoke({"messages": lc_messages})
    final_text = result["messages"][-1].content
    return final_text, collected_charts


async def generate_project_name(prompt: str) -> str:
    messages = [
        {
            "role": "user",
            "content": (
                "Generate a 2-4 word title-case project name for a conversation that starts with "
                f"the following message. Respond with only the project name, nothing else.\n\n{prompt}"
            ),
        }
    ]
    text, _ = await get_ai_response(messages)
    return text
