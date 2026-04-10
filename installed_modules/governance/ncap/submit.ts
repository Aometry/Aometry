/**
 * NCAP Submission Command
 * Per Constitution Rule 49(2) - NCAP Submission Requirements
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { BotClient, Command } from "@/types/discord";
import { errorEmbed } from "@/utils/responses";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ncap")
    .setDescription("Submit a proposal for NCAP (Negative Consent Approval Protocol) authorization")
    .addStringOption(option =>
      option
        .setName("category")
        .setDescription("NCAP category (determines default timer and approver pool)")
        .setRequired(true)
        .addChoices(
          { name: "Communications (Urgent) - 4h", value: "comm_urgent" },
          { name: "Communications (Routine) - 12h", value: "comm_routine" },
          { name: "Operations (Routine) - 24h", value: "ops_routine" },
          { name: "Policy (Significant) - 48h", value: "policy_sig" },
          { name: "Financial (Routine) - 24h", value: "fin_routine" },
          { name: "Financial (Significant) - 48h", value: "fin_sig" },
          { name: "Governance (Major) - 72h", value: "gov_major" }
        )
    )
    .addStringOption(option =>
      option
        .setName("approver-pool")
        .setDescription("Who should approve this? (defaults to category default)")
        .setRequired(false)
        .addChoices(
          { name: "Communications Working Group", value: "wg_comms" },
          { name: "Policy Working Group", value: "wg_policy" },
          { name: "Campaigns Working Group", value: "wg_campaigns" },
          { name: "Committee", value: "committee" }
        )
    )
    .addIntegerOption(option =>
      option
        .setName("timer-hours")
        .setDescription("Initial timer in hours (overrides category default)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(168) // 7 days max
    )
    .addNumberOption(option =>
      option
        .setName("spending")
        .setDescription("Spending amount in AUD (for financial authorizations)")
        .setRequired(false)
        .setMinValue(0)
    ),

  execute: async ({ interaction: interactionRaw, client }) => {
    const interaction = interactionRaw as ChatInputCommandInteraction;

    // Get options
    const category = interaction.options.getString("category", true);
    const approverPool = interaction.options.getString("approver-pool");
    const timerHours = interaction.options.getInteger("timer-hours");
    const spendingAmount = interaction.options.getNumber("spending");

    // Build modal for detailed submission
    const modal = new ModalBuilder()
      .setCustomId(`ncap_submit_${category}_${Date.now()}`)
      .setTitle("NCAP Submission");

    // Title field (per Rule 49(2)(b)(i))
    const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Title")
        .setPlaceholder("Short description of what's being authorized")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(200)
    );

    // Description field (per Rule 49(2)(b)(i))
    const descriptionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Description")
        .setPlaceholder("Clear description of what's being authorized...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000)
    );

    // Rationale field (per Rule 49(2)(b)(vi))
    const rationaleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("rationale")
        .setLabel("Rationale & Root Axiom Alignment")
        .setPlaceholder("How does this advance the Root Axiom? Why is this needed?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(1000)
    );

    // Budget category (if financial)
    const budgetRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("budget_category")
        .setLabel("Budget Category (if financial)")
        .setPlaceholder("e.g., Communications, Operations, Campaigns")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(100)
    );

    // Links to supporting documents (per Rule 49(2)(b)(vii))
    const linksRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("links")
        .setLabel("Links (optional)")
        .setPlaceholder("URLs to relevant documents or context (one per line)")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500)
    );

    modal.addComponents(titleRow, descriptionRow, rationaleRow, budgetRow, linksRow);

    // Store options in modal customId for retrieval on submit
    await interaction.showModal(modal);
  },
};

export default command;
