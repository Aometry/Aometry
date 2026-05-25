import { Events } from 'discord.js'
import { createEvent } from '@/builders/EventBuilder'

export default createEvent(Events.GuildMemberAdd, {
  execute: async ({ args: [member], client }) => {
    // Add welcome logic here
  }
})
