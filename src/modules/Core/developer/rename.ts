import { createCommand } from "@/builders/CommandBuilder";
import { MessageFlags } from "discord.js";
import { successEmbed, errorEmbed } from "@/utils/responses";

export default createCommand(
  "rename",
  "Change the bot's username",
  (builder) => {
    builder
      .addStringOption("username", "The new username for the bot", true)
      .setDefaultMemberPermissions(8) // Administrator
      .execute(async ({ interaction, client }) => {
        const newUsername = interaction.options.getString("username", true);

        try {
          await client.user?.setUsername(newUsername);
          await interaction.reply({
            embeds: [
              successEmbed(
                "Username Changed",
                `Successfully changed bot username to \`${newUsername}\``
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        } catch (error: any) {
          // Discord API errors usually come with a code/message.
          // Rate limit for username changes is strict (2 per hour).
          await interaction.reply({
            embeds: [
              errorEmbed(
                "Failed to Change Username",
                error.message || "An unknown error occurred."
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
      });
  }
);
