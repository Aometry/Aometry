import { BotClient, Event } from '@/types/discord'
import { loadFiles } from '@/utilities/fileLoader'
import Logger from '@/utilities/Logger'
// @ts-ignore
import Ascii from 'ascii-table'
/// <reference path="@/types/declarations.d.ts" />
import chalk from 'chalk'

export async function loadEvents (client: BotClient) {
  const table = new Ascii('Events').setHeading(
    chalk.cyan('Event'),
    chalk.cyan('Source'),
    chalk.cyan('Status')
  )

  await client.events.clear()

  // Load from both src/events and installed_modules
  const coreEvents = await loadFiles('src/events')
  const moduleEvents = await loadFiles('installed_modules')

  // Filter module files to only include those in an "events" subdirectory
  // and exclude non-event files if necessary
  const filteredModuleEvents = moduleEvents.filter((file) =>
    file.includes('/events/')
  )

  const files = [...coreEvents, ...filteredModuleEvents]
  console.log('DEBUG: Loaded Event Files:', files)

  for (const file of files) {
    try {
      // Clear cache for reload
      delete require.cache[require.resolve(file)]

      const imported = await import(file)
      const event: Event<any> = imported.default || imported

      const fileName = file.split('/').pop() || ''
      const isModule = file.includes('installed_modules')
      const source = isModule ? 'Module' : 'Core'

      if (!event.name) {
        table.addRow(fileName, source, '❌ MISSING NAME')
        continue
      }

      if (!event.execute) {
        table.addRow(event.name, source, '❌ MISSING EXECUTE')
        continue
      }

      // Wrap execution with error handling and context identification
      const execute = async (...args: any[]) => {
        try {
          await event.execute(...args, client)
        } catch (error: any) {
          Logger.error(
            `Error in event ${event.name} (${source}): ${error.message}`
          )
          console.error(error)
        }
      }

      // We allow multiple listeners for the same event type
      // We accept that client.events (Collection) might only hold the last one for reference,
      // but the actual listener is attached to the client/process.
      // For improved debugging, we might want to store them in an array in client.events,
      // but without changing BotClient type definition, we'll stick to standard behavior
      // where the Map just shows "it is loaded".
      client.events.set(`${event.name}-${file}`, execute)

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

      table.addRow(event.name, source, '✅ LOADED')
    } catch (error: any) {
      Logger.error(`Failed to load event ${file}: ${error.message}`, '⚠️')
      table.addRow(file.split('/').pop(), 'Unknown', '❌ ERROR')
    }
  }

  console.log(chalk.cyan(table.toString()))
  Logger.success(`Events loaded: ${files.length}`, '⚡')
}
