import { Events, Message, ChannelType } from 'discord.js'
import { createEvent } from '@/builders/EventBuilder'
import { getChannelCategory, ChannelCategory } from '../ChannelUtils'
import Logger from '@/utilities/Logger'

export default createEvent(Events.MessageCreate, {
  execute: async ({ args: [message], client }) => {
    // Ignore bots
    if (message.author.bot) return

    // Ensure it's a guild channel
    if (!message.guild || !message.channel) return

    // IGNORE MESSAGES IN THREADS
    // Threads inherently have a parent, but typical "channel messages" are in GuildText.
    if (
      message.channel.type === ChannelType.PublicThread ||
      message.channel.type === ChannelType.PrivateThread
    ) {
      return
    }

    // Get channel category from name
    const category = getChannelCategory((message.channel as any).name)

    // Check if it's one of the auth channels or motions
    if (
      category === ChannelCategory.AUTH_GENERAL ||
      category === ChannelCategory.AUTH_SOCMED ||
      category === ChannelCategory.MOTIONS
    ) {
      try {
        await message.delete()
        Logger.info(
          `Auto-deleted message from ${message.author.tag} in #${
            (message.channel as any).name
          }`
        )
      } catch (error) {
        Logger.error(
          `Failed to auto-delete message in #${
            (message.channel as any).name
          }: ${error}`
        )
      }
    }
  }
})
