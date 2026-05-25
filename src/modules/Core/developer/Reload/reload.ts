import { createCommand } from '@/builders/CommandBuilder'
import { loadCommands } from '@/handler/commandHandler'
import { loadEvents } from '@/handler/eventHandler'
import { MessageFlags, ChatInputCommandInteraction } from 'discord.js'
import { BotClient } from '@/types/discord'

export default createCommand('reload', 'Reload bot components', (builder) => {
  builder
    .addSubcommand((sub) =>
      sub.setName('events').setDescription('Reload application events')
    )
    .addSubcommand((sub) =>
      sub.setName('commands').setDescription('Reload application commands')
    )
    .setDefaultMemberPermissions(8) // Administrator
    .execute(async ({ interaction, client }) => {
      const subcommand = interaction.options.getSubcommand()

      if (subcommand === 'commands') {
        await loadCommands(client)
        await interaction.reply({
          content: 'Commands reloaded!',
          flags: MessageFlags.Ephemeral
        })
      } else if (subcommand === 'events') {
        for (const [key, entry] of client.events) {
          const eventName = typeof entry === 'object' && entry?.name
            ? entry.name
            : key.split('-')[0]
          const execute = typeof entry === 'object' && entry?.execute
            ? entry.execute
            : entry
          const isRest = typeof entry === 'object' && entry?.rest
          if (typeof execute !== 'function') {
            continue
          }
          if (isRest && (client.rest as any)?.removeListener) {
            client.rest.removeListener(eventName, execute)
          } else {
            client.removeListener(eventName, execute)
          }
        }
        await loadEvents(client)
        await interaction.reply({
          content: 'Events reloaded!',
          flags: MessageFlags.Ephemeral
        })
      }
    })
})
