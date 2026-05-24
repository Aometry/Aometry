<img width="200" height="200" align="left" style="float: left; margin: 0 10px 0 0;" alt="Aometry" src="https://camo.githubusercontent.com/c83d2316c5d2e2a6a50ce04825b0b4d9b0ec5d1a70ddbd17acb6f2d26cc4f291/68747470733a2f2f692e696d6775722e636f6d2f52646e424b76732e6a7067">

# Aometry

![GitHub top language](https://img.shields.io/github/languages/top/Aometry/Aometry?color=0072CE&style=for-the-badge)
![Requires](https://img.shields.io/badge/requires-discordJS-5865F2?style=for-the-badge)
![Code Style](https://img.shields.io/badge/Style_Guide-Standard-brightgreen?style=for-the-badge)
![Build Status](https://github.com/Aometry/Aometry/actions/workflows/ci.yml/badge.svg)

<br clear="both"/>

Aometry is a **module-agnostic**, modular Discord bot platform built with **Discord.js v14** and **TypeScript**. It's designed for both developers and server owners:

- **Developers:** Create and share commands and event handlers as reusable modules via Git repositories.
- **Server Owners:** Customise your bot with exactly the features you need by installing modules from various sources.

## Features

- **Module-Agnostic Design:** The core platform has zero knowledge of specific modules. All functionality is delivered through installable modules.
- **Repository System:** Install and manage modules from Git-based repositories using the `info.json` manifest contract.
- **Web Setup Wizard:** First-run configuration through a modern browser-based wizard — no manual `.env` editing required.
- **Central Management Dashboard:** Manage your bot remotely via [aometry.finneh.xyz](https://aometry.finneh.xyz) using an API Key (Jellyfin-style architecture).
- **Slash Commands:** Modern and intuitive command interface.
- **TypeScript:** Type-safe and scalable architecture.

## Architecture

The codebase is written in TypeScript and compiled to JavaScript.

- **Source:** `src/` contains all TypeScript source code.
- **Compiled:** `dist/` contains the compiled JavaScript output.
- **Modules:** Built-in modules are in `src/modules/Core/`. Third-party extensions are dynamically loaded from `installed_modules/`.
- **Config:** `src/config.ts` handles environment-driven configuration.
- **Entry Point:** `src/index.ts` (development) or `dist/src/index.js` (production).
- **API Server:** `src/web/server.ts` exposes a JSON API for remote management.

## Prerequisites

- Node.js v18+
- NPM
- Docker (Recommended for production)

## Getting Started

### Installation & First Run

1. Clone the repository.
2. Run `npm install`.
3. Run `npm run dev` to start the bot.
4. The **Setup Wizard** will launch automatically at `http://localhost:3000`. Visit it in your browser to configure:
   - **Bot Token** — Your Discord bot token.
   - **Developer ID** — Your Discord user ID.
   - **Database URL** — Optional MongoDB connection string (defaults to SQLite).
5. An **API Key** will be auto-generated and displayed once. **Copy it** — you'll need it to connect the management dashboard.
6. Restart your bot after the wizard completes.

### Building for Production

1. Run `npm run build` to compile the TypeScript code.
2. Run `npm start` to run the compiled bot.

### Docker Deployment

1. Ensure you have Docker and Docker Compose installed.
2. Run `docker compose up -d --build` to start the bot.
3. On first run, the Setup Wizard will be available at `http://localhost:3000`.
4. After setup, restart the container: `docker compose restart`.
5. View logs with `docker compose logs -f`.

## Management Dashboard

Aometry follows a **Jellyfin-style architecture**: the bot exposes a secured JSON API, and the management dashboard is a separate, centralised web application.

- **Dashboard URL:** [aometry.finneh.xyz](https://aometry.finneh.xyz)
- **Connection:** Add your bot instance by providing the instance URL and the API Key generated during setup.
- **Capabilities:** Install/uninstall modules, configure bot settings (role groups, logging channels, etc.), and monitor status — all from the dashboard.

### Reachability

For the dashboard to communicate with your bot, the bot's API must be publicly reachable. Self-hosted instances behind NAT will need to set up their own tunnel:

- **Cloudflare Tunnel** (recommended)
- **ngrok**
- **Tailscale Funnel**
- Any reverse proxy that can expose the bot's port to the internet.

## Setup Wizard

On first run (when no `.env` file exists), Aometry automatically launches a browser-based setup wizard instead of the bot itself. The wizard collects the minimum required configuration:

| Field       | Required | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `BOT_TOKEN` | Yes      | Your Discord bot token                         |
| `DEV_ID`    | Yes      | Your Discord user ID                           |
| `DB_URL`    | No       | MongoDB connection string (defaults to SQLite) |
| `API_KEY`   | Auto     | Generated automatically, displayed once        |

The wizard writes the `.env` file and instructs you to restart. Channel configuration (system logs, general logs) is deferred to the dashboard — those values can't be known until the bot is actually running in a server.

## Repository System

Aometry supports installing extensions from 3rd party Git repositories. Modules are installed into the `installed_modules/` directory.

### The `info.json` Manifest

Every repository must include an `info.json` at its root describing the available modules. This is the standard contract between the platform and module providers:

```json
{
  "name": "example-repo",
  "version": "1.0.0",
  "description": "A collection of modules for Aometry",
  "modules": [
    {
      "name": "my-module",
      "version": "1.0.0",
      "description": "What this module does",
      "path": "my-module"
    }
  ]
}
```

### Discord Commands

- `/repo install <url>`: Install modules from a repository (Admin only).
- `/repo uninstall <name>`: Uninstall a module (Admin only).
- `/repo list`: List installed modules.
- `/repo configure-sync <name> [remote] [branch] [token-env]`: Configure per-module sync target.
- `/repo sync-module <name>`: Sync a module to its configured remote.

### Automatic Update Heartbeat

Aometry runs an internal repository heartbeat every 6 hours after the bot is ready.

- The heartbeat checks installed modules against their source repository `info.json` metadata.
- If a newer version is detected, the module is automatically updated and runtime handlers are reloaded.
- If local changes are detected in `installed_modules/<module>`, the update is skipped to avoid overwriting local edits.
- Status is persisted per module and visible in `/repo list`.

### Repository Guide for Developers

To create a compatible repository, follow the structure defined in [docs/THIRD_PARTY_GUIDE.md](docs/THIRD_PARTY_GUIDE.md).

## Project Status

Active Development (TypeScript Migration Complete).

## Contributing

Contributions are welcome! Feel free to open issues, submit pull requests, or join the discussion. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

ISC License

## Links

- **Third Party Guide:** [docs/THIRD_PARTY_GUIDE.md](docs/THIRD_PARTY_GUIDE.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Dashboard:** [aometry.finneh.xyz](https://aometry.finneh.xyz)
