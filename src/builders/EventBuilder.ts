import { ClientEvents } from 'discord.js'
import { BotClient, Event } from '@/types/discord'

export function createEvent<K extends keyof ClientEvents> (
  name: K,
  options: {
    once?: boolean;
    rest?: boolean;
    execute: (args: {
      client: BotClient;
      args: ClientEvents[K];
    }) => Promise<void> | void;
  }
): Event<K> {
  return {
    name,
    once: options.once,
    rest: options.rest,
    execute: (...args: [...ClientEvents[K], BotClient]) => {
      // The last argument is always the client, but TS tuple types are tricky here.
      // We know the structure from our Bot.ts implementation.
      const client = args[args.length - 1] as BotClient
      const eventArgs = args.slice(0, -1) as ClientEvents[K]
      return options.execute({ client, args: eventArgs })
    }
  }
}
