import { Events } from "discord.js";
import { createEvent } from "@/builders/EventBuilder";

export default createEvent(Events.GuildMemberRemove, {
  execute: async ({ args: [member], client }) => {
    // Add goodbye logic here
  },
});
