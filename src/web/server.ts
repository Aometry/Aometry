import express, { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { BotClient } from '@/types/discord'
import Logger from '@/utilities/Logger'
import fs from 'fs'
import path from 'path'

/**
 * API Key Middleware
 */
const authenticate =
  (client: BotClient) => (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('X-API-KEY')
    const expectedKey = (client.config.API_KEY || '').trim()
    const providedKey = (apiKey || '').trim()

    if (!providedKey || providedKey !== expectedKey) {
      Logger.warning(
        `Failed API authentication from ${req.ip}.`,
        '🔐'
      )
      return res
        .status(401)
        .json({ message: 'Unauthorized: Invalid or missing API Key' })
    }
    next()
  }

/**
 * CORS Middleware
 */
const cors =
  (client: BotClient) => (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string
    if (
      origin &&
      client.config.ALLOWED_ORIGINS.some((o) => o.trim() === origin.trim())
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    }
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, PUT, DELETE'
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY')

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)
    }
    next()
  }

export function startAdminWebServer (client: BotClient) {
  const app = express()

  // Trust Cloudflare proxy
  app.set('trust proxy', 1)

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cors(client))

  // Root status endpoint (publicly reachable to verify bot is alive)
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'online',
      version: client.botVersion,
      name: client.user?.username || 'Aometry Bot',
      instances: 1 // Single agent for now
    })
  })

  // Authenticated Endpoints
  const api = express.Router()
  api.use(authenticate(client))
  const settingsRateLimit = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
  })

  // Modules List
  api.get('/modules', (_req, res) => {
    const modules = client.repositoryManager.getInstalledModules()
    res.json({
      modules: modules.map((module) => ({
        ...module,
        heartbeat: {
          enabled: module.heartbeatEnabled !== false,
          updateAvailable: Boolean(module.updateAvailable),
          latestVersionSeen: module.latestVersionSeen || null,
          lastUpdateCheckAt: module.lastUpdateCheckAt || null,
          lastUpdateResult: module.lastUpdateResult || null,
          lastUpdateError: module.lastUpdateError || null
        }
      }))
    })
  })

  // Module Installation
  api.post('/modules/install', async (req, res) => {
    const url = String(req.body?.url || '')
    if (!url) {
      return res.status(400).json({ message: 'Missing repository URL.' })
    }
    const success = await client.repositoryManager.install(url)
    return res.status(success ? 200 : 500).json({
      message: success
        ? `Installed modules from ${url}`
        : `Failed to install from ${url}`
    })
  })

  // Module Uninstallation
  api.post('/modules/uninstall', async (req, res) => {
    const name = String(req.body?.name || '')
    if (!name) {
      return res.status(400).json({ message: 'Missing module name.' })
    }
    const success = await client.repositoryManager.uninstall(name)
    return res.status(success ? 200 : 500).json({
      message: success ? `Uninstalled ${name}` : `Failed to uninstall ${name}`
    })
  })

  // Module Sync
  api.post('/modules/sync', (req, res) => {
    const name = String(req.body?.name || '')
    if (!name) {
      return res.status(400).json({ message: 'Missing module name.' })
    }
    const syncResult = client.repositoryManager.syncModuleToRemote(name)
    return res
      .status(syncResult.success ? 200 : 500)
      .json({ message: syncResult.message })
  })

  // Sync Configuration
  api.post('/modules/sync-config', (req, res) => {
    const name = String(req.body?.name || '')
    const { syncRemoteUrl, syncBranch, syncTokenEnvVar } = req.body
    if (!name) {
      return res.status(400).json({ message: 'Missing module name.' })
    }

    const result = client.repositoryManager.configureModuleSync(name, {
      ...(syncRemoteUrl ? { syncRemoteUrl } : {}),
      ...(syncBranch ? { syncBranch } : {}),
      ...(syncTokenEnvVar ? { syncTokenEnvVar } : {})
    })
    return res
      .status(result.success ? 200 : 500)
      .json({ message: result.message })
  })

  /**
   * Settings API
   */
  api.get('/settings', settingsRateLimit, (req, res) => {
    const settingsPath = path.join(process.cwd(), 'settings.json')
    let settings = {}
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    }
    res.json(settings)
  })

  api.post('/settings', settingsRateLimit, (req, res) => {
    const settingsPath = path.join(process.cwd(), 'settings.json')
    const newSettings = req.body
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2))
    res.json({
      message: 'Settings updated successfully',
      settings: newSettings
    })
  })

  app.use('/api', api)

  app.listen(client.config.WEBUI_PORT, () => {
    Logger.success(
      `Aometry API Agent listening on port ${client.config.WEBUI_PORT}`,
      '🌐'
    )
  })
}
