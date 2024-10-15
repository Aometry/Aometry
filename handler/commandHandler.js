async function loadCommands (client) {
  const { loadFiles } = require('../Utilities/fileLoader')
  const Ascii = require('ascii-table')
  const table = new Ascii('Commands Loaded').setHeading('Command', 'Status')

  await client.commands.clear()

  const commandsArray = []

  const files = await loadFiles('commands')

  files.forEach((file) => {
    const command = require(file)
    client.commands.set(command.data.name, command)

    commandsArray.push(command.data.toJSON())

    table.addRow(command.data.name, '✅')
  })
  client.application.commands.set(commandsArray)
  return console.log(table.toString(), `\nCommands loaded: ${files.length}`)
}

module.exports = { loadCommands }
