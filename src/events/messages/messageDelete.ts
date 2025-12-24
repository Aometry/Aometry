import { Events } from "discord.js";
import { createEvent } from "@/builders/EventBuilder";

export default createEvent(Events.MessageDelete, {
  execute: async ({ args: [message], client }) => {
    if (!message.guild) return;
    // Add message delete logging logic here
  },
});
