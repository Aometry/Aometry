import { ChatInputCommandInteraction, PermissionResolvable, GuildMember } from 'discord.js'

export function isValidUrl (string: string): boolean {
  try {
    const _url = new URL(string)
    return !!_url
  } catch (_) {
    return false
  }
}

export function isValidId (id: string): boolean {
  return /^\d{17,19}$/.test(id)
}

export function hasPermission (
  interaction: ChatInputCommandInteraction,
  permission: PermissionResolvable
): boolean {
  if (!interaction.member || !(interaction.member instanceof GuildMember)) return false
  return interaction.member.permissions.has(permission)
}

export function isInGuild (interaction: ChatInputCommandInteraction): boolean {
  return !!interaction.guild
}

export function isDeveloper (userId: string, devId: string): boolean {
  return userId === devId
}
