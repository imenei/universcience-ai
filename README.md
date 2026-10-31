<div align="center">

# UniverScience AI — Learning Studio

**An AI-powered study platform for pharmacy and medical students.**
Turn authorized course PDFs into a guided revision path: grounded tutoring, generated quizzes, and real progress tracking.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E?logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Security](#security)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Responsible Use](#responsible-use)

## Overview

UniverScience AI is a university learning interface built for **pharmacy and medicine students**. Instead of a generic chatbot, it answers questions **only from the course documents a student is authorized to access**, and every answer comes with verifiable citations (document and page).

The platform is deliberately honest: if the database or the AI provider is not configured, the interface shows an explicit "missing configuration" state. It never fabricates answers, citations, scores, or progress to simulate a working RAG system.

## Key Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Accessible courses, quiz attempts, timed sessions and weekly activity, all loaded from real data |
| **Course Library** | University → specialty → year → semester → module → chapter hierarchy, with search, filters and review status (professor-reviewed, AI-generated, pending review) |
| **Learning Studio** | Chapter navigation, central learning content, and a contextual AI tutor side by side |
| **AI Tutor** | Grounded Q&A with page-level citations and the ability to flag an incorrect answer |
| **Quizzes & Exams** | Per-course multiple-choice generation, server-side scoring, corrections and explanations revealed only after submission |
| **Progress** | Results per course, mistakes per concept, eight-week activity, and attempt history |
| **Saved Resources & Settings** | Personal bookmarks and account preferences |
| **Localization** | العربية / Français / English, responsive on desktop and mobile |

## Architecture

```
 PDF upload ──► Extraction ──► Cleaning & chunking ──► Embeddings ──► pgvector
                (per page)                                              │
                                                                        ▼
 Student question ──► Access-filtered vector search ──► Grounded generation
                                                                        │
                                                                        ▼
                                                  Answer + validated page citations
```

1. **Ingestion**: a PDF is parsed page by page, cleaned, split into chunks, embedded and indexed.
2. **Retrieval**: vector search is filtered by `document_access`, so a user can only retrieve passages they are allowed to see.
3. **Generation**: the model answers from the retrieved context only; citations are validated before being returned.
4. **Quizzes**: questions are generated from authorized RAG context, stored without answers, and scored on the server.

## Getting Started

### Prerequisites

- Node.js 22
- pnpm 11.25
- PostgreSQL with the `vector` extension
- A Supabase project
- An API key for an OpenAI-compatible AI provider

### Installation

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

The app runs at <http://localhost:3000>.

### Production build

```bash
pnpm exec tsc --noEmit   # type check
pnpm run build
pnpm start
```

## Configuration

All variables are **server-side only**. Never prefix them with `NEXT_PUBLIC_`, hard-code them, or commit them.

| Variable | Required | Description |
| --- | :---: | --- |
| `RAG_DATABASE_URL` | Yes | PostgreSQL connection string (pgvector enabled) |
| `AI_BASE_URL` | Yes | Base URL of the OpenAI-compatible provider |
| `AI_API_KEY` | Yes | Provider API key |
| `AI_CHAT_MODEL` | Yes | Chat model name |
| `AI_EMBEDDING_MODEL` | Yes | Embedding model name (must output 1536 dimensions) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `FIKRA_COOKIE_SECURE` | Yes | Set to `true` in production to enforce secure cookies |
| `RAG_TOP_K` | No | Number of passages retrieved (default `5`) |
| `RAG_RELEVANCE_THRESHOLD` | No | Minimum similarity score (default `0.50`) |
| `MAX_UPLOAD_MB` | No | Maximum PDF upload size (default `20`) |

> `RAG_DATABASE_URL` is intentionally separate from `DATABASE_URL`, which is reserved by the hosting platform.

## Security

- Secrets stay on the server and are never exposed to the browser.
- Sessions are verified server-side against Supabase (`/auth/v1/user`) using HttpOnly cookies.
- `document_access` is the single source of truth for authorization; retrieval never returns passages outside a user's permissions.
- Quiz scores are computed on the server, and correct answers are revealed only after the attempt is saved.
- Citations are validated before they reach the interface.

## Deployment

A multi-stage Docker image is included:

```bash
docker build -t universcience-ai .
docker run -p 3000:3000 --env-file .env.local universcience-ai
```

For a full end-to-end setup, the database, the AI provider and Supabase must all be configured in the server environment.

## Project Structure

```
app/              Pages: dashboard, library, studio, tutor, quizzes, progress, saved, settings, login
app/api/          Server Route Handlers
components/       Application shell and views
lib/rag/          config, ingestion, ai-provider, retrieval-service, rag-service
lib/              quiz-service, server-auth, data (UI metadata)
db/schema.sql     documents, document_access, document_chunks, ingestion_jobs,
                  chat_history, quiz_sets, quiz_questions, quiz_attempts, quiz_answers
```

## Responsible Use

Only import course material you are authorized to use. UniverScience AI is a revision aid: it does not replace teachers, official course materials, or clinical judgment.
