import os

from langchain_core.messages import AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, MessagesState, StateGraph


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=os.getenv("LITELLM_API_KEY", "dummy"),
        base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
        model=os.getenv("LITELLM_MODEL", "gpt-3.5-turbo"),
    )


def _chat_node(state: MessagesState) -> dict:
    llm = _get_llm()
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


_graph_builder = StateGraph(MessagesState)
_graph_builder.add_node("chat", _chat_node)
_graph_builder.set_entry_point("chat")
_graph_builder.add_edge("chat", END)
chat_graph = _graph_builder.compile()


async def get_ai_response(messages: list[dict]) -> str:
    lc_messages = []
    for msg in messages:
        if msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))
    result = await chat_graph.ainvoke({"messages": lc_messages})
    return result["messages"][-1].content
