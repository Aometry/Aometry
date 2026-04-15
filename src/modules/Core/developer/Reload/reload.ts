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
        for (const [key, value] of client.events) {
          client.removeListener(key, value)
        }
        await loadEvents(client)
        await interaction.reply({
          content: 'Events reloaded!',
          flags: MessageFlags.Ephemeral
        })
      }
    })
})
