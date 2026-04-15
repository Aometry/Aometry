import express, { Request, Response, NextFunction } from 'express'
import { BotClient } from '@/types/discord'
import Logger from '@/utilities/Logger'
import fs from 'fs'
import path from 'path'

/**
 * API Key Middleware
 */
const authenticate = (client: BotClient) => (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== client.config.API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing API Key' })
  }
  next()
}

/**
 * CORS Middleware
 */
const cors = (client: BotClient) => (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string
  if (client.config.ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
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

  // Modules List
  api.get('/modules', (_req, res) => {
    res.json({ modules: client.repositoryManager.getInstalledModules() })
  })

  // Module Installation
  api.post('/modules/install', async (req, res) => {
    const url = String(req.body?.url || '')
    if (!url) {
      return res.status(400).json({ message: 'Missing repository URL.' })
    }
    const success = await client.repositoryManager.install(url)
    return res.status(success ? 200 : 500).json({
      message: success ? `Installed modules from ${url}` : `Failed to install from ${url}`
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
    return res.status(syncResult.success ? 200 : 500).json({ message: syncResult.message })
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
    return res.status(result.success ? 200 : 500).json({ message: result.message })
  })

  /**
   * Settings API
   */
  api.get('/settings', (req, res) => {
    const settingsPath = path.join(process.cwd(), 'settings.json')
    let settings = {}
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    }
    res.json(settings)
  })

  api.post('/settings', (req, res) => {
    const settingsPath = path.join(process.cwd(), 'settings.json')
    const newSettings = req.body
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2))
    res.json({ message: 'Settings updated successfully', settings: newSettings })
  })

  app.use('/api', api)

  app.listen(client.config.WEBUI_PORT, () => {
    Logger.success(`Aometry API Agent listening on port ${client.config.WEBUI_PORT}`, '🌐')
  })
}
