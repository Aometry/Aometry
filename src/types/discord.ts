import {
  Client,
  Collection,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  ContextMenuCommandBuilder,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ClientEvents,
  Message
} from 'discord.js'
import { Config } from './index'
import RepositoryManager from '@/utilities/RepositoryManager'
import DatabaseManager from '@/utilities/DatabaseManager'
import RuntimeModuleManager from '@/utilities/RuntimeModuleManager'

export interface BotClient extends Client {
  config: Config;
  botVersion: string;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  events: Collection<string, any>;
  componentHandlers: Collection<
    string,
    (interaction: any, client: BotClient) => Promise<void>
  >;
  repositoryManager: RepositoryManager;
  databaseManager: DatabaseManager;
  runtimeModuleManager: RuntimeModuleManager;
  startRepositoryHeartbeat: () => void;
  stopRepositoryHeartbeat: () => void;
}

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | ContextMenuCommandBuilder;
  developer?: boolean;
  execute: (args: {
    interaction:
      | ChatInputCommandInteraction
      | UserContextMenuCommandInteraction
      | MessageContextMenuCommandInteraction;
    client: BotClient;
  }) => Promise<any>;
  subCommand?: string;
}

export interface SubCommand {
  subCommand: string;
  execute: (
    interaction: ChatInputCommandInteraction,
    client: BotClient,
  ) => Promise<any>;
}

export interface Event<K extends keyof ClientEvents | string> {
  name: K;
  once?: boolean;
  rest?: boolean;
  execute: (...args: any[]) => Promise<void> | void;
}

export interface CommandExecuteOptions {
  interaction: ChatInputCommandInteraction;
  client: BotClient;
}
