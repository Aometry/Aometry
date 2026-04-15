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

## Development Workflow

1. **Plan** non-trivial changes first.
2. **Build & Validate:**
   - `npm run build` (tsc + tsc-alias + lint)
   - `npx tsc --noEmit` (fast type check)
   - `npm run lint` (eslint fix)
3. **Module Testing:** Verify `/repo` commands and WebUI endpoints if loader logic changes.

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
