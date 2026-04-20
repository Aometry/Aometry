# CLAUDE.md — Aometry

This file provides guidance for AI assistants working in this repository.

## Project Overview

Aometry is a modular Discord bot platform built with TypeScript and Discord.js.

- **Core:** `src/` (structures, handlers, utilities)
- **Modules:** `src/modules/Core/` (built-in) and `installed_modules/` (3rd party)
- **Build:** `dist/`
- **Web:** `src/web/server.ts` (Admin UI & API)

## Core Principles

- **Modularity:** Keep the platform module-agnostic.
- **Micro-Changes:** Prefer small, reversible changes over broad refactors.
- **Safety:** Prioritize type safety and runtime stability.
- **No Semicolons:** Follow the [Standard](https://standardjs.com/) code style.

## Security Principles

Aometry exposes a management API with direct control over bot configuration and
installed modules. Treat it accordingly.

- **Least privilege by default.** Every config option should default to the most
  restrictive viable setting. Widen access explicitly, never as a convenience.
- **Zero trust networking.** Assume the bot is publicly reachable. Do not rely on
  network topology for security (e.g. "it's only on localhost" is not a substitute
  for auth).
- **Never default to wildcard CORS.** `ALLOWED_ORIGINS=*` is not an acceptable
  default or fallback. If a connectivity problem arises, the fix is correct
  configuration, not wider permissions.
- **API key is the trust boundary.** All management endpoints require `X-API-KEY`.
  Do not add unauthenticated endpoints without explicit justification.
- **Setup wizard is localhost-only.** The setup server must never bind to `0.0.0.0`
  except in Docker (where port mapping is the operator's responsibility). Once
  setup is complete, the wizard must not be reachable.
- **Do not log secrets.** `API_KEY`, `BOT_TOKEN`, and any OAuth credentials must
  never appear in logs or error output.

## Development Workflow

1. **Plan** non-trivial changes first.
2. **Build & Validate:**
   - `npm run build` (tsc + tsc-alias + lint)
   - `npx tsc --noEmit` (fast type check)
   - `npm run lint` (eslint fix)
3. **Module Testing:** Verify `/repo` commands and WebUI endpoints if loader logic changes.
4. **Verify Build:** Always run `npm run build` to ensure no lint or type errors exist before completing a task.
## Engineering Conventions

### Code Style (Standard)
- **No semicolons.**
- **2-space indentation.**
- **Single quotes** for strings.

### Imports & Aliases
- Use `@/` for `src/` (e.g., `import Bot from '@/structures/Bot'`).
- Use `@installed/` for `installed_modules/`.

### Builders (Critical)
Always use the provided builders for commands and events to ensure type safety:
- **Commands:** `createCommand('name', 'desc', (builder) => { ... })` from `@/builders/CommandBuilder`.
- **Events:** `createEvent(Events.Name, { execute: ({ client, args }) => { ... } })` from `@/builders/EventBuilder`.

### Event Handling & Logging
- **Do not log raw Discord entities** (Messages, Members, Guilds) in high frequency events. Their circular serialized nature causes profound performance degradation and massive log files. Use `.id` or specific attributes like `.content` instead.

### Persistence & Database
- Use `DatabaseManager.getSqlite()` for persistent state.
- Governance tables (NCAP, motions) are pre-initialized in SQLite.

## Runtime & Architecture

- **Entry:** `src/index.ts`
- **Client:** `src/structures/Bot.ts` (extended Client)
- **Handlers:** `src/handler/commandHandler.ts` and `src/handler/eventHandler.ts`
- **Managers:** `RepositoryManager` (lifecycle), `RuntimeModuleManager` (hot-reload).

## Web Admin UI

- Express-based server in `src/web/server.ts`.
- Secure all `/api/*` routes with `API_KEY` (x-api-key header).
- CORS allowed origins defined in `.env`.

## Module Sync Contract

Sync is metadata-driven (syncRemoteUrl, syncBranch, etc.).
Default token env: `MODULE_SYNC_GITHUB_TOKEN`.
