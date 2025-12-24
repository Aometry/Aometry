import { BotClient, Event } from '@/types/discord'
import { loadFiles } from '@/utilities/fileLoader'
import Logger from '@/utilities/Logger'
// @ts-ignore
import Ascii from 'ascii-table'
/// <reference path="@/types/declarations.d.ts" />
import { glob } from 'glob'
import chalk from 'chalk'

export async function loadEvents (client: BotClient) {
  const table = new Ascii('Events').setHeading(
    chalk.cyan('Event'),
    chalk.cyan('Status')
  )

  await client.events.clear()

  // In TS/src structure, we look in src/events
  const files = await loadFiles('src/events')

  for (const file of files) {
    try {
      const imported = await import(file)
      const event: Event<any> = imported.default || imported

      if (!event.name) {
        table.addRow(file.split('/').pop(), '❌ MISSING NAME')
        continue
      }

      if (!event.execute) {
        table.addRow(event.name, '❌ MISSING EXECUTE')
        continue
      }

      // Wrap execution with error handling
      const execute = async (...args: any[]) => {
        try {
          await event.execute(...args, client)
        } catch (error: any) {
          Logger.error(`Error in event ${event.name}: ${error.message}`)
          console.error(error)
        }
      }

      client.events.set(event.name, execute)

      if (event.rest) {
        if (event.once) {
          client.rest.once(event.name, execute)
        } else {
          client.rest.on(event.name, execute)
        }
      } else {
        if (event.once) {
          client.once(event.name, execute)
        } else {
          client.on(event.name, execute)
        }
      }

      table.addRow(event.name, '✅ LOADED')
    } catch (error: any) {
      Logger.error(`Failed to load event ${file}: ${error.message}`, '⚠️')
      table.addRow(file.split('/').pop(), '❌ ERROR')
    }
  }

  console.log(chalk.cyan(table.toString()))
  Logger.success(`Events loaded: ${client.events.size}`, '⚡')
}
