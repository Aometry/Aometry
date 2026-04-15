import { loadCommands } from '@/handler/commandHandler'
import { loadEvents } from '@/handler/eventHandler'
import { BotClient } from '@/types/discord'
import Logger from './Logger'

export default class RuntimeModuleManager {
  private client: BotClient

  constructor (client: BotClient) {
    this.client = client
  }

  async loadModule (_moduleName: string): Promise<void> {
    await this.reloadRuntime()
  }

  async unloadModule (_moduleName: string): Promise<void> {
    await this.reloadRuntime()
  }

  async reloadRuntime (): Promise<void> {
    Logger.loading('Reloading runtime modules without restart...')
    await loadEvents(this.client)
    await loadCommands(this.client)
    Logger.success('Runtime modules reloaded', '♻️')
  }
}
