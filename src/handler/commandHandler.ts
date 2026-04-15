import { REST, Routes, Collection } from 'discord.js'
import { BotClient, Command, SubCommand } from '@/types/discord'
import { loadFiles } from '@/utilities/fileLoader'
import Logger from '@/utilities/Logger'
// @ts-ignore
import Ascii from 'ascii-table'
import chalk from 'chalk'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import jiti from 'jiti'

const isTs = __filename.endsWith('.ts')
const load = jiti(__filename, {
  alias: {
    '@': path.join(process.cwd(), isTs ? 'src' : 'dist/src'),
    '@installed': path.join(process.cwd(), 'installed_modules')
  }
})

const CACHE_PATH = path.join(process.cwd(), '.command_cache.json')

interface CommandCacheEntry {
  hash: string;
  data: any;
}

interface CommandCache {
  [filePath: string]: CommandCacheEntry;
}

let commandCache: CommandCache = {}

// Load cache from disk on startup
if (fs.existsSync(CACHE_PATH)) {
  try {
    commandCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
  } catch (e) {
    Logger.error('Failed to load command cache, starting fresh.')
  }
}

function getFileHash (filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8')
  return crypto.createHash('sha256').update(content).digest('hex')
}

function saveCache () {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(commandCache, null, 2))
  } catch (e) {
    Logger.error('Failed to save command cache.')
  }
}

export async function loadCommands (client: BotClient) {
  const table = new Ascii('Commands').setHeading(
    chalk.cyan('Command'),
    chalk.cyan('Status')
  )

  // We do NOT clear client.commands immediately to avoid downtime during reload if possible,
  // but for simplicity and consistency with the map, we will re-set them.
  // However, we must ensure we don't hold onto stale commands.
  const newCommands = new Collection<string, Command>()
  const newSubCommands = new Collection<string, SubCommand>()

  const commandsArray: any[] = []
  let registryUpdateNeeded = false

  // Load core modules from src/modules
  const coreFiles = await loadFiles('src/modules')
  // Load installed modules from installed_modules
  const installedFiles = await loadFiles('installed_modules')

  const files = [...coreFiles, ...installedFiles]
  const processedFiles = new Set<string>()

  for (const file of files) {
    // SKIP non-command files
    const fileName = file.split('/').pop() || ''
    if (
      fileName.includes('Utils') ||
      fileName.includes('timer') ||
      fileName.includes('interaction') ||
      fileName.includes('Handler') ||
      fileName.startsWith('_') // Convention for internal files
    ) {
      continue
    }

    processedFiles.add(file)
    try {
      const currentHash = getFileHash(file)
      const cached = commandCache[file]

      let command: Command

      // Check if file modified
      if (!cached || cached.hash !== currentHash) {
        // File changed or new
        if (file.endsWith('.ts')) {
          const imported = load(file)
          command = imported.default || imported
        } else {
          delete require.cache[require.resolve(file)]
          const imported = await import(file)
          command = imported.default || imported
        }

        // Update cache
        if (command.data) {
          // If data changed, we need registry update
          if (
            !cached ||
            JSON.stringify(cached.data) !==
              JSON.stringify(command.data.toJSON())
          ) {
            registryUpdateNeeded = true
          }
          commandCache[file] = {
            hash: currentHash,
            data: command.data.toJSON()
          }
        } else {
          // Commands without data (e.g. subcommands defined strangely?)
          commandCache[file] = { hash: currentHash, data: null }
        }
      } else {
        let imported
        if (file.endsWith('.ts')) {
          imported = load(file)
        } else {
          imported = await import(file)
        }
        command = imported.default || imported
        // Even if file unchanged, we need to add to commandsArray for structure check comparison against TOTAL registry?
        // Actually, we use 'registryUpdateNeeded' flag. If no files changed structurally, and count is same...
      }

      if (command.subCommand) {
        newSubCommands.set(
          command.subCommand,
          command as unknown as SubCommand
        )
        continue
      }

      if (!command.data) {
        table.addRow(file.split('/').pop(), '❌ MISSING DATA')
        continue
      }

      if (!command.execute) {
        table.addRow(command.data.name, '❌ MISSING EXECUTE')
        continue
      }

      newCommands.set(command.data.name, command)
      commandsArray.push(command.data.toJSON())

      const status =
        !cached || cached.hash !== currentHash ? '✅ RELOADED' : '✅ CACHED'
      table.addRow(command.data.name, status)
    } catch (error: any) {
      Logger.error(`Failed to load command ${file}: ${error.message}`, '⚠️')
      table.addRow(file.split('/').pop(), '❌ ERROR')
    }
  }

  // Detect deletions
  for (const cachedFile of Object.keys(commandCache)) {
    if (!processedFiles.has(cachedFile)) {
      delete commandCache[cachedFile]
      registryUpdateNeeded = true // File deleted, registry must update
    }
  }

  saveCache()

  client.commands = newCommands
  client.subCommands = newSubCommands

  // Check if we need to update Discord Registry
  // We need to compare specific command lists if we want to be 100% sure,
  // but relying on "Did any file's data change" + "Did any file get added/removed" is robust enough for this context.

  if (client.config.BOT_TOKEN) {
    if (registryUpdateNeeded) {
      const rest = new REST({ version: '10' }).setToken(
        client.config.BOT_TOKEN
      )
      try {
        Logger.loading(
          'Refreshing application (/) commands (Changes detected).'
        )

        if (client.user) {
          await rest.put(Routes.applicationCommands(client.user.id), {
            body: commandsArray
          })
          Logger.success(
            `Successfully reloaded ${commandsArray.length} application (/) commands.`
          )
        } else {
          Logger.warning(
            'Client user not ready, skipping command registration'
          )
        }
      } catch (error: any) {
        Logger.error(`Failed to register commands: ${error.message}`)
      }
    } else {
      Logger.success(
        'Command registry is up to date. Skipped API update.',
        '✨'
      )
    }
  }

  console.log(chalk.cyan(table.toString()))
  Logger.success(`Commands loaded: ${client.commands.size}`, '⚡')
}
