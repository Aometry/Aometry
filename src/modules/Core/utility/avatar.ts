import { createCommand } from '@/builders/CommandBuilder'
import { EmbedBuilder } from 'discord.js'

export default createCommand('avatar', "Get a user's avatar", (builder) => {
  builder
    .addUserOption('target', 'The user to get the avatar of', false)
    .execute(async ({ interaction }) => {
      const user = interaction.options.getUser('target') || interaction.user

      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Avatar`)
        .setImage(user.displayAvatarURL({ size: 4096 }))
        .setColor(0x7289da)
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    })
})
