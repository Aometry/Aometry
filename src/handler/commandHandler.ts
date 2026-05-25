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
  cache: false,
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

function loadCommandModule (filePath: string) {
  if (filePath.endsWith('.ts')) {
    return load(filePath)
  }
  delete require.cache[require.resolve(filePath)]
  return require(filePath)
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

  // Load installed modules with metadata awareness
  const installedFiles: string[] = []
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
          if (Array.isArray(info.commands)) {
            for (const cmd of info.commands) {
              if (cmd.path) {
                const fullPath = path.join(installedModulesDir, mod, cmd.path)
                if (fs.existsSync(fullPath)) {
                  installedFiles.push(fullPath)
                }
              }
            }
          }
        } catch (e) {
          Logger.error(`Failed to parse info.json for module ${mod}`)
        }
      } else {
        // Fallback: search in a commands/ folder if it exists, otherwise scan module root
        // If it's a "classic" directory structure without info.json
        const modCommandsDir = path.join(installedModulesDir, mod, 'commands')
        if (fs.existsSync(modCommandsDir)) {
          const files = await loadFiles(`installed_modules/${mod}/commands`)
          installedFiles.push(...files)
        } else {
          const files = await loadFiles(`installed_modules/${mod}`)
          installedFiles.push(...files)
        }
      }
    }
  }

  const files = [...coreFiles, ...installedFiles]
  const processedFiles = new Set<string>()

  for (const file of files) {
    // SKIP non-command files
    const fileName = file.split('/').pop() || ''
    const isModule = file.includes('installed_modules')

    if (
      fileName.includes('Utils') ||
      fileName.includes('timer') ||
      fileName.includes('interaction') ||
      fileName.includes('Handler') ||
      fileName.includes('database') ||
      fileName.includes('types') ||
      fileName.includes('calculator') ||
      fileName.startsWith('_') || // Convention for internal files
      fileName.endsWith('.d.ts') // Types
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
        const imported = loadCommandModule(file)
        command = imported.default || imported

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
        const imported = loadCommandModule(file)
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
        // If it was explicitly requested in info.json, it's an error.
        // If it was picked up by glob, it's just a support file we should skip silent.
        // We check if the path is in a 'commands' directory or listed in an info.json.
        // For now, if it's missing data, we only show it as an error if it's not a known ignored type.
        if (file.toLowerCase().includes('command')) {
          table.addRow(file.split('/').pop(), '❌ MISSING DATA')
        }
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
