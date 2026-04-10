import { connect, Connection } from 'mongoose'
// @ts-ignore
import Database from 'better-sqlite3'
import path from 'path'
import Logger from './Logger'
import { Config } from '@/types/index'

type DatabaseType = 'MONGO' | 'SQLITE' | 'NONE';

export default class DatabaseManager {
  private config: Config
  public type: DatabaseType = 'NONE'
  public connection: Connection | any = null
  private _sqliteConnection: any = null

  constructor (config: Config) {
    this.config = config
  }

  async connect (): Promise<void> {
    // 1. Try MongoDB if configured
    if (this.config.DB_URL) {
      Logger.loading('Connecting to MongoDB...')
      try {
        await connect(this.config.DB_URL, {})
        this.type = 'MONGO'
        this.connection = require('mongoose').connection
        Logger.success('MongoDB connected successfully', '🗄️')
        // Even if Mongo connects, we still might want SQLite for local governance state if that's the design.
        // For now, adhering to the fallback logic, BUT the spec implies SQLite is always used for this module.
        // Let's ensure SQLite is initialized for the governance module regardless of Mongo.
        this.initSqlite()
        return
      } catch (err: any) {
        Logger.warning(`MongoDB connection failed: ${err.message}`, '🗄️')
        Logger.info('Falling back to SQLite (Main)...')
      }
    } else {
      Logger.info('MongoDB not configured - attempting SQLite fallback', '🗄️')
    }

    // 2. Fallback to SQLite (as main DB if Mongo failed)
    this.initSqlite()
  }

  private initSqlite () {
    try {
      // If we already have a connection (e.g. Mongo) but need SQLite for governance,
      // we might need a separate property. But for now, let's assume we can have a secondary DB or just this one.
      // given the structure, I'll attach it to a static or public property if it's the main one.

      // Since specific module needs SQLite, let's ensure it's available.
      // If 'connection' is already Mongo, we can't overwrite it if we want to support both.
      // However, the current class design allows only one 'connection'.
      // I will add a specific 'sqlite' property for the governance module.

      Logger.loading('Initializing SQLite database...')
      const dbPath = path.join(process.cwd(), 'database.sqlite')
      const sqlite = new Database(dbPath)

      // If we are in fallback mode, this is THE connection.
      if (this.type === 'NONE' || this.type === 'SQLITE') {
        this.connection = sqlite
        this.type = 'SQLITE'
      }

      // Initialize Governance Tables
      this.initTables(sqlite)

      Logger.success('SQLite database initialized', 'cj')
      return sqlite
    } catch (err: any) {
      Logger.error(`SQLite initialization failed: ${err.message}`, '🗄️')
      if (this.type === 'NONE') this.type = 'NONE'
    }
  }

  private initTables (db: any) {
    // NCAP Tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS ncap_posts (
        id TEXT PRIMARY KEY,
        channel_id TEXT, 
        message_id TEXT,
        content TEXT,
        status TEXT,
        timer_minutes INTEGER,
        created_at DATETIME,
        target_time DATETIME,
        urgency TEXT,
        author_id TEXT
      );
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS ncap_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT,
        user_id TEXT,
        action_type TEXT, 
        timestamp DATETIME,
        FOREIGN KEY(post_id) REFERENCES ncap_posts(id)
      );
    `)

    // Objection Hearings
    db.exec(`
      CREATE TABLE IF NOT EXISTS objection_hearings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT,
        thread_id TEXT,
        objector_id TEXT,
        status TEXT,
        created_at DATETIME,
        FOREIGN KEY(post_id) REFERENCES ncap_posts(id)
      );
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS motions (
        id TEXT PRIMARY KEY,
        type TEXT,
        text TEXT,
        context_url TEXT,
        status TEXT,
        channel_id TEXT,
        message_id TEXT,
        author_id TEXT,
        created_at DATETIME,
        closes_at DATETIME,
        timer_minutes INTEGER DEFAULT 4320
      );
    `)
    try {
      db.exec(
        'ALTER TABLE motions ADD COLUMN timer_minutes INTEGER DEFAULT 4320'
      )
    } catch (e) {
      // Ignore if column exists
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS motion_votes (
        motion_id TEXT,
        user_id TEXT,
        vote TEXT,
        timestamp DATETIME,
        PRIMARY KEY (motion_id, user_id),
        FOREIGN KEY(motion_id) REFERENCES motions(id)
      );
    `)

    // Ticketing Tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        thread_id TEXT,
        status TEXT,
        created_at DATETIME
      );
    `)
  }

  /**
   * Returns the SQLite database instance.
   * If the main connection is MongoDB, this will create/return a separate SQLite instance.
   */
  public getSqlite (): any {
    if (this.type === 'SQLITE') {
      return this.connection
    }
    // If Mongo is main, we need to ensure we have the SQLite instance.
    // For simplicity, let's re-open or return a cached one.
    // Since better-sqlite3 is synchronous and file-based, re-opening is cheap-ish but ideally we cache.
    // I'll assume initSqlite was called and I should store it.
    // Let's modify the class slightly to hold `sqliteConnection`.
    if (!this._sqliteConnection) {
      const dbPath = path.join(process.cwd(), 'database.sqlite')
      this._sqliteConnection = new Database(dbPath)
      this.initTables(this._sqliteConnection)
    }
    return this._sqliteConnection
  }
}
