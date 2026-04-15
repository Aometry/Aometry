import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { rimraf } from 'rimraf'
import Logger from './Logger'
import { BotClient } from '@/types/discord'
import { ModuleInfo } from '@/types/index'
import RuntimeModuleManager from './RuntimeModuleManager'

export default class RepositoryManager {
  private client: BotClient
  private installedModulesPath: string
  private tempDir: string
  private runtimeManager?: RuntimeModuleManager

  constructor (client: BotClient) {
    this.client = client
    this.installedModulesPath = path.join(
      process.cwd(),
      'installed_modules',
      'installedModules.json'
    )
    this.tempDir = path.join(process.cwd(), 'temp_repo')
    this.ensureInstalledModulesManifest()
  }

  setRuntimeManager (runtimeManager: RuntimeModuleManager) {
    this.runtimeManager = runtimeManager
  }

  private ensureInstalledModulesManifest () {
    const modulesDir = path.join(process.cwd(), 'installed_modules')
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir, { recursive: true })
    }

    if (!fs.existsSync(this.installedModulesPath)) {
      fs.writeFileSync(this.installedModulesPath, JSON.stringify([], null, 2))
    }
  }

  getInstalledModules (): ModuleInfo[] {
    this.ensureInstalledModulesManifest()
    const raw = fs.readFileSync(this.installedModulesPath, 'utf-8')
    return JSON.parse(raw) as ModuleInfo[]
  }

  saveInstalledModules (modules: ModuleInfo[]) {
    this.ensureInstalledModulesManifest()
    fs.writeFileSync(
      this.installedModulesPath,
      JSON.stringify(modules, null, 2)
    )
  }

  configureModuleSync (
    moduleName: string,
    options: {
      syncRemoteUrl?: string
      syncBranch?: string
      syncTokenEnvVar?: string
    }
  ): { success: boolean, message: string } {
    const installedModules = this.getInstalledModules()
    const moduleIndex = installedModules.findIndex(m => m.name === moduleName)
    if (moduleIndex === -1) {
      return { success: false, message: `Module ${moduleName} is not installed` }
    }

    installedModules[moduleIndex] = {
      ...installedModules[moduleIndex],
      ...options
    }
    this.saveInstalledModules(installedModules)
    return { success: true, message: `Updated sync configuration for ${moduleName}` }
  }

  async install (repoUrl: string): Promise<boolean> {
    Logger.loading(`Cloning repository: ${repoUrl}`)
    try {
      if (fs.existsSync(this.tempDir)) {
        await rimraf(this.tempDir)
      }
      execSync(`git clone ${repoUrl} ${this.tempDir}`, { stdio: 'ignore' })

      const infoPath = path.join(this.tempDir, 'info.json')
      if (!fs.existsSync(infoPath)) {
        throw new Error('Repository does not contain info.json')
      }

      const info = require(infoPath)
      const installedModules = this.getInstalledModules()

      Logger.subsection(`Installing modules from ${info.name}`)

      for (const module of info.modules) {
        const sourcePath = path.join(this.tempDir, module.path)
        const destPath = path.join(
          process.cwd(),
          'installed_modules',
          module.name
        )

        if (fs.existsSync(destPath)) {
          Logger.warning(`Module ${module.name} already exists. Skipping.`)
          continue
        }

        fs.cpSync(sourcePath, destPath, { recursive: true })

        installedModules.push({
          name: module.name,
          repository: info.name,
          path: `/installed_modules/${module.name}`,
          version: info.version,
          description: module.description,
          repositoryUrl: repoUrl,
          syncStatus: 'manual'
        })
        Logger.success(`Installed module: ${module.name}`, '📦')

        if (this.runtimeManager) {
          await this.runtimeManager.loadModule(module.name)
        }
      }

      this.saveInstalledModules(installedModules)
      await rimraf(this.tempDir)
      Logger.success('Installation complete!', '🎉')
      return true
    } catch (err: any) {
      Logger.error('Installation failed: ' + err.message)
      if (fs.existsSync(this.tempDir)) {
        await rimraf(this.tempDir)
      }
      return false
    }
  }

  async uninstall (moduleName: string): Promise<boolean> {
    const installedModules = this.getInstalledModules()
    const moduleIndex = installedModules.findIndex(
      (m) => m.name === moduleName
    )

    if (moduleIndex === -1) {
      Logger.error(`Module ${moduleName} not found`)
      return false
    }

    const moduleData = installedModules[moduleIndex]
    const modulePath = path.join(
      process.cwd(),
      'installed_modules',
      moduleData.name
    )

    try {
      await rimraf(modulePath)
      installedModules.splice(moduleIndex, 1)
      this.saveInstalledModules(installedModules)
      if (this.runtimeManager) {
        await this.runtimeManager.unloadModule(moduleName)
      }
      Logger.success(`Uninstalled module: ${moduleName}`, '🗑️')
      return true
    } catch (err: any) {
      Logger.error(`Failed to uninstall ${moduleName}: ` + err.message)
      return false
    }
  }

  list (): ModuleInfo[] {
    const modules = this.getInstalledModules()
    if (modules.length === 0) {
      Logger.info('No modules installed')
      return []
    }

    Logger.section('📦 Installed Modules')
    modules.forEach((m) => {
      Logger.listItem(`${m.name} (v${m.version}) from ${m.repository}`)
    })
    Logger.line()
    return modules
  }

  syncModuleToRemote (moduleName: string, commitMessage: string = 'Sync installed module'): { success: boolean, message: string } {
    const modulePath = path.join(process.cwd(), 'installed_modules', moduleName)
    if (!fs.existsSync(modulePath)) {
      return { success: false, message: `Module ${moduleName} not found at installed_modules/${moduleName}` }
    }

    const moduleInfo = this.getInstalledModules().find(m => m.name === moduleName)
    if (!moduleInfo) {
      return { success: false, message: `Module ${moduleName} is not present in installedModules.json` }
    }

    const remoteUrl = moduleInfo.syncRemoteUrl || moduleInfo.repositoryUrl
    if (!remoteUrl) {
      return { success: false, message: `Module ${moduleName} has no sync remote configured` }
    }

    const branch = moduleInfo.syncBranch || 'main'
    const tokenVarName = moduleInfo.syncTokenEnvVar || 'MODULE_SYNC_GITHUB_TOKEN'
    const token = process.env[tokenVarName]
    if (!token) {
      return { success: false, message: `Missing ${tokenVarName} in environment` }
    }

    try {
      execSync(`git -C "${modulePath}" remote set-url origin ${remoteUrl}`, { stdio: 'ignore' })
      const authUrl = remoteUrl.replace('https://', `https://x-access-token:${token}@`)
      execSync(`git -C "${modulePath}" add .`, { stdio: 'ignore' })
      execSync(
        `git -C "${modulePath}" commit -m "${commitMessage.replace(/"/g, '\\"')}" || true`,
        { stdio: 'ignore' }
      )
      execSync(`git -C "${modulePath}" push "${authUrl}" HEAD:${branch}`, { stdio: 'ignore' })

      const installedModules = this.getInstalledModules().map((m) => m.name === moduleName
        ? {
            ...m,
            syncStatus: 'synced' as const,
            lastSyncedAt: new Date().toISOString()
          }
        : m)
      this.saveInstalledModules(installedModules)

      return { success: true, message: `Module ${moduleName} synced to ${remoteUrl}` }
    } catch (error: any) {
      return { success: false, message: `Failed to sync ${moduleName}: ${error.message}` }
    }
  }
}
