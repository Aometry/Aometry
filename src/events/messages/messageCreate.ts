import { Events } from 'discord.js'
import { createEvent } from '@/builders/EventBuilder'

export default createEvent(Events.MessageCreate, {
  execute: async ({ args: [message], client }) => {
    if (!message.author.bot) {
      // Add message handling logic here
    }
  }
})
