import { createCommand } from '@/builders/CommandBuilder'
import {
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
  TextChannel
} from 'discord.js'
import { errorEmbed } from '@/utils/responses'

export default createCommand(
  'slowmode',
  'Set slowmode for the current channel',
  (builder) => {
    builder
      .addIntegerOption(
        'seconds',
        'Slowmode delay in seconds (0 to disable, max 21600)',
        true,
        0,
        21600
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .execute(async ({ interaction }) => {
        const seconds = interaction.options.getInteger('seconds', true)

        // Check bot permissions
        if (
          !interaction.guild?.members.me?.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        ) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                'Missing Permissions',
                'I need **Manage Channels** permission to use this command.'
              )
            ],
            flags: MessageFlags.Ephemeral
          })
        }

        const channel = interaction.channel as TextChannel
        if (!channel) return

        try {
          await channel.setRateLimitPerUser(seconds)

          // Format duration
          let duration = 'Disabled'
          if (seconds > 0) {
            const hours = Math.floor(seconds / 3600)
            const minutes = Math.floor((seconds % 3600) / 60)
            const secs = seconds % 60

            const parts = []
            if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`)
            if (minutes > 0) { parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`) }
            if (secs > 0 || parts.length === 0) { parts.push(`${secs} second${secs !== 1 ? 's' : ''}`) }

            duration = parts.join(', ')
          }

          const embed = new EmbedBuilder()
            .setTitle(
              seconds === 0 ? '🚀 Slowmode Disabled' : '⏱️ Slowmode Enabled'
            )
            .setDescription(
              seconds === 0
                ? `Slowmode has been **disabled** in ${channel}.`
                : `Slowmode set to **${duration}** in ${channel}.`
            )
            .setColor(seconds === 0 ? 0x00ff88 : 0x7289da)
            .setFooter({ text: `Set by ${interaction.user.tag}` })
            .setTimestamp()

          await interaction.reply({ embeds: [embed] })
        } catch (error: any) {
          console.error('Slowmode command error:', error)
          await interaction.reply({
            embeds: [
              errorEmbed('Error', 'An error occurred while setting slowmode.')
            ],
            flags: MessageFlags.Ephemeral
          })
        }
      })
  }
)
