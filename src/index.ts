import Bot from './structures/Bot'
import RepositoryManager from './utilities/RepositoryManager'
import Logger from './utilities/Logger'
import fs from 'fs'
import path from 'path'
import { startAdminWebServer } from './web/server'

const args = process.argv.slice(2)

async function main () {
  await Logger.init()
  if (args.length > 0) {
    const command = args[0]
    // For CLI tools we might not need a full client, but RepositoryManager expects one.
    // We can pass null or a mock if it's just for file operations, or refactor RepositoryManager.
    // For now, we'll cast null as any to satisfy TS if we don't need the client for these ops.
    const repoManager = new RepositoryManager(null as any)

    switch (command) {
      case 'install':
        if (!args[1]) {
          Logger.error('Please provide a repository URL')
          process.exit(1)
        }
        await repoManager.install(args[1]).then(() => process.exit(0))
        break
      case 'uninstall':
        if (!args[1]) {
          Logger.error('Please provide a module name')
          process.exit(1)
        }
        await repoManager.uninstall(args[1]).then(() => process.exit(0))
        break
      case 'list':
        repoManager.list()
        process.exit(0)
        break
      default:
        Logger.gradient('🚀 Starting Aometry...', ['cyan', 'magenta'])
        Logger.line()
        break
    }
  }

  if (args.length === 0 || !['install', 'uninstall', 'list'].includes(args[0])) {
    const envPath = path.join(process.cwd(), '.env')
    const hasEnvFile = fs.existsSync(envPath)
    const hasRequiredEnv = Boolean(
      process.env.BOT_TOKEN &&
      process.env.DEV_ID &&
      process.env.API_KEY
    )

    if (!hasEnvFile || !hasRequiredEnv) {
      const { launchSetupServer } = require('./web/setupServer')
      await launchSetupServer(Number(process.env.SETUP_PORT || 3000))
      // Keep process alive while setup is active
      setInterval(() => {}, 1000 * 60 * 60)
      return
    }

    const bot = new Bot()
    await bot.start()
    startAdminWebServer(bot)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
