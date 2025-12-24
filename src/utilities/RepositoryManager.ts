import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { rimraf } from 'rimraf'
import Logger from './Logger'
import { BotClient } from '@/types/discord'
import { ModuleInfo } from '@/types/index'

export default class RepositoryManager {
  private client: BotClient
  private installedModulesPath: string
  private tempDir: string

  constructor (client: BotClient) {
    this.client = client
    this.installedModulesPath = path.join(
      process.cwd(),
      'installed_modules',
      'installedModules.json'
    )
    this.tempDir = path.join(process.cwd(), 'temp_repo')
  }

  getInstalledModules (): ModuleInfo[] {
    if (!fs.existsSync(this.installedModulesPath)) {
      return []
    }
    return require(this.installedModulesPath)
  }

  saveInstalledModules (modules: ModuleInfo[]) {
    fs.writeFileSync(
      this.installedModulesPath,
      JSON.stringify(modules, null, 2)
    )
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
          description: module.description
        })
        Logger.success(`Installed module: ${module.name}`, '📦')
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
}
