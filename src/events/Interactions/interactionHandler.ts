import { Events, ChatInputCommandInteraction, MessageFlags } from 'discord.js'
import { createEvent } from '@/builders/EventBuilder'
import { errorEmbed } from '@/utils/responses'
import { isDeveloper } from '@/utils/validators'
import { Command } from '@/types/discord'

export default createEvent(Events.InteractionCreate, {
  execute: async ({ args: [interaction], client }): Promise<void> => {
    // 1. Handle Chat Input Commands && Context Menu Commands
    // 1. Handle Chat Input Commands && Context Menu Commands
    // 1. Handle Chat Input Commands && Context Menu Commands
    if (
      interaction.isChatInputCommand() ||
      interaction.isContextMenuCommand()
    ) {
      console.log(
        `[Core/InteractionHandler] Received command: ${interaction.commandName} | ID: ${interaction.id}`
      )
      const command = client.commands.get(interaction.commandName)

      if (!command) {
        if (interaction.isRepliable()) {
          await interaction.reply({
            embeds: [errorEmbed('Error', 'This command does not exist.')],
            flags: 64
          })
        }
        return
      }

      // Check if already handled (Double Safety)
      if (interaction.replied || interaction.deferred) {
        console.warn(
          `[InteractionHandler] Interaction ${interaction.id} already handled, skipping.`
        )
        return
      }

      if (
        command.developer &&
        !isDeveloper(interaction.user.id, client.config.DEV_ID)
      ) {
        await interaction.reply({
          embeds: [
            errorEmbed('Restricted', 'This command is for developers only.')
          ],
          flags: 64
        })
        return
      }

      try {
        await command.execute({ interaction: interaction as any, client })
      } catch (error: any) {
        console.error(
          `[InteractionHandler] Error executing ${interaction.commandName}:`,
          error
        )

        const errorMessage = {
          embeds: [
            errorEmbed(
              'Error',
              'An error occurred while executing this command.'
            )
          ],
          flags: 64
        }

        // Catch "Already acknowledged" errors by checking state
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(errorMessage)
          } else {
            await interaction.followUp(errorMessage)
          }
        } catch (e) {
          console.error('Failed to send error message:', e)
        }
      }
      return
    }

    // 2. Handle Buttons & Modals (Components) for Governance
    // We check for customIds starting with 'ncap_' or 'motion_' to dispatch to specific handlers
    // For now, we'll try to load a handler dynamically or check a map if we were using a registry.
    // Given the plan to have `src/modules/Core/governance/ncap/interaction.ts`, we can import that here or
    // dispatch based on prefix.
    // To keep it clean, let's implement a dynamic dispatcher or simple if-checks for now,
    // as strict modularity might require a 'componentHandler' loader which we don't have yet.

    // Quick dispatch for Governance module
    if (interaction.isButton() || interaction.isModalSubmit()) {
      const { customId } = interaction

      try {
        if (customId.startsWith('ncap_')) {
          // Dynamically import to avoid circular deps or rigid loading order
          const handler = await import(
            '@installed/governance/ncap/interaction'
          )
          if (handler && handler.default) {
            await handler.default(interaction, client)
          }
        }
      } catch (error: any) {
        console.error(`Governance Interaction Error (${customId}):`, error)
        if (interaction.isRepliable() && !interaction.replied) {
          await interaction.reply({
            content: 'An error occurred handling this interaction.',
            flags: 64
          })
        }
      }
    }
  }
})
