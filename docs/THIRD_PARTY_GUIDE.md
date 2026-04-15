# Aometry Third-Party Developer Guide

Welcome to the Aometry developer guide! This document will help you create powerful and type-safe modules for the Aometry bot ecosystem.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Commands](#creating-commands)
3. [Creating Events](#creating-events)
4. [Using Helpers](#using-helpers)
5. [Best Practices](#best-practices)

## Getting Started

Aometry uses TypeScript for robust and type-safe development. When creating a module, you should use the provided builders and utilities to ensure compatibility and consistency.

### Prerequisites

- Node.js v16.9.0 or higher
- Basic knowledge of TypeScript and Discord.js

## Migration Quickstart (JS to TS)

If you have existing JavaScript modules, here's how to convert them:

1.  **Rename files**: Change `.js` extensions to `.ts`.
2.  **Update Imports**:

    ```typescript
    // Old
    const { EmbedBuilder } = require("discord.js");

    // New
    import { EmbedBuilder } from "discord.js";
    ```

3.  **Use Builders**: Replace manual object exports with `CommandBuilder` and `EventBuilder`.

    ```typescript
    // Old
    module.exports = {
      data: new SlashCommandBuilder()...,
      execute: async (interaction) => { ... }
    }

    // New
    export default createCommand('name', 'desc', (builder) => { ... });
    ```

## Creating Commands

We provide a `CommandBuilder` utility to make creating slash commands easy and type-safe.

### Basic Command Structure

Create a new file in your module's directory (e.g., `modules/MyModule/commands/hello.ts`):

```typescript
import { createCommand } from "@/builders/CommandBuilder";
import { successEmbed } from "@/utils/responses";

export default createCommand("hello", "Say hello to the bot", (builder) => {
  builder
    .addStringOption("name", "Your name", true)
    .execute(async ({ interaction, client }) => {
      const name = interaction.options.getString("name", true);

      await interaction.reply({
        embeds: [successEmbed("Hello!", `Nice to meet you, ${name}!`)],
      });
    });
});
```

### Advanced Options

The builder supports all standard Discord slash command options:

```typescript
builder
  .addIntegerOption("age", "Your age", false, 0, 100)
  .addUserOption("target", "Target user")
  .addChannelOption("channel", "Target channel")
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
```

## Creating Events

Use the `EventBuilder` to listen to Discord events.

### Event Structure

Create a file in your module (e.g., `modules/MyModule/events/welcome.ts`):

```typescript
import { createEvent } from "@/builders/EventBuilder";
import { Events } from "discord.js";

export default createEvent(Events.GuildMemberAdd, {
  execute: async ({ args: [member], client }) => {
    const channel = member.guild.systemChannel;
    if (channel) {
      channel.send(`Welcome to the server, ${member}!`);
    }
  },
});
```

## Using Helpers

Aometry provides several utilities to make your life easier.

### Response Helpers (`src/utils/responses.ts`)

- `successEmbed(title, description)`: Green checkmark embed
- `errorEmbed(title, description)`: Red cross embed
- `warningEmbed(title, description)`: Yellow warning embed
- `infoEmbed(title, description)`: Blue info embed
- `paginatedEmbed(interaction, pages)`: Handles pagination automatically

### Validators (`src/utils/validators.ts`)

- `isValidUrl(string)`
- `isValidId(string)`
- `hasPermission(interaction, permission)`

## Best Practices

1. **Type Safety**: Always use the provided builders and types. Avoid `any`.
2. **Error Handling**: The command handler wraps your code in a try-catch block, but you should handle expected errors gracefully using `errorEmbed`.
3. **File Structure**: Keep commands in a `commands` folder and events in an `events` folder within your module.
4. **Clean Code**: Keep your execute functions small. Extract logic to helper functions if needed.

Happy coding! 🚀
