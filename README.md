<img width="200" height="200" align="left" style="float: left; margin: 0 10px 0 0;" alt="Karma" src="https://camo.githubusercontent.com/c83d2316c5d2e2a6a50ce04825b0b4d9b0ec5d1a70ddbd17acb6f2d26cc4f291/68747470733a2f2f692e696d6775722e636f6d2f52646e424b76732e6a7067">

# Aometry

![GitHub top language](https://img.shields.io/github/languages/top/Aometry/Aometry?color=0072CE&style=for-the-badge)
![Requires](https://img.shields.io/badge/requires-discordJS-5865F2?style=for-the-badge)
![Code Style](https://img.shields.io/badge/Style_Guide-Standard-brightgreen?style=for-the-badge)
![Build Status](https://github.com/Aometry/Aometry/actions/workflows/ci.yml/badge.svg)

# Aometry

Aometry is a multipurpose, modular Discord bot built with **Discord.js v14** and **TypeScript**. It's designed for both developers and server owners:

- **Developers:** Easily create and share commands and event handlers as reusable modules.
- **Server Owners:** Customise your bot with exactly the features you need by installing modules from various repositories.

**Features:**

- **Modular Design:** Extend the bot's functionality with custom modules.
- **Repository System:** Install and manage modules from different sources (git-based).
- **Slash Commands:** Modern and intuitive command interface.
- **TypeScript:** Type-safe and scalable architecture.

**Architecture:**
The codebase is written in TypeScript and compiled to JavaScript.

- **Source:** `src/` contains all source code.
- **Compiled:** `dist/` contains the compiled output.
- **Modules:** Core modules are in `src/modules/Core/`. 3rd party modules are installed to `installed_modules/`.
- **Config:** `src/config.ts` handles configuration.
- **Entry Point:** `src/index.ts` (dev) or `dist/index.js` (prod).

**Prerequisites:**

- Node.js v16+
- NPM
- Docker (Optional)

**Installation & Development:**

1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file (copy `.env.example`).
4. Run `npm run dev` to start in development mode with hot-reloading.

**Building for Production:**

1. Run `npm run build` to compile the TypeScript code.
2. Run `npm start` to run the compiled bot.

**Docker Deployment:**

1.  Ensure you have Docker and Docker Compose installed.
2.  Create a `.env` file with your configuration.
3.  Run `docker-compose up -d` to start the bot in the background.
4.  View logs with `docker-compose logs -f`.

**Repository System:**
Aometry supports installing extensions from 3rd party git repositories. Modules are installed into the `installed_modules/` directory.

**Discord Commands:**

- `/repo install <url>`: Install a module (Admin only).
- `/repo uninstall <name>`: Uninstall a module (Admin only).
- `/repo list`: List installed modules.

**Repository Standard for Developers:**
To create a compatible repository, follow the structure defined in [docs/THIRD_PARTY_GUIDE.md](docs/THIRD_PARTY_GUIDE.md).

**Project Status:** Active Development (TypeScript Migration Complete).

**Contributing:**

Contributions are welcome! Feel free to open issues, submit pull requests, or join the discussion. See [CONTRIBUTING.md](CONTRIBUTING.md).

**License:** ISC License

**Links:**

- **Third Party Guide:** [docs/THIRD_PARTY_GUIDE.md](docs/THIRD_PARTY_GUIDE.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Support Server:** [#]
