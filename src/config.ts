import dotenv from 'dotenv'
import { Config } from './types/index'
import fs from 'fs'
import path from 'path'

dotenv.config()

const requiredConfigs = [
  'BOT_TOKEN',
  'LOGS_CHANNEL',
  'DEV_ID'
] as const

for (const config of requiredConfigs) {
  if (!process.env[config]) {
    throw new Error(`Missing ${config} in .env`)
  }
}

const requiredEnv = ['BOT_TOKEN', 'SYSTEM_LOGS_CHANNEL', 'LOGS_CHANNEL', 'DEV_ID']
const missingEnv = requiredEnv.filter(env => !process.env[env])

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`)
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
  installedRepositories,
  installedModules
}

export default config
