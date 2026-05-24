import fs from "fs";
import { promises as fsp } from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { spawn } from "child_process";
import { createHash } from "crypto";
import { rimraf } from "rimraf";
import Logger from "./Logger";
import { BotClient } from "@/types/discord";
import { ModuleInfo } from "@/types/index";
import RuntimeModuleManager from "./RuntimeModuleManager";

interface RemoteModuleInfo {
  name: string;
  path: string;
  version?: string;
}

interface RemoteRepoSnapshot {
  tempDir: string;
  repoVersion?: string;
  modulesByName: Map<string, RemoteModuleInfo>;
}

interface HeartbeatSummary {
  ran: boolean;
  skipped: boolean;
  checked: number;
  updated: number;
  skippedLocalChanges: number;
  errors: number;
  message: string;
}

export default class RepositoryManager {
  private client: BotClient;
  private installedModulesPath: string;
  private tempDir: string;
  private runtimeManager?: RuntimeModuleManager;
  private heartbeatInProgress = false;

  constructor(client: BotClient) {
    this.client = client;
    this.installedModulesPath = path.join(
      process.cwd(),
      "installed_modules",
      "installedModules.json",
    );
    this.tempDir = path.join(process.cwd(), "temp_repo");
    this.ensureInstalledModulesManifest();
  }

  setRuntimeManager(runtimeManager: RuntimeModuleManager) {
    this.runtimeManager = runtimeManager;
  }

  private ensureInstalledModulesManifest() {
    const modulesDir = path.join(process.cwd(), "installed_modules");
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir, { recursive: true });
    }

    if (!fs.existsSync(this.installedModulesPath)) {
      fs.writeFileSync(this.installedModulesPath, JSON.stringify([], null, 2));
    }
  }

  getInstalledModules(): ModuleInfo[] {
    this.ensureInstalledModulesManifest();
    const raw = fs.readFileSync(this.installedModulesPath, "utf-8");
    return JSON.parse(raw) as ModuleInfo[];
  }

  saveInstalledModules(modules: ModuleInfo[]) {
    this.ensureInstalledModulesManifest();
    fs.writeFileSync(
      this.installedModulesPath,
      JSON.stringify(modules, null, 2),
    );
  }

  configureModuleSync(
    moduleName: string,
    options: {
      syncRemoteUrl?: string;
      syncBranch?: string;
      syncTokenEnvVar?: string;
    },
  ): { success: boolean; message: string } {
    const installedModules = this.getInstalledModules();
    const moduleIndex = installedModules.findIndex(
      (m) => m.name === moduleName,
    );
    if (moduleIndex === -1) {
      return {
        success: false,
        message: `Module ${moduleName} is not installed`,
      };
    }

    installedModules[moduleIndex] = {
      ...installedModules[moduleIndex],
      ...options,
    };
    this.saveInstalledModules(installedModules);
    return {
      success: true,
      message: `Updated sync configuration for ${moduleName}`,
    };
  }

  async install(repoUrl: string): Promise<boolean> {
    Logger.loading(`Cloning repository: ${repoUrl}`);
    try {
      if (fs.existsSync(this.tempDir)) {
        await rimraf(this.tempDir);
      }
      execSync(`git clone ${repoUrl} ${this.tempDir}`, { stdio: "ignore" });

      const infoPath = path.join(this.tempDir, "info.json");
      if (!fs.existsSync(infoPath)) {
        throw new Error("Repository does not contain info.json");
      }

      const info = require(infoPath);
      const installedModules = this.getInstalledModules();

      Logger.subsection(`Installing modules from ${info.name}`);

      for (const module of info.modules) {
        const sourcePath = path.join(this.tempDir, module.path);
        const destPath = path.join(
          process.cwd(),
          "installed_modules",
          module.name,
        );

        if (fs.existsSync(destPath)) {
          Logger.warning(`Module ${module.name} already exists. Skipping.`);
          continue;
        }

        fs.cpSync(sourcePath, destPath, { recursive: true });
        const localSnapshotHash = await this.computeDirectoryHash(destPath);

        installedModules.push({
          name: module.name,
          repository: info.name,
          path: `/installed_modules/${module.name}`,
          version: info.version,
          description: module.description,
          repositoryUrl: repoUrl,
          syncStatus: "manual",
          heartbeatEnabled: true,
          updateAvailable: false,
          lastUpdateResult: "up-to-date",
          latestVersionSeen: info.version,
          lastUpdateCheckAt: new Date().toISOString(),
          localSnapshotHash,
        });
        Logger.success(`Installed module: ${module.name}`, "📦");

        if (this.runtimeManager) {
          await this.runtimeManager.loadModule(module.name);
        }
      }

      this.saveInstalledModules(installedModules);
      await rimraf(this.tempDir);
      Logger.success("Installation complete!", "🎉");
      return true;
    } catch (err: any) {
      Logger.error("Installation failed: " + err.message);
      if (fs.existsSync(this.tempDir)) {
        await rimraf(this.tempDir);
      }
      return false;
    }
  }

  async uninstall(moduleName: string): Promise<boolean> {
    const installedModules = this.getInstalledModules();
    const moduleIndex = installedModules.findIndex(
      (m) => m.name === moduleName,
    );

    if (moduleIndex === -1) {
      Logger.error(`Module ${moduleName} not found`);
      return false;
    }

    const moduleData = installedModules[moduleIndex];
    const modulePath = path.join(
      process.cwd(),
      "installed_modules",
      moduleData.name,
    );

    try {
      await rimraf(modulePath);
      installedModules.splice(moduleIndex, 1);
      this.saveInstalledModules(installedModules);
      if (this.runtimeManager) {
        await this.runtimeManager.unloadModule(moduleName);
      }
      Logger.success(`Uninstalled module: ${moduleName}`, "🗑️");
      return true;
    } catch (err: any) {
      Logger.error(`Failed to uninstall ${moduleName}: ` + err.message);
      return false;
    }
  }

  list(): ModuleInfo[] {
    const modules = this.getInstalledModules();
    if (modules.length === 0) {
      Logger.info("No modules installed");
      return [];
    }

    Logger.section("📦 Installed Modules");
    modules.forEach((m) => {
      Logger.listItem(`${m.name} (v${m.version}) from ${m.repository}`);
    });
    Logger.line();
    return modules;
  }

  syncModuleToRemote(
    moduleName: string,
    commitMessage: string = "Sync installed module",
  ): { success: boolean; message: string } {
    const modulePath = path.join(
      process.cwd(),
      "installed_modules",
      moduleName,
    );
    if (!fs.existsSync(modulePath)) {
      return {
        success: false,
        message: `Module ${moduleName} not found at installed_modules/${moduleName}`,
      };
    }

    const moduleInfo = this.getInstalledModules().find(
      (m) => m.name === moduleName,
    );
    if (!moduleInfo) {
      return {
        success: false,
        message: `Module ${moduleName} is not present in installedModules.json`,
      };
    }

    const remoteUrl = moduleInfo.syncRemoteUrl || moduleInfo.repositoryUrl;
    if (!remoteUrl) {
      return {
        success: false,
        message: `Module ${moduleName} has no sync remote configured`,
      };
    }

    const branch = moduleInfo.syncBranch || "main";
    const tokenVarName =
      moduleInfo.syncTokenEnvVar || "MODULE_SYNC_GITHUB_TOKEN";
    const token = process.env[tokenVarName];
    if (!token) {
      return {
        success: false,
        message: `Missing ${tokenVarName} in environment`,
      };
    }

    try {
      execSync(`git -C "${modulePath}" remote set-url origin ${remoteUrl}`, {
        stdio: "ignore",
      });
      const authUrl = remoteUrl.replace(
        "https://",
        `https://x-access-token:${token}@`,
      );
      execSync(`git -C "${modulePath}" add .`, { stdio: "ignore" });
      execSync(
        `git -C "${modulePath}" commit -m "${commitMessage.replace(/"/g, '\\"')}" || true`,
        { stdio: "ignore" },
      );
      execSync(`git -C "${modulePath}" push "${authUrl}" HEAD:${branch}`, {
        stdio: "ignore",
      });

      const installedModules = this.getInstalledModules().map((m) =>
        m.name === moduleName
          ? {
              ...m,
              syncStatus: "synced" as const,
              lastSyncedAt: new Date().toISOString(),
            }
          : m,
      );
      this.saveInstalledModules(installedModules);

      return {
        success: true,
        message: `Module ${moduleName} synced to ${remoteUrl}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to sync ${moduleName}: ${error.message}`,
      };
    }
  }

  async checkAndAutoUpdateModules(): Promise<HeartbeatSummary> {
    if (this.heartbeatInProgress) {
      return {
        ran: false,
        skipped: true,
        checked: 0,
        updated: 0,
        skippedLocalChanges: 0,
        errors: 0,
        message: "Repository heartbeat is already running",
      };
    }

    this.heartbeatInProgress = true;
    const now = new Date().toISOString();
    const installedModules = this.getInstalledModules();
    const summary: HeartbeatSummary = {
      ran: true,
      skipped: false,
      checked: 0,
      updated: 0,
      skippedLocalChanges: 0,
      errors: 0,
      message: "Repository heartbeat completed",
    };

    const repoCache = new Map<string, RemoteRepoSnapshot>();
    let runtimeReloadNeeded = false;

    try {
      for (const moduleInfo of installedModules) {
        if (moduleInfo.heartbeatEnabled === false) {
          continue;
        }

        summary.checked += 1;
        moduleInfo.lastUpdateCheckAt = now;

        const repoUrl = moduleInfo.repositoryUrl;
        if (!repoUrl) {
          moduleInfo.lastUpdateResult = "not-configured";
          moduleInfo.lastUpdateError =
            "No repository URL configured for this module";
          summary.errors += 1;
          continue;
        }

        const branch = moduleInfo.syncBranch;
        const repoKey = `${repoUrl}#${branch || "default"}`;

        try {
          const repoSnapshot = await this.getRemoteRepoSnapshot(
            repoCache,
            repoKey,
            repoUrl,
            branch,
          );
          const remoteModule = repoSnapshot.modulesByName.get(moduleInfo.name);

          if (!remoteModule) {
            moduleInfo.lastUpdateResult = "error";
            moduleInfo.lastUpdateError = `Module ${moduleInfo.name} is not present in remote info.json`;
            summary.errors += 1;
            continue;
          }

          const remoteVersion =
            remoteModule.version ||
            repoSnapshot.repoVersion ||
            moduleInfo.version;
          moduleInfo.latestVersionSeen = remoteVersion;
          moduleInfo.lastUpdateError = undefined;

          if (remoteVersion === moduleInfo.version) {
            moduleInfo.updateAvailable = false;
            moduleInfo.lastUpdateResult = "up-to-date";

            const modulePath = path.join(
              process.cwd(),
              "installed_modules",
              moduleInfo.name,
            );
            if (fs.existsSync(modulePath) && !moduleInfo.localSnapshotHash) {
              moduleInfo.localSnapshotHash =
                await this.computeDirectoryHash(modulePath);
            }
            continue;
          }

          moduleInfo.updateAvailable = true;
          const modulePath = path.join(
            process.cwd(),
            "installed_modules",
            moduleInfo.name,
          );

          if (!fs.existsSync(modulePath)) {
            moduleInfo.lastUpdateResult = "error";
            moduleInfo.lastUpdateError = `Installed module folder is missing: ${moduleInfo.name}`;
            summary.errors += 1;
            continue;
          }

          const currentHash = await this.computeDirectoryHash(modulePath);
          if (!moduleInfo.localSnapshotHash) {
            moduleInfo.localSnapshotHash = currentHash;
            moduleInfo.lastUpdateResult = "skipped-local-changes";
            moduleInfo.lastUpdateError =
              "Baseline snapshot created; update skipped this cycle to avoid overwrite";
            summary.skippedLocalChanges += 1;
            continue;
          }

          if (moduleInfo.localSnapshotHash !== currentHash) {
            moduleInfo.lastUpdateResult = "skipped-local-changes";
            moduleInfo.lastUpdateError =
              "Local changes detected; update skipped to avoid overwrite";
            summary.skippedLocalChanges += 1;
            continue;
          }

          await this.applyModuleUpdateFromSnapshot(
            moduleInfo.name,
            repoSnapshot.tempDir,
            remoteModule.path,
          );

          moduleInfo.version = remoteVersion;
          moduleInfo.latestVersionSeen = remoteVersion;
          moduleInfo.updateAvailable = false;
          moduleInfo.lastUpdateResult = "updated";
          moduleInfo.lastUpdateError = undefined;
          moduleInfo.localSnapshotHash =
            await this.computeDirectoryHash(modulePath);
          summary.updated += 1;
          runtimeReloadNeeded = true;
        } catch (error: any) {
          moduleInfo.lastUpdateResult = "error";
          moduleInfo.lastUpdateError = error.message;
          summary.errors += 1;
        }
      }

      if (runtimeReloadNeeded && this.runtimeManager) {
        await this.runtimeManager.reloadRuntime();
      }

      this.saveInstalledModules(installedModules);
      return summary;
    } finally {
      await this.cleanupRepoCache(repoCache);
      this.heartbeatInProgress = false;
    }
  }

  private async getRemoteRepoSnapshot(
    repoCache: Map<string, RemoteRepoSnapshot>,
    repoKey: string,
    repoUrl: string,
    branch?: string,
  ): Promise<RemoteRepoSnapshot> {
    const cached = repoCache.get(repoKey);
    if (cached) {
      return cached;
    }

    const tempDir = await fsp.mkdtemp(
      path.join(os.tmpdir(), "aometry-heartbeat-"),
    );
    const cloneArgs = ["clone", "--depth", "1"];
    if (branch) {
      cloneArgs.push("--branch", branch);
    }
    cloneArgs.push(repoUrl, tempDir);

    await this.runGitCommand(cloneArgs);

    const infoPath = path.join(tempDir, "info.json");
    if (!fs.existsSync(infoPath)) {
      throw new Error(`Remote repository ${repoUrl} is missing info.json`);
    }

    const rawInfo = await fsp.readFile(infoPath, "utf-8");
    const info = JSON.parse(rawInfo);
    const modulesByName = new Map<string, RemoteModuleInfo>();

    for (const item of info.modules || []) {
      if (!item?.name || !item?.path) {
        continue;
      }

      modulesByName.set(item.name, {
        name: item.name,
        path: item.path,
        version: item.version || info.version,
      });
    }

    const snapshot: RemoteRepoSnapshot = {
      tempDir,
      repoVersion: info.version,
      modulesByName,
    };
    repoCache.set(repoKey, snapshot);

    return snapshot;
  }

  private async applyModuleUpdateFromSnapshot(
    moduleName: string,
    repoTempDir: string,
    sourceModulePath: string,
  ): Promise<void> {
    const sourcePath = path.join(repoTempDir, sourceModulePath);
    const destinationPath = path.join(
      process.cwd(),
      "installed_modules",
      moduleName,
    );

    if (!fs.existsSync(sourcePath)) {
      throw new Error(
        `Remote source path not found for ${moduleName}: ${sourceModulePath}`,
      );
    }

    await rimraf(destinationPath);
    await fsp.cp(sourcePath, destinationPath, { recursive: true });
  }

  private async cleanupRepoCache(repoCache: Map<string, RemoteRepoSnapshot>) {
    for (const snapshot of repoCache.values()) {
      if (fs.existsSync(snapshot.tempDir)) {
        await rimraf(snapshot.tempDir);
      }
    }
  }

  private async runGitCommand(args: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("git", args, {
        stdio: "ignore",
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`git ${args.join(" ")} failed with code ${code}`));
      });
    });
  }

  private async computeDirectoryHash(directoryPath: string): Promise<string> {
    const files = await this.collectFiles(directoryPath);
    const hash = createHash("sha256");

    for (const filePath of files) {
      const relativePath = path.relative(directoryPath, filePath);
      hash.update(relativePath);
      hash.update("\0");
      const fileContent = await fsp.readFile(filePath);
      hash.update(fileContent);
      hash.update("\0");
    }

    return hash.digest("hex");
  }

  private async collectFiles(directoryPath: string): Promise<string[]> {
    const entries = await fsp.readdir(directoryPath, { withFileTypes: true });
    const sortedEntries = entries.sort((a, b) => a.name.localeCompare(b.name));
    const files: string[] = [];

    for (const entry of sortedEntries) {
      if (entry.name === ".git") {
        continue;
      }

      const absolutePath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.collectFiles(absolutePath)));
        continue;
      }

      if (entry.isFile()) {
        files.push(absolutePath);
      }
    }

    return files;
  }
}
