/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const { Perms } = require('../validation/Permissions')
const { Client, ClientUser } = require('discord.js')
const { promisify } = require('util')
const { glob } = require('glob')
const pG = promisify(glob)
const Ascii = require('ascii-table')

/**
 * @param {Client} client
 */

module.exports = async (client) => {
  const Table = new Ascii('Command Loaded')

  const commandsArray = [];

  (await pG(`${process.cwd()}/modules/*/*.js`)).map(async (file) => {
    const command = require(file)

    if (!command.name) {
      return Table.addRow(file.split('/')[9], '🔶 FAILED', 'Missing a name.')
    }

    if (!command.description) {
      return Table.addRow(command.name, '🔶 FAILED', 'Missing a description.')
    }

    if (command.permission) {
      if (Perms.includes(command.permission)) {
        command.defaultPermission = false
      } else {
        return Table.addRow(command.name, '🔶 FAILED', 'Invalid Permissions')
      }
    }
    client.commands.set(command.name, command)
    commandsArray.push(command)

    await Table.addRow(command.name, '✅ SUCCESSFUL')
  })
  console.log(Table.toString())

  // PERMISSIONS CHECK//

  client.on('ready', async () => {
    client.guilds.cache.forEach((guild) => {
      guild.commands.set(commandsArray).then(async (command) => {
        const rolesConstructor = (commandName) => {
          const cmdPerms = commandsArray.find((c) => c.name === commandName).permission
          if (!cmdPerms) return null

          return guild.roles.cache.filter((r) => r.permissions.has(cmdPerms))
        }

        const fullPermissions = command.reduce((accumulator, r) => {
          const roles = rolesConstructor(r.name)
          if (!roles) return accumulator

          const permissions = roles.reduce((a, r) => {
            return [...a, { id: r.id, type: 'ROLE', permission: true }]
          }, [])

          return [...accumulator, { id: r.id, permissions }]
        }, [])

        await guild.commands.permissions.set({ fullPermissions })
      })
    })
  })
}
