import chalk from 'chalk'
import boxen, { Options as BoxenOptions } from 'boxen'
import { LoggerOptions } from '@/types/index'

class Logger {
  private static gradientString: any = null

  /**
   * Initialize ESM modules dynamically
   */
  static async init () {
    if (!this.gradientString) {
      try {
        this.gradientString = (await import('gradient-string')).default
      } catch (err) {
        // Fallback if import fails
        this.gradientString = null
      }
    }
  }

  /**
   * Get the gradient instance, ensuring it's loaded
   */
  private static get g () {
    return this.gradientString
  }

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
    if (this.g) {
      console.log(this.g(colors)(message))
    } else {
      console.log(chalk.cyan(message))
    }
  }

  static rainbow (message: string) {
    if (this.g) {
      console.log(this.g.rainbow(message))
    } else {
      console.log(chalk.magenta(message))
    }
  }

  /**
   * Exposed pastel for inline usage if needed (fallback handled)
   */
  static pastel (message: string) {
    return this.g ? this.g.pastel(message) : chalk.cyan(message)
  }

  static crystal (message: string) {
    return this.g ? this.g.cristal(message) : chalk.blue(message)
  }

  static async showBanner (version: string) {
    const figlet = require('figlet')
    await this.init()

    const banner = await new Promise<string>((resolve, reject) => {
      figlet('Aometry', (err: any, data: string) => {
        if (err) reject(err)
        else resolve(data)
      })
    })

    console.clear()
    if (this.g) {
      console.log(this.g.pastel.multiline(banner))
    } else {
      console.log(chalk.cyan(banner))
    }

    this.box(`v${version} • By Finneh`, {
      padding: 0,
      margin: 0,
      borderStyle: 'classic',
      borderColor: 'magenta'
    })
  }
}

export default Logger
