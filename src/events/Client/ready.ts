import { Events, ActivityType } from 'discord.js'
import { createEvent } from '@/builders/EventBuilder'
import { loadCommands } from '@/handler/commandHandler'
import Logger from '@/utilities/Logger'

const ncapInteractionPath: string = '@installed/governance/ncap/interaction_backup'
const ncapTimerPath: string = '@installed/governance/ncap/timer_backup'

const loadOptionalModule = async (modulePath: string) => {
  try {
    return await import(modulePath)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      Logger.warning(`Optional module not installed: ${modulePath}`)
      return null
    }
    Logger.warning(`Failed to load optional module: ${modulePath}`)
    Logger.warning(error instanceof Error ? error.message : String(error))
    return null
  }
}

export default createEvent(Events.ClientReady, {
  once: true,
  execute: async ({ client }) => {
    await loadCommands(client)

    Logger.line()
    Logger.section('🎉 BOT READY')

    // Ensure user is ready before accessing properties
    if (!client.user) return

    const botInfo = [
      `${Logger.pastel('Bot Username:')} ${client.user.username}`,
      `${Logger.pastel('Bot Version:')} v${client.botVersion}`,
      `${Logger.pastel('Bot Tag:')} ${client.user.tag}`,
      `${Logger.pastel('Bot ID:')} ${client.user.id}`,
      '',
      `${Logger.rainbow('🎧 Now listening to /help')}`
    ].join('\n')

    Logger.box(botInfo, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green',
      textAlignment: 'left'
    })

    client.user.setActivity('to /help', { type: ActivityType.Listening })

    const [interactionModule, timerModule] = await Promise.all([
      loadOptionalModule(ncapInteractionPath),
      loadOptionalModule(ncapTimerPath)
    ])
    const handleNcapInteraction = interactionModule?.default
    const startNcapTimerService = timerModule?.startNcapTimerService

    if (handleNcapInteraction) {
      client.componentHandlers.set('ncap_', handleNcapInteraction)
    }
    if (startNcapTimerService) {
      startNcapTimerService(client)
    }

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`

    Logger.box(`🔗 ${Logger.crystal('INVITE LINK')}\n\n${inviteUrl}`, {
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

    client.startRepositoryHeartbeat()
  }
})
