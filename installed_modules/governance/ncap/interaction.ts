/**
 * NCAP Interaction Handlers
 * Handles vote submissions, gantry transitions, and dynamic timer recalculation
 * Per Constitution Rules 49, 50, 51, 76
 */

import {
  ButtonInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  Interaction,
} from "discord.js";
import { BotClient } from "@/types/discord";
import { NcapDatabaseManager } from "./database";
import { NcapCalculator } from "./calculator";
import {
  GantryState,
  NcapSubmission,
  TimerCalculation,
  DEFAULT_NCAP_CATEGORIES,
} from "./types";
import { errorEmbed } from "@/utils/responses";

// Category to approver pool and timer defaults mapping
const CATEGORY_CONFIG: Record<
  string,
  { approverPool: string; defaultHours: number }
> = {
  comm_urgent: { approverPool: "wg_comms", defaultHours: 4 },
  comm_routine: { approverPool: "wg_comms", defaultHours: 12 },
  ops_routine: { approverPool: "committee", defaultHours: 24 },
  policy_sig: { approverPool: "wg_policy", defaultHours: 48 },
  fin_routine: { approverPool: "committee", defaultHours: 24 },
  fin_sig: { approverPool: "committee", defaultHours: 48 },
  gov_major: { approverPool: "committee", defaultHours: 72 },
};

const GANTRY_COLORS = {
  [GantryState.NaturalApproval]: 0x90ee90,
  [GantryState.VotedApproval]: 0xffa500,
  [GantryState.Objection]: 0xff4444,
};

/**
 * Main interaction router for NCAP
 */
export default async function handleNcapInteraction(
  interaction: Interaction,
  client: BotClient
) {
  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("ncap_submit_")) {
      return handleNcapModalSubmit(interaction, client);
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith("ncap_approve_")) {
      return handleNcapApprove(interaction, client);
    } else if (customId.startsWith("ncap_object_")) {
      return handleNcapObject(interaction, client);
    } else if (customId.startsWith("ncap_info_")) {
      return handleNcapInfo(interaction, client);
    }
  }
}

/**
 * Handle NCAP submission from modal
 */
async function handleNcapModalSubmit(
  interaction: ModalSubmitInteraction,
  client: BotClient
) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const db = new NcapDatabaseManager();
    const calculator = new NcapCalculator();

    // Parse custom ID for category and approver pool
    const customIdParts = interaction.customId.split("_");
    const categoryMatch = customIdParts[2]; // ncap_submit_CATEGORY_timestamp
    let category = categoryMatch || "ops_routine";

    // Get form data
    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const rationale = interaction.fields.getTextInputValue("rationale") || "";
    const budgetCategory =
      interaction.fields.getTextInputValue("budget_category") || "";
    const linksText = interaction.fields.getTextInputValue("links") || "";
    const links = linksText
      .split("\n")
      .filter((l) => l.trim())
      .slice(0, 5); // Max 5 links

    // Get options from category config
    const approverPool = CATEGORY_CONFIG[category]?.approverPool || "committee";
    const timerHours = CATEGORY_CONFIG[category]?.defaultHours || 24;
    const spendingAmount = 0; // Would come from slash command option

    // Create submission record
    const submission = db.createSubmission({
      proposerId: interaction.user.id,
      approverPool,
      title,
      description,
      rationale,
      links,
      category,
      budgetCategory,
      spendingAmount,
      timerHours,
    });

    // Generate initial timer calculation
    const timerCalc = calculator.calculateDynamicTimer(submission.ncapId, 0, 0);

    // Create Discord embed showing submission
    const embed = createNcapEmbed(submission, timerCalc);

    // Create interaction buttons
    const components = createNcapButtons(submission.ncapId);

    // Send to NCAP voting channel
    const channel = interaction.guild?.channels.cache.find(
      (c) => c.name === "ncap-votes"
    );

    if (!channel || !channel.isTextBased()) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "NCAP Channel Not Found",
            "Could not find #ncap-votes channel"
          ),
        ],
      });
    }

    // Post the NCAP submission
    const message = await channel.send({ embeds: [embed], components });

    // Store message ID in database
    db.db
      .prepare("UPDATE ncap_submissions SET discord_message_id = ? WHERE ncap_id = ?")
      .run(message.id, submission.ncapId);

    // Store in cache for tracking
    if (!client.ncapSubmissions) {
      client.ncapSubmissions = new Collection();
    }
    client.ncapSubmissions.set(submission.ncapId, {
      messageId: message.id,
      channelId: channel.id,
      expireTime: submission.expireTime,
      timerCalculation: timerCalc,
    });

    return interaction.editReply({
      embeds: [
        {
          title: "✅ NCAP Submission Created",
          description: `Your NCAP submission **${submission.ncapId}** has been posted for voting.\n\nTimer: ${timerHours} hours\nApprover Pool: ${approverPool}`,
          color: 0x00aa00,
        },
      ],
    });
  } catch (error) {
    console.error("NCAP Modal Submit Error:", error);
    return interaction.editReply({
      embeds: [errorEmbed("Submission Error", String(error))],
    });
  }
}

/**
 * Handle approve button click
 */
async function handleNcapApprove(
  interaction: ButtonInteraction,
  client: BotClient
) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const db = new NcapDatabaseManager();
    const calculator = new NcapCalculator();

    // Extract NCAP ID from custom ID (ncap_approve_NCAPID)
    const ncapId = interaction.customId.split("_")[2];
    if (!ncapId) {
      return interaction.editReply({
        embeds: [errorEmbed("Error", "Invalid NCAP ID")],
      });
    }

    // Get submission
    const submission = db.getSubmission(ncapId);
    if (!submission) {
      return interaction.editReply({
        embeds: [errorEmbed("Not Found", "NCAP submission not found")],
      });
    }

    // Get vote counts
    const approveCount = db.getApprovalCount(ncapId);
    const objectCount = db.getObjectionCount(ncapId);
    const voters = db.getVoters(ncapId);

    // Check if already voted
    if (voters.includes(interaction.user.id)) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "Already Voted",
            "You have already cast your vote on this NCAP. Votes cannot be changed."
          ),
        ],
      });
    }

    // Check if proposer
    if (interaction.user.id === submission.proposerId) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "Cannot Vote",
            "Proposers cannot vote on their own NCAP submissions (Rule 49(3)(b))."
          ),
        ],
      });
    }

    // Add vote with dynamic timer recalculation
    const newApproveCount = approveCount + 1;
    const timerCalc = calculator.calculateDynamicTimer(
      ncapId,
      newApproveCount,
      objectCount
    );

    db.addVote(ncapId, interaction.user.id, "approval", timerCalc);

    // Check for supermajority approval (75%)
    const totalVotes = newApproveCount + objectCount;
    const approvalRate = newApproveCount / totalVotes;
    const supermajority = approvalRate >= 0.75;

    // Check for instant resolution
    const canResolveInstantly = calculator.checkInstantResolution(
      ncapId,
      supermajority
    );

    if (supermajority && canResolveInstantly) {
      // Auto-approve due to supermajority
      db.db
        .prepare("UPDATE ncap_submissions SET status = ? WHERE ncap_id = ?")
        .run("approved", ncapId);

      const resolved = new EmbedBuilder()
        .setTitle("⚡ NCAP Instantly Approved")
        .setDescription(
          `**${ncapId}** has reached supermajority approval (≥75%) and is instantly approved per Rule 49(3)(c).`
        )
        .addFields({
          name: "Final Vote",
          value: `${newApproveCount} Approvals / ${objectCount} Objections`,
        })
        .setColor(0x00aa00);

      const message = await interaction.channel?.messages.fetch(
        submission.discord_message_id || ""
      );
      if (message) {
        await message.edit({ embeds: [resolved], components: [] });
      }

      return interaction.editReply({
        embeds: [
          {
            title: "✅ Vote Recorded",
            description: `Your approval vote has been recorded. This NCAP has been **instantly approved** due to supermajority (≥75%).`,
            color: 0x00aa00,
          },
        ],
      });
    }

    // Update the main NCAP message with new calculations
    const updatedSubmission = db.getSubmission(ncapId);
    const updatedEmbed = createNcapEmbed(updatedSubmission!, timerCalc);
    const updatedComponents = createNcapButtons(ncapId);

    const message = await interaction.channel?.messages.fetch(
      submission.discord_message_id || ""
    );
    if (message) {
      await message.edit({ embeds: [updatedEmbed], components: updatedComponents });
    }

    return interaction.editReply({
      embeds: [
        {
          title: "✅ Vote Recorded",
          description: `Your approval vote has been recorded. Timer and calculations updated.`,
          color: 0x00aa00,
        },
      ],
    });
  } catch (error) {
    console.error("NCAP Approve Error:", error);
    return interaction.editReply({
      embeds: [errorEmbed("Vote Error", String(error))],
    });
  }
}

/**
 * Handle object button click
 */
async function handleNcapObject(
  interaction: ButtonInteraction,
  client: BotClient
) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const db = new NcapDatabaseManager();
    const calculator = new NcapCalculator();

    // Extract NCAP ID
    const ncapId = interaction.customId.split("_")[2];
    if (!ncapId) {
      return interaction.editReply({
        embeds: [errorEmbed("Error", "Invalid NCAP ID")],
      });
    }

    // Get submission
    const submission = db.getSubmission(ncapId);
    if (!submission) {
      return interaction.editReply({
        embeds: [errorEmbed("Not Found", "NCAP submission not found")],
      });
    }

    // Get vote counts
    const approveCount = db.getApprovalCount(ncapId);
    const objectCount = db.getObjectionCount(ncapId);
    const voters = db.getVoters(ncapId);

    // Check if already voted
    if (voters.includes(interaction.user.id)) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "Already Voted",
            "You have already cast your vote on this NCAP. Votes cannot be changed."
          ),
        ],
      });
    }

    // Check if proposer
    if (interaction.user.id === submission.proposerId) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "Cannot Vote",
            "Proposers cannot vote on their own NCAP submissions (Rule 49(3)(b))."
          ),
        ],
      });
    }

    // Add objection vote with dynamic timer recalculation
    const newObjectCount = objectCount + 1;
    const timerCalc = calculator.calculateDynamicTimer(
      ncapId,
      approveCount,
      newObjectCount
    );

    db.addVote(ncapId, interaction.user.id, "objection", timerCalc);

    // Check if objection pool fills (reaches 20% - can be vetoed)
    const totalVotes = approveCount + newObjectCount;
    const objectionRate = newObjectCount / totalVotes;
    const canBeVetoed = objectionRate >= 0.2;

    // Update the main NCAP message with new calculations
    const updatedSubmission = db.getSubmission(ncapId);
    const updatedEmbed = createNcapEmbed(updatedSubmission!, timerCalc);
    const updatedComponents = createNcapButtons(ncapId);

    const message = await interaction.channel?.messages.fetch(
      submission.discord_message_id || ""
    );
    if (message) {
      await message.edit({ embeds: [updatedEmbed], components: updatedComponents });
    }

    return interaction.editReply({
      embeds: [
        {
          title: "⚠️ Objection Recorded",
          description: `Your objection vote has been recorded. Timer and calculations updated.${
            canBeVetoed
              ? "\n\n⚡ **Veto Pool Activated** - 20% of votes are objections. This NCAP can now be vetoed."
              : ""
          }`,
          color: 0xff9900,
        },
      ],
    });
  } catch (error) {
    console.error("NCAP Object Error:", error);
    return interaction.editReply({
      embeds: [errorEmbed("Vote Error", String(error))],
    });
  }
}

/**
 * Handle info button click - show detailed submission info
 */
async function handleNcapInfo(
  interaction: ButtonInteraction,
  client: BotClient
) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const db = new NcapDatabaseManager();
    const ncapId = interaction.customId.split("_")[2];

    const submission = db.getSubmission(ncapId);
    if (!submission) {
      return interaction.editReply({
        embeds: [errorEmbed("Not Found", "NCAP submission not found")],
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Full Details: ${submission.ncapId}`)
      .addFields(
        {
          name: "Title",
          value: submission.title,
          inline: false,
        },
        {
          name: "Description",
          value: submission.description,
          inline: false,
        },
        {
          name: "Proposer",
          value: `<@${submission.proposerId}>`,
          inline: true,
        },
        {
          name: "Category",
          value: submission.category,
          inline: true,
        },
        {
          name: "Approver Pool",
          value: submission.approverPool,
          inline: true,
        }
      )
      .setColor(0x0099ff);

    if (submission.rationale) {
      embed.addFields({
        name: "Rationale",
        value: submission.rationale,
        inline: false,
      });
    }

    if (submission.spendingAmount > 0) {
      embed.addFields({
        name: "Spending Authorization",
        value: `$${submission.spendingAmount.toFixed(2)} AUD`,
        inline: true,
      });
    }

    if (submission.links && submission.links.length > 0) {
      embed.addFields({
        name: "References",
        value: submission.links.map((l) => `[Link](${l})`).join("\n"),
        inline: false,
      });
    }

    return interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("NCAP Info Error:", error);
    return interaction.editReply({
      embeds: [errorEmbed("Error", String(error))],
    });
  }
}

/**
 * Create NCAP voting embed with timer calculations
 */
function createNcapEmbed(
  submission: NcapSubmission,
  timerCalc: TimerCalculation
): EmbedBuilder {
  const db = new NcapDatabaseManager();
  const approveCount = db.getApprovalCount(submission.ncapId);
  const objectCount = db.getObjectionCount(submission.ncapId);
  const totalVotes = approveCount + objectCount;

  const approvalRate =
    totalVotes > 0 ? ((approveCount / totalVotes) * 100).toFixed(1) : "0.0";
  const objectionRate =
    totalVotes > 0 ? ((objectCount / totalVotes) * 100).toFixed(1) : "0.0";

  const timeRemaining = Math.ceil(
    (submission.expireTime.getTime() - Date.now()) / (1000 * 60)
  );
  const gantryColor =
    GANTRY_COLORS[timerCalc.gantryState] || GANTRY_COLORS[GantryState.VotedApproval];

  let gantryStatus = "🟠 Voted Approval";
  if (timerCalc.gantryState === GantryState.NaturalApproval) {
    gantryStatus = "🟢 Natural Approval";
  } else if (timerCalc.gantryState === GantryState.Objection) {
    gantryStatus = "🔴 Objection Gantry";
  }

  const embed = new EmbedBuilder()
    .setTitle(`NCAP: ${submission.title}`)
    .setDescription(submission.description)
    .setColor(gantryColor)
    .addFields(
      {
        name: "NCAP ID",
        value: submission.ncapId,
        inline: true,
      },
      {
        name: "Status",
        value: gantryStatus,
        inline: true,
      },
      {
        name: "Time Remaining",
        value: `${timeRemaining} minutes`,
        inline: true,
      },
      {
        name: "Votes",
        value: `✅ ${approveCount} (${approvalRate}%) | ❌ ${objectCount} (${objectionRate}%)`,
        inline: false,
      },
      {
        name: "Timer Calculation",
        value: `Base: ${timerCalc.initialTimerMinutes}m → Modified: ${timerCalc.currentTimerMinutes}m\nMultiplier: ${timerCalc.timerModifier.toFixed(2)}x`,
        inline: false,
      },
      {
        name: "Constitutional Info",
        value: `Approver Pool: ${submission.approverPool}\nCategory: ${submission.category}`,
        inline: false,
      }
    );

  if (submission.rationale) {
    embed.addFields({
      name: "Rationale",
      value: submission.rationale.substring(0, 500),
      inline: false,
    });
  }

  if (submission.spendingAmount > 0) {
    embed.addFields({
      name: "Spending Authorization",
      value: `$${submission.spendingAmount.toFixed(2)} AUD`,
      inline: true,
    });
  }

  return embed;
}

/**
 * Create voting buttons for NCAP
 */
function createNcapButtons(ncapId: string): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ncap_approve_${ncapId}`)
        .setLabel("✅ Approve")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ncap_object_${ncapId}`)
        .setLabel("❌ Object")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ncap_info_${ncapId}`)
        .setLabel("📋 Details")
        .setStyle(ButtonStyle.Primary)
    ),
  ];
}

export {
  handleNcapModalSubmit,
  handleNcapApprove,
  handleNcapObject,
  handleNcapInfo,
};
