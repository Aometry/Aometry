import Bot from './structures/Bot'
import RepositoryManager from './utilities/RepositoryManager'
import Logger from './utilities/Logger'
import fs from 'fs'
import path from 'path'
import setup from './utilities/Setup'

const args = process.argv.slice(2)

async function main () {
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
    if (!fs.existsSync(path.join(process.cwd(), '.env'))) {
      await setup().then(() => {
        const bot = new Bot()
        bot.start()
      })
    } else {
      const bot = new Bot()
      bot.start()
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
