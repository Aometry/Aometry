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

    // 2. Handle Buttons & Modals (Registry Dispatch)
    if (interaction.isButton() || interaction.isModalSubmit()) {
      const { customId } = interaction

      try {
        // Find a matching handler by prefix in the registry
        const entry = client.componentHandlers.find((_, prefix) =>
          customId.startsWith(prefix)
        )

        if (entry) {
          await entry(interaction, client)
          return
        }
      } catch (error: any) {
        console.error(
          `[InteractionHandler] Error handling component (${customId}):`,
          error
        )
        if (interaction.isRepliable() && !interaction.replied) {
          await interaction.reply({
            content: 'An error occurred while processing this interaction.',
            flags: 64
          })
        }
      }
    }
  }
})
