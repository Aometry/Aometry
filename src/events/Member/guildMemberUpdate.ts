import { Events, GuildMember, PartialGuildMember } from 'discord.js'
import { BotClient, Event } from '@/types/discord'

const event: Event<Events.GuildMemberUpdate> = {
  name: Events.GuildMemberUpdate,
  execute: async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember | PartialGuildMember, client: BotClient) => {
    // If the roles haven't changed, we don't care
    if (oldMember.roles.cache.size === newMember.roles.cache.size) return

    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id))
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id))

    if (addedRoles.size === 0 && removedRoles.size === 0) return

    const db = client.databaseManager.getSqlite()

    let roleSets
    try {
      roleSets = db.prepare('SELECT type, role_ids FROM role_sets WHERE guild_id = ?').all(newMember.guild.id)
    } catch (err) {
      // Table might not exist or other DB errors
      return
    }

    if (!roleSets || roleSets.length === 0) return

    const rolesToAdd = new Set<string>()
    const rolesToRemove = new Set<string>()

    // Handle added roles constraint
    for (const addedRole of addedRoles.values()) {
      for (const set of roleSets) {
        const roleIds: string[] = JSON.parse(set.role_ids)

        if (roleIds.includes(addedRole.id)) {
          if (set.type === 'GROUP') {
            // Add all other roles in the group
            for (const id of roleIds) {
              if (id !== addedRole.id && !newMember.roles.cache.has(id)) {
                rolesToAdd.add(id)
              }
            }
          } else if (set.type === 'UNIQUE') {
            // Remove all other roles in the unique set that the user CURRENTLY has
            for (const id of roleIds) {
              if (id !== addedRole.id && newMember.roles.cache.has(id)) {
                rolesToRemove.add(id)
              }
            }
          }
        }
      }
    }

    // Handle removed roles constraint
    for (const removedRole of removedRoles.values()) {
      for (const set of roleSets) {
        const roleIds: string[] = JSON.parse(set.role_ids)

        if (roleIds.includes(removedRole.id)) {
          if (set.type === 'GROUP') {
            // Remove all other roles in the group
            for (const id of roleIds) {
              if (id !== removedRole.id && newMember.roles.cache.has(id)) {
                rolesToRemove.add(id)
              }
            }
          }
        }
      }
    }

    try {
      if (rolesToRemove.size > 0) {
        await newMember.roles.remove(Array.from(rolesToRemove), 'Role Set constraints')
      }
      if (rolesToAdd.size > 0) {
        // Fetch the member again to ensure we have the most up to date roles after removal
        const updatedMember = await newMember.guild.members.fetch(newMember.id)
        await updatedMember.roles.add(Array.from(rolesToAdd), 'Role Set constraints')
      }
    } catch (err: any) {
      console.error(`Error applying Role Sets for user ${newMember.id}:`, err)
    }
  }
}

export default event
