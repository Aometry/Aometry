import { createCommand } from "@/builders/CommandBuilder";
import { PermissionFlagsBits, EmbedBuilder, MessageFlags } from "discord.js";
import { errorEmbed } from "@/utils/responses";
import { BotClient } from "@/types/discord";

export default createCommand(
  "roleset",
  "Manage Grouped and Unique Role Sets",
  (builder) => {
    builder
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addSubcommand((sub) =>
        sub
          .setName("create")
          .setDescription("Create a new role set")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Name of the role set")
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName("type")
              .setDescription("Type of the role set")
              .setRequired(true)
              .addChoices(
                { name: "GROUP: Receiving one role adds the others", value: "GROUP" },
                { name: "UNIQUE: Receiving one role removes the others", value: "UNIQUE" }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("delete")
          .setDescription("Delete an existing role set")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Name of the role set")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("addrole")
          .setDescription("Add a role to a role set")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Name of the role set")
              .setRequired(true)
          )
          .addRoleOption((opt) =>
            opt
              .setName("role")
              .setDescription("The role to add")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("removerole")
          .setDescription("Remove a role from a role set")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Name of the role set")
              .setRequired(true)
          )
          .addRoleOption((opt) =>
            opt
              .setName("role")
              .setDescription("The role to remove")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub.setName("list").setDescription("List all role sets")
      )
      .execute(async ({ interaction }) => {
        const guildId = interaction.guildId!;
        const client = interaction.client as BotClient;
        const db = client.databaseManager.getSqlite();

        const subcommand = interaction.options.getSubcommand();

        try {
          switch (subcommand) {
            case "create": {
              const name = interaction.options.getString("name", true);
              const type = interaction.options.getString("type", true);

              const existing = db
                .prepare(`SELECT id FROM role_sets WHERE guild_id = ? AND name = ? COLLATE NOCASE`)
                .get(guildId, name);

              if (existing) {
                return interaction.reply({
                  embeds: [errorEmbed("Error", `A role set named \`${name}\` already exists.`)],
                  flags: MessageFlags.Ephemeral,
                });
              }

              db.prepare(
                `INSERT INTO role_sets (guild_id, name, type, role_ids) VALUES (?, ?, ?, ?)`
              ).run(guildId, name, type, "[]");

              const embed = new EmbedBuilder()
                .setTitle("Role Set Created")
                .setDescription(`Successfully created the **${type}** role set \`${name}\`.`)
                .setColor(0x00ff88);

              return interaction.reply({ embeds: [embed] });
            }

            case "delete": {
              const name = interaction.options.getString("name", true);

              const result = db
                .prepare(`DELETE FROM role_sets WHERE guild_id = ? AND name = ? COLLATE NOCASE`)
                .run(guildId, name);

              if (result.changes === 0) {
                return interaction.reply({
                  embeds: [errorEmbed("Error", `Could not find a role set named \`${name}\`.`)],
                  flags: MessageFlags.Ephemeral,
                });
              }

              const embed = new EmbedBuilder()
                .setTitle("Role Set Deleted")
                .setDescription(`Successfully deleted the role set \`${name}\`.`)
                .setColor(0x00ff88);

              return interaction.reply({ embeds: [embed] });
            }

            case "addrole": {
              const name = interaction.options.getString("name", true);
              const role = interaction.options.getRole("role", true);

              const row = db
                .prepare(`SELECT id, role_ids FROM role_sets WHERE guild_id = ? AND name = ? COLLATE NOCASE`)
                .get(guildId, name) as { id: number, role_ids: string } | undefined;

              if (!row) {
                return interaction.reply({
                  embeds: [errorEmbed("Error", `Could not find a role set named \`${name}\`.`)],
                  flags: MessageFlags.Ephemeral,
                });
              }

              let roleIds: string[] = JSON.parse(row.role_ids);
              if (roleIds.includes(role.id)) {
                return interaction.reply({
                  embeds: [errorEmbed("Error", `The role ${role} is already in the set \`${name}\`.`)],
                  flags: MessageFlags.Ephemeral,
                });
              }

              roleIds.push(role.id);

              db.prepare(`UPDATE role_sets SET role_ids = ? WHERE id = ?`).run(
                JSON.stringify(roleIds),
                row.id
              );

              const embed = new EmbedBuilder()
                .setTitle("Role Added")
                .setDescription(`Added ${role} to the role set \`${name}\`.`)
                .setColor(0x00ff88);

              return interaction.reply({ embeds: [embed] });
            }

            case "removerole": {
              const name = interaction.options.getString("name", true);
              const role = interaction.options.getRole("role", true);

              const row = db
                .prepare(`SELECT id, role_ids FROM role_sets WHERE guild_id = ? AND name = ? COLLATE NOCASE`)
                .get(guildId, name) as { id: number, role_ids: string } | undefined;

              if (!row) {
                return interaction.reply({
                  embeds: [errorEmbed("Error", `Could not find a role set named \`${name}\`.`)],
                  flags: MessageFlags.Ephemeral,
                });
              }

              let roleIds: string[] = JSON.parse(row.role_ids);
              if (!roleIds.includes(role.id)) {
                return interaction.reply({
                  embeds: [errorEmbed("Error", `The role ${role} is not in the set \`${name}\`.`)],
                  flags: MessageFlags.Ephemeral,
                });
              }

              roleIds = roleIds.filter((id: string) => id !== role.id);

              db.prepare(`UPDATE role_sets SET role_ids = ? WHERE id = ?`).run(
                JSON.stringify(roleIds),
                row.id
              );

              const embed = new EmbedBuilder()
                .setTitle("Role Removed")
                .setDescription(`Removed ${role} from the role set \`${name}\`.`)
                .setColor(0x00ff88);

              return interaction.reply({ embeds: [embed] });
            }

            case "list": {
              const rows = db
                .prepare(`SELECT name, type, role_ids FROM role_sets WHERE guild_id = ?`)
                .all(guildId) as { name: string, type: string, role_ids: string }[];

              if (!rows || rows.length === 0) {
                return interaction.reply({
                  embeds: [new EmbedBuilder().setTitle("Role Sets").setDescription("No role sets have been created for this server.").setColor(0x2f3136)],
                });
              }

              const embed = new EmbedBuilder()
                .setTitle("Role Sets")
                .setColor(0x5865f2);

              for (const row of rows) {
                const roleIds: string[] = JSON.parse(row.role_ids);
                const roleList = roleIds.length > 0 ? roleIds.map((id: string) => `<@&${id}>`).join(", ") : "None";
                embed.addFields({
                  name: `${row.name} (${row.type})`,
                  value: roleList,
                });
              }

              return interaction.reply({ embeds: [embed] });
            }

            default:
              return interaction.reply({ content: "Unknown subcommand", flags: MessageFlags.Ephemeral });
          }
        } catch (err: unknown) {
          const error = err as Error;
          console.error("Roleset command error:", error.message);
          await interaction.reply({
            embeds: [errorEmbed("Error", "An error occurred while managing role sets.")],
            flags: MessageFlags.Ephemeral,
          });
        }
      });
  }
);
