# Chart Chat

A chat application for AI-assisted chart generation. Upload your data, describe what you want to visualize, and iteratively refine Vega-Lite charts through conversation with an LLM.

## Recording

<video src="Chart%20Chat%20Recording.mp4" controls playsinline width="100%">
  <a href="Chart%20Chat%20Recording.mp4">Download the recording</a> if playback is not supported.
</video>


## Architecture

- **Frontend**: React 19, TypeScript, Vite, Apollo Client, Tailwind CSS + DaisyUI
- **Backend**: Python, FastAPI, Ariadne (schema-first GraphQL), SQLAlchemy 2.0, SQLite
- **API**: GraphQL — all data access goes through `/graphql/`
- **AI**: LangGraph plan-and-execute agent, LiteLLM for model access

## How the AI Agent Works

The backend uses a **Plan → Execute → Replan** loop built with LangGraph:

```
START → Planner → Executor → Replanner → (done or back to Executor)
```

1. **Planner** — Receives the user's request and breaks it into an ordered list of steps. Does no tool calls; pure reasoning only.

2. **Executor** — Picks up the next step and executes it using one or more tools:
   - `list_data_sources`, `preview_data_source`, `describe_data_source` — inspect uploaded data
   - `search_vega_lite_docs` — look up Vega-Lite field/transform documentation
   - `create_chart`, `list_charts`, `get_chart`, `render_chart` — manage charts
   - `edit_chart` — apply a JSON Patch to surgically update a chart spec
   - `revert_chart` — roll back to a previous chart revision

3. **Replanner** — Reviews what has been accomplished, optionally renders the current chart for visual validation, then either:
   - Returns a final response to the user, or
   - Issues a revised plan and loops back to the Executor

Key design choices:
- **JSON Patch** for chart edits keeps changes surgical and reviewable
- **Chart version history** enables safe rollback at any revision
- **Vega-Lite declarative transforms** are preferred over pre-processing data with pandas

## Prerequisites

- Node.js 18+
- Python 3.13+
- [`uv`](https://docs.astral.sh/uv/) package manager
- A LiteLLM-compatible LLM provider (OpenAI, Anthropic, a local proxy, etc.)

## Setup

```bash
git clone <repo-url>
cd chart-chat

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your values

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env if your backend runs on a non-default port
```

## Running the App

**Backend** (from the repo root):

```bash
cd backend
uv run uvicorn main:app --reload
# Runs at http://localhost:8000
# GraphQL playground at http://localhost:8000/graphql/
```

**Frontend** (from the repo root):

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

## Testing

Backend tests only (no frontend tests currently):

```bash
cd backend
uv run pytest
```