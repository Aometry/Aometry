import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  TextChannel,
  EmbedBuilder,
  Events
} from 'discord.js'
import { loadEvents } from '@/handler/eventHandler'
import Logger from '@/utilities/Logger'
import config from '@/config'
import { BotClient, Command, SubCommand } from '@/types/discord'
import RepositoryManager from '@/utilities/RepositoryManager'
import DatabaseManager from '@/utilities/DatabaseManager'
import { version } from '../../package.json'
import { ErrorHandler } from '@/handler/errorHandler'

const { Guilds, GuildMembers, GuildMessages, MessageContent } =
  GatewayIntentBits
const { User, Message, GuildMember, ThreadMember } = Partials

export default class Bot extends Client implements BotClient {
  public config = config
  public botVersion = version
  public commands = new Collection<string, Command>()
  public subCommands = new Collection<string, SubCommand>()
  public events = new Collection<string, any>()
  public repositoryManager: RepositoryManager
  public databaseManager: DatabaseManager
  public errorHandler: ErrorHandler

  constructor () {
    super({
      intents: [Guilds, GuildMembers, GuildMessages, MessageContent],
      partials: [User, Message, GuildMember, ThreadMember]
    })

    this.repositoryManager = new RepositoryManager(this)
    this.databaseManager = new DatabaseManager(this.config)
    this.errorHandler = new ErrorHandler(this)
  }

  async start () {
    // Show beautiful startup banner
    await Logger.showBanner(this.botVersion)

    Logger.section('🚀 INITIALIZATION SEQUENCE')

    // Connect to Database via Manager
    await this.databaseManager.connect()

    Logger.line()

    // Load Events
    Logger.loading('Loading event handlers...')
    await loadEvents(this)

    Logger.line()

    // Load Repository Manager
    Logger.loading('Initializing repository manager...')
    // RepositoryManager is already instantiated in constructor, but we might want to reload or init here
    Logger.success('Repository manager initialized', '📦')

    Logger.line()

    // Login
    Logger.loading('Authenticating with Discord...')

    await this.login(this.config.BOT_TOKEN)
      .then(() => {
        Logger.success('Discord authentication successful', '🔐')
      })
      .catch((err) => {
        Logger.error('Discord login failed: ' + err.message, '🔐')
      })

    // Global Error Handling
    this.errorHandler.init()
  }

  // Legacy handleErrors function removed
}
