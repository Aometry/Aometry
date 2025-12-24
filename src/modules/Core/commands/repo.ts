import { createCommand } from "@/builders/CommandBuilder";
import { MessageFlags, PermissionFlagsBits } from "discord.js";

export default createCommand(
  "repo",
  "Manage external repositories and modules",
  (builder) => {
    builder
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((sub) =>
        sub
          .setName("install")
          .setDescription("Install a module from a repository")
          .addStringOption((opt) =>
            opt
              .setName("url")
              .setDescription("The git repository URL")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("uninstall")
          .setDescription("Uninstall a module")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("The name of the module to uninstall")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub.setName("list").setDescription("List installed modules")
      )
      .execute(async ({ interaction, client }) => {
        const subcommand = interaction.options.getSubcommand();
        const repoManager = client.repositoryManager;

        if (subcommand === "install") {
          const url = interaction.options.getString("url", true);
          await interaction.reply({
            content: `⏳ Cloning and installing from ${url}...`,
            flags: MessageFlags.Ephemeral,
          });

          const success = await repoManager.install(url);

          if (success) {
            await interaction.editReply({
              content: `✅ Successfully installed module from ${url}. Please restart the bot to load changes.`,
            });
          } else {
            await interaction.editReply({
              content: `❌ Failed to install module from ${url}. Check console for details.`,
            });
          }
        } else if (subcommand === "uninstall") {
          const name = interaction.options.getString("name", true);
          await interaction.reply({
            content: `⏳ Uninstalling ${name}...`,
            flags: MessageFlags.Ephemeral,
          });

          const success = await repoManager.uninstall(name);

          if (success) {
            await interaction.editReply({
              content: `✅ Successfully uninstalled ${name}. Please restart the bot to apply changes.`,
            });
          } else {
            await interaction.editReply({
              content: `❌ Failed to uninstall ${name}. Check console for details.`,
            });
          }
        } else if (subcommand === "list") {
          const modules = repoManager.getInstalledModules();
          if (modules.length === 0) {
            return interaction.reply({
              content: "No modules installed.",
              flags: MessageFlags.Ephemeral,
            });
          }

          const list = modules
            .map((m) => `- **${m.name}** (${m.version}) from ${m.repository}`)
            .join("\n");
          await interaction.reply({
            content: `**Installed Modules:**\n${list}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      });
  }
);
