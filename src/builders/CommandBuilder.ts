import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
  SlashCommandBooleanOption,
  SlashCommandUserOption,
  SlashCommandChannelOption,
  SlashCommandRoleOption,
  SlashCommandSubcommandBuilder,
  PermissionFlagsBits
} from 'discord.js'
import { BotClient, Command } from '@/types/discord'

type CommandExecute = (options: {
  interaction: ChatInputCommandInteraction;
  client: BotClient;
}) => Promise<any>;

export class CommandBuilder {
  private data: SlashCommandBuilder
  private executeFn: CommandExecute | null = null

  constructor (name: string, description: string) {
    this.data = new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
  }

  addStringOption (
    name: string,
    description: string,
    required: boolean = false,
    choices?: { name: string; value: string }[]
  ) {
    this.data.addStringOption((option: SlashCommandStringOption) => {
      option.setName(name).setDescription(description).setRequired(required)
      if (choices) option.addChoices(...choices)
      return option
    })
    return this
  }

  addIntegerOption (
    name: string,
    description: string,
    required: boolean = false,
    minValue?: number,
    maxValue?: number
  ) {
    this.data.addIntegerOption((option: SlashCommandIntegerOption) => {
      option.setName(name).setDescription(description).setRequired(required)
      if (minValue !== undefined) option.setMinValue(minValue)
      if (maxValue !== undefined) option.setMaxValue(maxValue)
      return option
    })
    return this
  }

  addBooleanOption (
    name: string,
    description: string,
    required: boolean = false
  ) {
    this.data.addBooleanOption((option: SlashCommandBooleanOption) =>
      option.setName(name).setDescription(description).setRequired(required)
    )
    return this
  }

  addUserOption (name: string, description: string, required: boolean = false) {
    this.data.addUserOption((option: SlashCommandUserOption) =>
      option.setName(name).setDescription(description).setRequired(required)
    )
    return this
  }

  addChannelOption (
    name: string,
    description: string,
    required: boolean = false
  ) {
    this.data.addChannelOption((option: SlashCommandChannelOption) =>
      option.setName(name).setDescription(description).setRequired(required)
    )
    return this
  }

  addRoleOption (name: string, description: string, required: boolean = false) {
    this.data.addRoleOption((option: SlashCommandRoleOption) =>
      option.setName(name).setDescription(description).setRequired(required)
    )
    return this
  }

  addSubcommand (
    fn: (
      subcommand: SlashCommandSubcommandBuilder
    ) => SlashCommandSubcommandBuilder
  ) {
    this.data.addSubcommand(fn)
    return this
  }

  setDMPermission (enabled: boolean) {
    this.data.setDMPermission(enabled)
    return this
  }

  setDefaultMemberPermissions (permissions: bigint | number) {
    this.data.setDefaultMemberPermissions(permissions)
    return this
  }

  execute (fn: CommandExecute) {
    this.executeFn = fn
    return this
  }

  toJSON (): Command {
    if (!this.executeFn) {
      throw new Error(
        `Command ${this.data.name} is missing an execute function`
      )
    }
    return {
      data: this.data,
      execute: (args) =>
        this.executeFn!({
          ...args,
          interaction: args.interaction as ChatInputCommandInteraction
        })
    }
  }
}

export function createCommand (
  name: string,
  description: string,
  builderFn?: (builder: CommandBuilder) => void
): Command {
  const builder = new CommandBuilder(name, description)
  if (builderFn) builderFn(builder)
  return builder.toJSON()
}
