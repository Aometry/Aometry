import { createCommand } from '@/builders/CommandBuilder'
import { Events, GuildMember, MessageFlags } from 'discord.js'
import { successEmbed } from '@/utils/responses'

export default createCommand('emit', 'Emit an event', (builder) => {
  builder
    .addStringOption('event', 'The event to emit', true, [
      { name: 'Guild Member Add', value: Events.GuildMemberAdd },
      { name: 'Guild Member Remove', value: Events.GuildMemberRemove }
    ])
    .setDefaultMemberPermissions(8)
    .execute(async ({ interaction, client }) => {
      const event = interaction.options.getString('event', true)
      const member = interaction.member as GuildMember

      client.emit(event, member)

      await interaction.reply({
        embeds: [
          successEmbed(
            'Event Emitted',
            `Successfully emitted event: \`${event}\``
          )
        ],
        flags: MessageFlags.Ephemeral
      })
    })
})
