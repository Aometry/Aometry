import { createCommand } from "@/builders/CommandBuilder";
import { successEmbed } from "@/utils/responses";

export default createCommand("invite", "Get the bot invite link", (builder) => {
  builder.execute(async ({ interaction, client }) => {
    if (!client.user) return;

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

    await interaction.reply({
      embeds: [
        successEmbed(
          "Invite Me!",
          `[Click here to invite me to your server](${inviteUrl})`
        ),
      ],
    });
  });
});
