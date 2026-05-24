import dotenv from 'dotenv'
import { Config } from './types/index'
import fs from 'fs'
import path from 'path'

dotenv.config()
console.log('[Config] API_KEY loaded:', process.env.API_KEY ? 'yes' : 'NO')

const requiredConfigs = [
  'BOT_TOKEN',
  'LOGS_CHANNEL',
  'DEV_ID',
  'API_KEY'
] as const

for (const key of requiredConfigs) {
  if (!process.env[key]) {
    // We don't throw during setup phase, but we should log it
    console.warn(`[Config] Missing ${key} in .env`)
  }
}


// Dynamic loading of installed modules/repos
const installedModulesPath = path.join(process.cwd(), 'installed_modules', 'installedModules.json')
const installedRepositoriesPath = path.join(process.cwd(), 'installed_modules', 'installedRepositories.json')

let installedModules = []
let installedRepositories = []

try {
  if (fs.existsSync(installedModulesPath)) {
    installedModules = JSON.parse(fs.readFileSync(installedModulesPath, 'utf-8'))
  }
  if (fs.existsSync(installedRepositoriesPath)) {
    installedRepositories = JSON.parse(fs.readFileSync(installedRepositoriesPath, 'utf-8'))
  }
} catch (error) {
  console.warn('Failed to load installed modules/repositories config:', error)
}

const config: Config = {
  BOT_TOKEN: process.env.BOT_TOKEN!,
  DB_URL: process.env.DB_URL || null,
  SYSTEM_LOGS_CHANNEL: process.env.SYSTEM_LOGS_CHANNEL!,
  LOGS_CHANNEL: process.env.LOGS_CHANNEL!,
  DEV_ID: process.env.DEV_ID!,
  WEBUI_PORT: Number(process.env.WEBUI_PORT || 3000),
  API_KEY: process.env.API_KEY || '',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  installedRepositories,
  installedModules
}

export default config
