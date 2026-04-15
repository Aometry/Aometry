import { Events, ActivityType } from 'discord.js'
import { createEvent } from '@/builders/EventBuilder'
import { loadCommands } from '@/handler/commandHandler'
import Logger from '@/utilities/Logger'
import { startNcapTimerService } from '@installed/governance/ncap/timer'
import { startMotionTimerService } from '@installed/governance/motions/timer'
import gradient from 'gradient-string'

export default createEvent(Events.ClientReady, {
  once: true,
  execute: async ({ client }) => {
    await loadCommands(client)
    startNcapTimerService(client)
    startMotionTimerService(client)

    Logger.line()
    Logger.section('🎉 BOT READY')

    // Ensure user is ready before accessing properties
    if (!client.user) return

    const botInfo = [
      `${gradient.pastel('Bot Username:')} ${client.user.username}`,
      `${gradient.pastel('Bot Version:')} v${client.botVersion}`,
      `${gradient.pastel('Bot Tag:')} ${client.user.tag}`,
      `${gradient.pastel('Bot ID:')} ${client.user.id}`,
      '',
      `${gradient.rainbow('🎧 Now listening to /help')}`
    ].join('\n')

    Logger.box(botInfo, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green',
      textAlignment: 'left'
    })

    client.user.setActivity('to /help', { type: ActivityType.Listening })

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`

    Logger.box(`🔗 ${gradient.cristal('INVITE LINK')}\n\n${inviteUrl}`, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      textAlignment: 'center'
    })

    Logger.rainbow('═'.repeat(60))
    Logger.gradient('🚀 ALL SYSTEMS OPERATIONAL 🚀', ['#00ff88', '#00ccff'])
    Logger.rainbow('═'.repeat(60))
    Logger.line()
  }
})
