import { EmbedBuilder, TextChannel, MessageFlags } from 'discord.js'
import { BotClient } from '@/types/discord'
import Logger from '@/utilities/Logger'

export class ErrorHandler {
  private client: BotClient

  constructor (client: BotClient) {
    this.client = client
  }

  public init () {
    process.on('unhandledRejection', (reason: any) => {
      this.handleError(reason, 'Unhandled Rejection')
    })

    process.on('uncaughtException', (error: any) => {
      this.handleError(error, 'Uncaught Exception')
    })
  }

  public async handleError (error: any, type: string = 'Error') {
    // 1. Log to Console
    Logger.line()
    Logger.box(
      `⚠️  ${type.toUpperCase()}\n\n` +
        `Error: ${error.message || error.toString()}\n` +
        `Type: ${error.name || 'Error'}\n` +
        `Code: ${error.code || 'N/A'}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red',
        title: '⚠️  SYSTEM ERROR'
      }
    )

    if (!error.code || !error.code.toString().startsWith('10')) {
      Logger.error(`Stack: ${error.stack}`, '📚')
    }
    Logger.line()

    // 2. Log to Discord System Channel
    if (this.client.config.SYSTEM_LOGS_CHANNEL) {
      const logChannel = this.client.channels.cache.get(
        this.client.config.SYSTEM_LOGS_CHANNEL
      ) as TextChannel

      if (logChannel) {
        try {
          const embed = new EmbedBuilder()
            .setTitle(`⚠️ ${type}`)
            .setDescription(`\`\`\`${error.toString().slice(0, 4000)}\`\`\``)
            .setColor(0xff3366)
            .setTimestamp()
            .setFooter({ text: 'Error Handler' })

          if (error.stack) {
            // Optional: Attach stack as file if too long?
            // For now simplified
          }

          await logChannel.send({ embeds: [embed] })
        } catch (e) {
          console.error('Failed to send error log to Discord:', e)
        }
      }
    }
  }
}
