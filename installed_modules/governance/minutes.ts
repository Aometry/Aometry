import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
} from "discord.js";
import { BotClient, Command } from "@/types/discord";
import { errorEmbed, successEmbed } from "@/utils/responses";
import moment from "moment";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("generate-minutes")
    .setDescription("Generate committee minutes for a date range")
    .addStringOption((option) =>
      option
        .setName("since")
        .setDescription("Start date (YYYY-MM-DD). Defaults to 1 week ago.")
        .setRequired(false)
    ),

  execute: async ({
    interaction: interactionRaw,
    client,
  }: {
    interaction: any;
    client: BotClient;
  }) => {
    const interaction = interactionRaw as ChatInputCommandInteraction;
    const sinceRaw = interaction.options.getString("since");

    // Default 7 days ago
    const start = sinceRaw ? moment(sinceRaw) : moment().subtract(7, "days");
    if (!start.isValid()) {
      return interaction.reply({
        embeds: [errorEmbed("Invalid Date", "Use YYYY-MM-DD")],
        flags: MessageFlags.Ephemeral,
      });
    }

    const db = client.databaseManager.getSqlite();

    // Fetch Data
    const startDateStr = start.toISOString();

    const authorizedNcaps = db
      .prepare(
        `
        SELECT * FROM ncap_posts 
        WHERE status = 'authorized' 
        AND created_at >= ?
        ORDER BY created_at ASC
    `
      )
      .all(startDateStr);

    const motions = db
      .prepare(
        `
        SELECT * FROM motions 
        WHERE created_at >= ?
        ORDER BY created_at ASC
    `
      )
      .all(startDateStr);

    // Format Text Report
    let report = `# Committee Minutes (Since ${start.format(
      "YYYY-MM-DD"
    )})\n\n`;

    report += `## Authorized NCAP Items (${authorizedNcaps.length})\n`;
    if (authorizedNcaps.length > 0) {
      for (const item of authorizedNcaps) {
        report += `- **${item.id}** (${moment(item.created_at).format(
          "DD/MM"
        )}): ${item.content.replace(/\n/g, " ")}\n`;
      }
    } else {
      report += "_None_\n";
    }

    report += `\n## Motions (${motions.length})\n`;
    if (motions.length > 0) {
      for (const m of motions) {
        const votes = db
          .prepare(
            "SELECT vote, count(*) as count FROM motion_votes WHERE motion_id = ? GROUP BY vote"
          )
          .all(m.id);
        const resultStr = votes
          .map((v: any) => `${v.vote}: ${v.count}`)
          .join(", ");

        report += `### ${m.id}: ${m.type.toUpperCase()}\n`;
        report += `> ${m.text}\n`;
        report += `Status: ${m.status.toUpperCase()} | Result: ${
          resultStr || "Pending"
        }\n\n`;
      }
    } else {
      report += "_None_\n";
    }

    // Create File Attachment
    const buffer = Buffer.from(report, "utf-8");
    const attachment = new AttachmentBuilder(buffer, {
      name: `Minutes-${moment().format("YYYY-MM-DD")}.md`,
    });

    await interaction.reply({
      embeds: [
        successEmbed(
          "Minutes Generated",
          `Report covering period from ${start.format("DD MMM YYYY")}`
        ),
      ],
      files: [attachment],
    });
  },
};

export default command;
