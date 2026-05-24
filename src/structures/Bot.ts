import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Options,
} from "discord.js";
import { loadEvents } from "@/handler/eventHandler";
import Logger from "@/utilities/Logger";
import config from "@/config";
import { BotClient, Command, SubCommand } from "@/types/discord";
import RepositoryManager from "@/utilities/RepositoryManager";
import DatabaseManager from "@/utilities/DatabaseManager";
import RuntimeModuleManager from "@/utilities/RuntimeModuleManager";
import { version } from "../../package.json";
import { ErrorHandler } from "@/handler/errorHandler";

const { Guilds, GuildMembers, GuildMessages, MessageContent } =
  GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;
type ComponentHandler = (interaction: any, client: BotClient) => Promise<void>;

export default class Bot extends Client implements BotClient {
  public config = config;
  public botVersion = version;
  public commands = new Collection<string, Command>();
  public subCommands = new Collection<string, SubCommand>();
  public events = new Collection<string, any>();
  public componentHandlers = new Collection<string, ComponentHandler>();
  public repositoryManager: RepositoryManager;
  public databaseManager: DatabaseManager;
  public runtimeModuleManager: RuntimeModuleManager;
  public errorHandler: ErrorHandler;
  private repositoryHeartbeatTimer?: NodeJS.Timeout;
  private readonly repositoryHeartbeatIntervalMs = 6 * 60 * 60 * 1000;

  constructor() {
    super({
      intents: [Guilds, GuildMembers, GuildMessages, MessageContent],
      partials: [User, Message, GuildMember, ThreadMember],
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: 100, // Limit message cache strictly to 100 per channel
      }),
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
          interval: 3600, // Sweep messages every hour
          lifetime: 10800, // Remove messages older than 3 hours
        },
      },
    });

    this.repositoryManager = new RepositoryManager(this);
    this.databaseManager = new DatabaseManager(this.config);
    this.runtimeModuleManager = new RuntimeModuleManager(this);
    this.repositoryManager.setRuntimeManager(this.runtimeModuleManager);
    this.errorHandler = new ErrorHandler(this);
  }

  async start() {
    // Show beautiful startup banner
    await Logger.showBanner(this.botVersion);

    Logger.section("🚀 INITIALIZATION SEQUENCE");

    // Connect to Database via Manager
    await this.databaseManager.connect();

    Logger.line();

    // Load Events
    Logger.loading("Loading event handlers...");
    await loadEvents(this);

    Logger.line();

    // Trigger Platform Initialization Lifecycle
    Logger.loading("Initializing platform extensions...");
    this.emit("AometryInit", this);
    Logger.success("Platform initialization complete", "⚙️");

    Logger.line();

    // Load Repository Manager
    Logger.loading("Initializing repository manager...");
    // RepositoryManager is already instantiated in constructor, but we might want to reload or init here
    Logger.success("Repository manager initialized", "📦");

    Logger.line();

    // Login
    Logger.loading("Authenticating with Discord...");

    await this.login(this.config.BOT_TOKEN)
      .then(() => {
        Logger.success("Discord authentication successful", "🔐");
      })
      .catch((err) => {
        Logger.error("Discord login failed: " + err.message, "🔐");
      });

    // Global Error Handling
    this.errorHandler.init();
  }

  startRepositoryHeartbeat() {
    if (this.repositoryHeartbeatTimer) {
      return;
    }

    Logger.info("Starting repository heartbeat (every 6 hours)", "💓");
    this.runRepositoryHeartbeatTick().catch(() => {});
    this.repositoryHeartbeatTimer = setInterval(() => {
      this.runRepositoryHeartbeatTick().catch(() => {});
    }, this.repositoryHeartbeatIntervalMs);
  }

  stopRepositoryHeartbeat() {
    if (!this.repositoryHeartbeatTimer) {
      return;
    }

    clearInterval(this.repositoryHeartbeatTimer);
    this.repositoryHeartbeatTimer = undefined;
    Logger.info("Stopped repository heartbeat", "💓");
  }

  private async runRepositoryHeartbeatTick() {
    const summary = await this.repositoryManager.checkAndAutoUpdateModules();

    if (summary.skipped) {
      Logger.warning(summary.message, "💓");
      return;
    }

    const status = `checked=${summary.checked}, updated=${summary.updated}, skipped-local=${summary.skippedLocalChanges}, errors=${summary.errors}`;
    Logger.info(`Repository heartbeat complete: ${status}`, "💓");
  }

  // Legacy handleErrors function removed
}
