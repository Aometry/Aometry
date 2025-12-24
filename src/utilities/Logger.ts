import chalk from 'chalk'
import gradient from 'gradient-string'
import boxen, { Options as BoxenOptions } from 'boxen'
import { LoggerOptions } from '@/types/index'

class Logger {
  static success (message: string, emoji: string = '✅') {
    console.log(`${emoji} ${chalk.green(message)}`)
  }

  static error (message: string, emoji: string = '❌') {
    console.log(`${emoji} ${chalk.red(message)}`)
  }

  static warning (message: string, emoji: string = '⚠️') {
    console.log(`${emoji} ${chalk.yellow(message)}`)
  }

  static info (message: string, emoji: string = 'ℹ️') {
    console.log(`${emoji} ${chalk.blue(message)}`)
  }

  static loading (message: string) {
    console.log(`⏳ ${chalk.cyan(message)}`)
  }

  static section (title: string) {
    console.log('\n' + chalk.bold.underline(title) + '\n')
  }

  static subsection (title: string) {
    console.log('\n' + chalk.bold(title))
  }

  static listItem (item: string) {
    console.log(`  • ${item}`)
  }

  static line () {
    console.log(chalk.gray('─'.repeat(50)))
  }

  static box (message: string, options: LoggerOptions = {}) {
    const boxenOptions: BoxenOptions = {
      padding: options.padding || 1,
      margin: options.margin || 1,
      borderStyle: (options.borderStyle as any) || 'round',
      borderColor: (options.borderColor as any) || 'cyan',
      align: (options.textAlignment as any) || 'center'
    }
    console.log(boxen(message, boxenOptions))
  }

  static gradient (message: string, colors: string[] = ['cyan', 'blue']) {
    console.log(gradient(colors)(message))
  }

  static rainbow (message: string) {
    console.log(gradient.rainbow(message))
  }

  static async showBanner (version: string) {
    const figlet = require('figlet')
    const banner = await new Promise<string>((resolve, reject) => {
      figlet('Aometry', (err: any, data: string) => {
        if (err) reject(err)
        else resolve(data)
      })
    })

    console.clear()
    console.log(gradient.pastel.multiline(banner))
    this.box(`v${version} • By Finneh`, {
      padding: 0,
      margin: 0,
      borderStyle: 'classic',
      borderColor: 'magenta'
    })
  }
}

export default Logger
