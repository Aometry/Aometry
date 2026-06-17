import { Events, ChatInputCommandInteraction, MessageFlags, EmbedBuilder, TextChannel } from 'discord.js'
import { createEvent } from '@/builders/EventBuilder'
import { errorEmbed } from '@/utils/responses'
import { isDeveloper } from '@/utils/validators'
import { Command } from '@/types/discord'
import Logger from '@/utilities/Logger'
import crypto from 'crypto'

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
        // Generate a short ID so users can reference it in bug reports
        const errorId = crypto.randomBytes(3).toString('hex').toUpperCase()

        Logger.error(
          `[InteractionHandler] Error executing /${interaction.commandName} (ID: ${errorId}): ${error?.message}`,
          '⚠️'
        )
        if (error?.stack) {
          Logger.error(`Stack: ${error.stack}`, '📚')
        }

        // Post a detailed embed to the system logs channel
        if (client.config.SYSTEM_LOGS_CHANNEL) {
          try {
            const logChannel = client.channels.cache.get(
              client.config.SYSTEM_LOGS_CHANNEL
            ) as TextChannel | undefined

            if (logChannel) {
              const subcommand =
                interaction.isChatInputCommand() &&
                interaction.options.getSubcommand(false)
                  ? `/${interaction.options.getSubcommand(false)}`
                  : ''

              const stackPreview = error?.stack
                ? error.stack.slice(0, 1000)
                : error?.toString()?.slice(0, 1000) ?? 'No stack available'

              const logEmbed = new EmbedBuilder()
                .setTitle(`⚠️ Command Error — ID: \`${errorId}\``)
                .setColor(0xff3366)
                .addFields(
                  {
                    name: 'Command',
                    value: `\`/${interaction.commandName}${subcommand}\``,
                    inline: true
                  },
                  {
                    name: 'User',
                    value: `${interaction.user.tag} (\`${interaction.user.id}\`)`,
                    inline: true
                  },
                  {
                    name: 'Guild',
                    value: interaction.guild
                      ? `${interaction.guild.name} (\`${interaction.guild.id}\`)`
                      : 'DM',
                    inline: true
                  },
                  {
                    name: 'Error',
                    value: `\`\`\`${error?.message ?? String(error)}\`\`\``,
                    inline: false
                  },
                  {
                    name: 'Stack Trace',
                    value: `\`\`\`${stackPreview}\`\`\``,
                    inline: false
                  }
                )
                .setTimestamp()
                .setFooter({ text: 'InteractionHandler' })

              await logChannel.send({ embeds: [logEmbed] })
            }
          } catch (logErr) {
            console.error('[InteractionHandler] Failed to send error log to Discord:', logErr)
          }
        }

        const errorMessage = {
          embeds: [
            errorEmbed(
              'Something went wrong',
              `An unexpected error occurred while running this command.\n\nPlease report this with error code \`${errorId}\`.`
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
          console.error('[InteractionHandler] Failed to send error message to user:', e)
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
