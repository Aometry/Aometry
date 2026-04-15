import { EmbedBuilder, ColorResolvable, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js'

export const Colors = {
  SUCCESS: 0x00ff88 as ColorResolvable,
  ERROR: 0xff3366 as ColorResolvable,
  WARNING: 0xffaa00 as ColorResolvable,
  INFO: 0x7289da as ColorResolvable,
  PRIMARY: 0x2f3136 as ColorResolvable
}

export function successEmbed (title: string, description: string) {
  return new EmbedBuilder()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor(Colors.SUCCESS)
    .setTimestamp()
}

export function errorEmbed (title: string, description: string) {
  return new EmbedBuilder()
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setColor(Colors.ERROR)
    .setTimestamp()
}

export function warningEmbed (title: string, description: string) {
  return new EmbedBuilder()
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setColor(Colors.WARNING)
    .setTimestamp()
}

export function infoEmbed (title: string, description: string) {
  return new EmbedBuilder()
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setColor(Colors.INFO)
    .setTimestamp()
}

export async function paginatedEmbed (
  interaction: ChatInputCommandInteraction,
  pages: EmbedBuilder[],
  time: number = 60000
) {
  if (!pages.length) return
  if (pages.length === 1) {
    return interaction.reply({ embeds: [pages[0]] })
  }

  let index = 0

  const getRow = (currentIndex: number) => {
    const row = new ActionRowBuilder<ButtonBuilder>()

    row.addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentIndex === 0),
      new ButtonBuilder()
        .setCustomId('page_count')
        .setLabel(`${currentIndex + 1}/${pages.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentIndex === pages.length - 1)
    )

    return row
  }

  const response = await interaction.reply({
    embeds: [pages[index]],
    components: [getRow(index)],
    fetchReply: true
  })

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time
  })

  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({ content: 'These buttons are not for you!', ephemeral: true })
      return
    }

    if (i.customId === 'prev') {
      index = index > 0 ? index - 1 : pages.length - 1
    } else if (i.customId === 'next') {
      index = index < pages.length - 1 ? index + 1 : 0
    }

    await i.update({
      embeds: [pages[index]],
      components: [getRow(index)]
    })
  })

  collector.on('end', () => {
    response.edit({ components: [] }).catch(() => {})
  })
}
