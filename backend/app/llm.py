import json
import os

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, MessagesState, StateGraph


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=os.getenv("LITELLM_API_KEY", "dummy"),
        base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
        model=os.getenv("LITELLM_MODEL", "gpt-3.5-turbo"),
    )


_CREATE_CHART_TOOL = {
    "type": "function",
    "function": {
        "name": "create_chart",
        "description": (
            "Create a Vega-Lite chart from data. Call this when the user asks to "
            "visualize data or create a chart."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "A descriptive title for the chart",
                },
                "spec": {
                    "type": "object",
                    "description": "A valid Vega-Lite specification object",
                },
            },
            "required": ["title", "spec"],
        },
    },
}


def _build_graph(collected_charts: list[dict]):
    llm = _get_llm().bind_tools([_CREATE_CHART_TOOL])

    def chat_node(state: MessagesState) -> dict:
        response = llm.invoke(state["messages"])
        return {"messages": [response]}

    def tool_node(state: MessagesState) -> dict:
        last = state["messages"][-1]
        tool_results = []
        for call in last.tool_calls:
            if call["name"] == "create_chart":
                args = call["args"]
                collected_charts.append(
                    {"title": args["title"], "spec": args["spec"]}
                )
                tool_results.append(
                    ToolMessage(
                        content=f"Chart '{args['title']}' created.",
                        tool_call_id=call["id"],
                    )
                )
        return {"messages": tool_results}

    def should_continue(state: MessagesState) -> str:
        last = state["messages"][-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "tools"
        return END

    builder = StateGraph(MessagesState)
    builder.add_node("chat", chat_node)
    builder.add_node("tools", tool_node)
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
