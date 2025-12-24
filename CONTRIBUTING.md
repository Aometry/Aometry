# Contributing to Aometry

Thank you for your interest in contributing to Aometry! This guide will help you set up your development environment and understand our coding standards.

## Prerequisites

- **Node.js**: v16.9.0 or higher
- **npm**: v7.0.0 or higher
- **Git**

## Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Aometry/Aometry.git
    cd Aometry
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    - Run the bot once to generate the `.env` file:
      ```bash
      npm run dev
      ```
    - Or copy `.env.example` to `.env` and fill in your `BOT_TOKEN` and other variables.

## Development Workflow

We use **TypeScript** for development.

-   **Start in Development Mode**:
    ```bash
    npm run dev
    ```
    This uses `nodemon` and `ts-node` to restart the bot automatically when you make changes.

-   **Linting**:
    ```bash
    npm run lint
    ```
    We follow the **Standard** code style (no semicolons). Please ensure your code passes linting before submitting a PR.

## Building for Production

To build the project for production:

```bash
npm run build
```

This compiles the TypeScript code into the `dist/` directory. You can then run the compiled bot with:

```bash
npm start
```

## Project Structure

-   `src/`: Source code
    -   `modules/`: Core bot modules (commands)
    -   `events/`: Event handlers
    -   `structures/`: Core classes (BotClient)
    -   `utilities/`: Helper functions
-   `installed_modules/`: 3rd party modules installed via the repository system
-   `dist/`: Compiled JavaScript code

## Code Style

-   **No Semicolons**: We use `standard` style.
-   **TypeScript**: Use proper types whenever possible. Avoid `any`.
-   **Builders**: Use `CommandBuilder` and `EventBuilder` for creating commands and events.

## Issue Reporting

1. Check if the issue already exists.
2. Use the Issue Template.
3. Include reproduction steps.

## Pull Request Process

1. Ensure code passes `npm run lint`.
2. Update documentation if necessary.
3. Link relevant issues.
4. Fork the repository.
5. Create a new branch for your feature or fix.
6. Commit your changes.
7. Push to your fork and submit a Pull Request.

Happy coding! 🚀