export interface Config {
  BOT_TOKEN: string;
  DB_URL: string | null;
  SYSTEM_LOGS_CHANNEL: string;
  LOGS_CHANNEL: string;
  DEV_ID: string;
  WEBUI_PORT: number;
  API_KEY: string;
  ALLOWED_ORIGINS: string[];
  installedRepositories: RepositoryInfo[];
  installedModules: ModuleInfo[];
}

export interface ModuleInfo {
  name: string;
  repository: string;
  path: string;
  version: string;
  description: string;
  repositoryUrl?: string;
  syncRemoteUrl?: string;
  syncBranch?: string;
  syncTokenEnvVar?: string;
  syncStatus?: 'manual' | 'synced';
  lastSyncedAt?: string;
}

export interface RepositoryInfo {
  name: string;
  url: string;
  modules: ModuleInfo[];
}

export interface LoggerOptions {
  padding?: number;
  margin?: number;
  borderStyle?: string;
  borderColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
  title?: string;
}
