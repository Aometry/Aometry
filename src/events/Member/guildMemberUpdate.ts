import { Events, GuildMember, PartialGuildMember, Role, Collection } from 'discord.js'
import { BotClient, Event } from '@/types/discord'

interface RoleSet {
  type: 'GROUP' | 'UNIQUE';
  role_ids: string;
}

function processRoles (
  triggerRoles: Collection<string, Role>,
  isAdded: boolean,
  roleSets: RoleSet[],
  newMember: GuildMember | PartialGuildMember,
  rolesToAdd: Set<string>,
  rolesToRemove: Set<string>
) {
  for (const role of triggerRoles.values()) {
    for (const set of roleSets) {
      const roleIds: string[] = JSON.parse(set.role_ids)
      if (!roleIds.includes(role.id)) continue

      for (const id of roleIds) {
        if (id === role.id) continue

        if (isAdded) {
          if (set.type === 'GROUP' && !newMember.roles.cache.has(id)) {
            rolesToAdd.add(id)
          } else if (set.type === 'UNIQUE' && newMember.roles.cache.has(id)) {
            rolesToRemove.add(id)
          }
        } else {
          if (set.type === 'GROUP' && newMember.roles.cache.has(id)) {
            rolesToRemove.add(id)
          }
        }
      }
    }
  }
}

const event: Event<Events.GuildMemberUpdate> = {
  name: Events.GuildMemberUpdate,
  execute: async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember | PartialGuildMember, client: BotClient) => {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id))
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id))

    if (addedRoles.size === 0 && removedRoles.size === 0) return

    const db = client.databaseManager.getSqlite()

    let roleSets: RoleSet[]
    try {
      roleSets = db.prepare('SELECT type, role_ids FROM role_sets WHERE guild_id = ?').all(newMember.guild.id) as RoleSet[]
    } catch (err: unknown) {
      // Table might not exist or other DB errors
      return
    }

    if (!roleSets || roleSets.length === 0) return

    const rolesToAdd = new Set<string>()
    const rolesToRemove = new Set<string>()

    // Process constraints
    processRoles(addedRoles, true, roleSets, newMember, rolesToAdd, rolesToRemove)
    processRoles(removedRoles, false, roleSets, newMember, rolesToAdd, rolesToRemove)

    try {
      if (rolesToRemove.size > 0) {
        await newMember.roles.remove(Array.from(rolesToRemove), 'Role Set constraints')
      }
      if (rolesToAdd.size > 0) {
        // Fetch the member again to ensure we have the most up to date roles after removal
        const updatedMember = await newMember.guild.members.fetch(newMember.id)
        await updatedMember.roles.add(Array.from(rolesToAdd), 'Role Set constraints')
      }
    } catch (err: unknown) {
      const error = err as Error
      console.error(`Error applying Role Sets for user ${newMember.id}:`, error.message)
    }
  }
}

export default event
