import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  TextChannel,
} from "discord.js";
import { BotClient, Command } from "@/types/discord";
import {
  getChannelCategory,
  ChannelCategory,
} from "@installed/governance/ChannelUtils";
import { errorEmbed, successEmbed } from "@/utils/responses";
import moment from "moment";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("motion-propose")
    .setDescription("Propose a formal committee motion")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Motion type")
        .setRequired(true)
        .addChoices(
          { name: "Standard (60% Present)", value: "standard" },
          {
            name: "Out-of-Session (60% + Abs Majority)",
            value: "out-of-session",
          },
          { name: "Preferences (80% Supermajority)", value: "preference" }
        )
    )
    .addStringOption((option) =>
      option.setName("text").setDescription("The motion text").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("context")
        .setDescription("Optional URL to context (e.g. Google Chat)")
        .setRequired(false)
    ),

  execute: async ({ interaction: interactionRaw, client }) => {
    const interaction = interactionRaw as ChatInputCommandInteraction;
    const type = interaction.options.getString("type", true);
    const text = interaction.options.getString("text", true);
    const contextUrl = interaction.options.getString("context");

    // Find Motions Channel
    const motionsChannel = interaction.guild?.channels.cache.find(
      (c) => getChannelCategory(c.name) === ChannelCategory.MOTIONS
    ) as TextChannel;

    if (!motionsChannel) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            "Configuration Error",
            "Could not find `#motions` channel"
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const db = client.databaseManager.getSqlite();
    const currentYear = moment().year();
    const countQuery = db
      .prepare("SELECT COUNT(*) as count FROM motions")
      .get();
    const nextId = (countQuery.count as number) + 1;
    const motionId = `MOTION-${currentYear}-${String(nextId).padStart(3, "0")}`;

    const closesAt = moment().add(48, "hours"); // Default 48h

    // Create Embed
    const motionEmbed = new EmbedBuilder()
      .setTitle(`📜 ${motionId}: ${type.toUpperCase().replace("-", " ")}`)
      .setDescription(text)
      .setColor(0x8b5cf6) // Violet
      .addFields(
        { name: "📊 Type", value: type, inline: true },
        {
          name: "⏱️ Voting Closes",
          value: "48h remaining (Business Hours)",
          inline: true,
        }
      )
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setFooter({ text: "React/Click to vote" });

    if (contextUrl) {
      motionEmbed.addFields({
        name: "Context",
        value: `[Discussion](${contextUrl})`,
      });
    }

    // Create Poll
    const poll = {
      question: {
        text: `${motionId}: ${type.toUpperCase().replace("-", " ")}`,
      },
      answers: [
        { text: "Yes", emoji: "✅" },
        { text: "No", emoji: "❌" },
        { text: "Abstain", emoji: "🤷" },
      ],
      duration: 168, // Max duration (7 days) - controlled by bot timer
      allowMultiselect: false,
    };

    const message = await motionsChannel.send({
      embeds: [motionEmbed],
      poll: poll,
    });

    // Save to DB
    const stmt = db.prepare(`
        INSERT INTO motions (id, type, text, context_url, status, channel_id, message_id, author_id, created_at, closes_at, timer_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      motionId,
      type,
      text,
      contextUrl,
      "open",
      motionsChannel.id,
      message.id,
      interaction.user.id,
      moment().toISOString(),
      closesAt.toISOString(),
      2880
    );

    await interaction.reply({
      embeds: [
        successEmbed(
          "Motion Proposed",
          `**ID:** ${motionId}\n**Channel:** ${motionsChannel}`
        ),
      ],
    });
  },
};

export default command;
