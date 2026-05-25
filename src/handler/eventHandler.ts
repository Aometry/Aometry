import { BotClient, Event } from '@/types/discord'
import { loadFiles } from '@/utilities/fileLoader'
import Logger from '@/utilities/Logger'
import jiti from 'jiti'
import path from 'path'
import fs from 'fs'
// @ts-ignore
import Ascii from 'ascii-table'
/// <reference path="@/types/declarations.d.ts" />
import chalk from 'chalk'

const isTs = __filename.endsWith('.ts')
const load = jiti(__filename, {
  alias: {
    '@': path.join(process.cwd(), isTs ? 'src' : 'dist/src'),
    '@installed': path.join(process.cwd(), 'installed_modules')
  }
})

interface LoadedEvent {
  name: string
  execute: (...args: any[]) => Promise<void> | void
  rest: boolean
}

export async function loadEvents (client: BotClient) {
  const table = new Ascii('Events').setHeading(
    chalk.cyan('Event'),
    chalk.cyan('Source'),
    chalk.cyan('Status')
  )

  for (const [key, entry] of client.events) {
    const eventName = typeof entry === 'object' && entry?.name
      ? entry.name
      : key.split('-')[0]
    const execute = typeof entry === 'object' && entry?.execute
      ? entry.execute
      : entry
    const isRest = typeof entry === 'object' && entry?.rest
    if (typeof execute !== 'function') {
      continue
    }
    if (isRest && (client.rest as any)?.removeListener) {
      client.rest.removeListener(eventName, execute)
    } else {
      client.removeListener(eventName, execute)
    }
  }
  client.events.clear()

  // Load from both src/events and installed_modules
  const coreEvents = await loadFiles('src/events')

  // Load installed modules with metadata awareness
  const moduleEvents: string[] = []
  const installedModulesDir = path.join(process.cwd(), 'installed_modules')

  if (fs.existsSync(installedModulesDir)) {
    const modules = fs.readdirSync(installedModulesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    for (const mod of modules) {
      const infoPath = path.join(installedModulesDir, mod, 'info.json')
      if (fs.existsSync(infoPath)) {
        try {
          const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
          if (Array.isArray(info.events)) {
            for (const event of info.events) {
              if (event.path) {
                const fullPath = path.join(installedModulesDir, mod, event.path)
                if (fs.existsSync(fullPath)) {
                  moduleEvents.push(fullPath)
                }
              }
            }
          }
        } catch (e) {
          Logger.error(`Failed to parse info.json for events in module ${mod}`)
        }
      } else {
        // Fallback: search in an events/ folder if it exists
        const modEventsDir = path.join(installedModulesDir, mod, 'events')
        if (fs.existsSync(modEventsDir)) {
          const files = await loadFiles(`installed_modules/${mod}/events`)
          moduleEvents.push(...files)
        }
      }
    }
  }

  const files = [...coreEvents, ...moduleEvents]

  for (const file of files) {
    try {
      let imported
      if (file.endsWith('.ts')) {
        imported = load(file)
      } else {
        // Clear cache for reload
        delete require.cache[require.resolve(file)]
        imported = require(file)
      }
      const fileName = file.split('/').pop() || ''
      const isModule = file.includes('installed_modules')
      const source = isModule ? 'Module' : 'Core'
      const event: Event<any> = imported?.default || imported
      if (!event) {
        table.addRow(fileName, source, '❌ LOAD FAILED')
        continue
      }

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
      const loadedEvent: LoadedEvent = {
        name: event.name,
        execute,
        rest: Boolean(event.rest)
      }
      client.events.set(`${event.name}-${file}`, loadedEvent)

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
