# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chart Chat is a chat application with project/conversation management and chart visualization. It uses a React + TypeScript frontend communicating with a Python FastAPI backend via GraphQL.

## Development Commands

### Frontend (`/frontend`)

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Type-check and build for production
npm run lint       # Run ESLint
npm run codegen    # Regenerate TypeScript types from GraphQL schema
```

### Backend (`/backend`)

```bash
uv run uvicorn main:app --reload   # Start dev server at http://localhost:8000
```

To add a dependency: `uv add <package>`

The backend serves a GraphQL playground at `http://localhost:8000/graphql/`.

## Architecture

### Stack

- **Frontend**: React 19, TypeScript, Vite, Apollo Client, Tailwind CSS + DaisyUI
- **Backend**: FastAPI, Ariadne (schema-first GraphQL), SQLAlchemy 2.0, SQLite
- **API**: GraphQL — all data access goes through `/graphql/`

### Backend Structure

- `backend/app/config.py` — Centralized settings via pydantic-settings
- `backend/app/schema.graphql` — GraphQL type definitions (SDL)
- `backend/app/models.py` — SQLAlchemy ORM models (User, Project, Message, DataSource, Chart, ChartRevision)
- `backend/app/database.py` — SQLAlchemy engine, session factory, declarative base
- `backend/app/app.py` — FastAPI app wiring (CORS, GraphQL endpoint, router)
- `backend/app/api/resolvers.py` — Thin GraphQL query/mutation/subscription resolvers
- `backend/app/api/routes.py` — REST endpoints (data sources, uploads, thumbnails) using APIRouter + Depends
- `backend/app/services/chart_service.py` — Chart lifecycle: create, update, revert, delete (version/revision/thumbnail)
- `backend/app/services/generation.py` — LLM response orchestration

### Frontend Structure

- `frontend/src/graphql/*.graphql` — GraphQL query/mutation documents
- `frontend/src/__generated__/` — Auto-generated TypeScript types (via `npm run codegen`)
- `frontend/src/apolloClient.ts` — Apollo client pointed at `http://localhost:8000/graphql/`

Components follow a **logic/view split**: each feature has a `Foo.tsx` (data fetching, state, handlers) paired with `FooView.tsx` (pure rendering). The main layout is a resizable two-panel split: `ChatPanel` (left, ~33%) and `MainPanel` (right, ~67%).

### GraphQL Workflow

When adding or modifying GraphQL operations:
1. Update `backend/app/schema.graphql` with new types/fields
2. Update `backend/app/api/resolvers.py` with resolver logic
3. Add/update `.graphql` document files in `frontend/src/graphql/`
4. Run `npm run codegen` in `/frontend` to regenerate TypeScript types
5. Import generated document constants (e.g., `GetProjectsDocument`) in components
