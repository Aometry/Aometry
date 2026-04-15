import { createCommand } from '@/builders/CommandBuilder'
import { PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js'
import { errorEmbed } from '@/utils/responses'

export default createCommand(
  'warn',
  'Send a warning to a member',
  (builder) => {
    builder
      .addUserOption('user', 'User to warn', true)
      .addStringOption('reason', 'Reason for warning', true)
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .execute(async ({ interaction }) => {
        const targetUser = interaction.options.getUser('user', true)
        const reason = interaction.options.getString('reason', true)
        const guild = interaction.guild!

        try {
          // Try to DM the user
          const dmEmbed = new EmbedBuilder()
            .setTitle(`⚠️ Warning from ${guild.name}`)
            .setDescription(`You have received a warning in **${guild.name}**.`)
            .addFields({ name: 'Reason', value: reason })
            .setColor(0xffaa00)
            .setFooter({ text: 'Please follow the server rules' })
            .setTimestamp()

          try {
            await targetUser.send({ embeds: [dmEmbed] })
          } catch (error) {
            // User has DMs disabled
            return interaction.reply({
              embeds: [
                errorEmbed(
                  'Cannot Send Warning',
                  `Could not DM ${targetUser} - they may have DMs disabled.`
                )
              ],
              flags: MessageFlags.Ephemeral
            })
          }

          // Send confirmation
          const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ Warning Sent')
            .setDescription(`**${targetUser.tag}** has been warned via DM.`)
            .addFields({ name: 'Reason', value: reason })
            .setColor(0x00ff88)
            .setFooter({ text: `Warned by ${interaction.user.tag}` })
            .setTimestamp()

          await interaction.reply({ embeds: [confirmEmbed] })
        } catch (error: any) {
          console.error('Warn command error:', error)
          await interaction.reply({
            embeds: [
              errorEmbed('Error', 'An error occurred while warning the user.')
            ],
            flags: MessageFlags.Ephemeral
          })
        }
      })
  }
)
