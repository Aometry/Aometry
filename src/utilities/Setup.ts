import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'
import Logger from './Logger'
import gradient from 'gradient-string'

export default async function setup () {
  console.clear()
  Logger.gradient('🚀 Aometry Setup Wizard', ['cyan', 'magenta'])
  Logger.line()
  Logger.info('Welcome to Aometry! Let\'s get you set up.')
  Logger.line()

  const questions = [
    {
      type: 'input',
      name: 'BOT_TOKEN',
      message: 'Enter your Discord Bot Token:',
      validate: (input: string) => input.length > 50 ? true : 'Please enter a valid bot token'
    },
    {
      type: 'input',
      name: 'DB_URL',
      message: 'Enter your MongoDB Connection URL (optional):',
      default: 'mongodb://localhost:27017/aometry'
    },
    {
      type: 'input',
      name: 'SYSTEM_LOGS_CHANNEL',
      message: 'Enter the Channel ID for System Logs:',
      validate: (input: string) => /^\d{17,19}$/.test(input) ? true : 'Please enter a valid Channel ID'
    },
    {
      type: 'input',
      name: 'LOGS_CHANNEL',
      message: 'Enter the Channel ID for General Logs:',
      validate: (input: string) => /^\d{17,19}$/.test(input) ? true : 'Please enter a valid Channel ID'
    },
    {
      type: 'input',
      name: 'DEV_ID',
      message: 'Enter your Discord User ID (Developer ID):',
      validate: (input: string) => /^\d{17,19}$/.test(input) ? true : 'Please enter a valid User ID'
    }
  ]

  const answers = await inquirer.prompt(questions)

  let envContent = ''
  for (const [key, value] of Object.entries(answers)) {
    envContent += `${key}=${value}\n`
  }

  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent)

  Logger.line()
  Logger.success('Configuration saved to .env!', '💾')
  Logger.info('Starting the bot...')
  Logger.line()
}
