/**
 * NCAP Timer Service
 * Background timer task that updates submission timers, detects gantry transitions,
 * and triggers notifications per Constitutional Rules 49, 50, 51, 76
 */

import { BotClient } from "@/types/discord";
import { TextChannel, EmbedBuilder } from "discord.js";
import { NcapDatabaseManager } from "./database";
import { NcapCalculator } from "./calculator";
import { GantryState } from "./types";

// Configuration
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute (60 seconds)
const NOTIFICATION_THRESHOLD_MINUTES = 60; // Notify 1 hour before expiration
const BUSINESS_HOURS_START = 9; // 9 AM AEST
const BUSINESS_HOURS_END = 21; // 9 PM AEST

/**
 * Start the background timer service for NCAP submissions
 */
export function startNcapTimerService(client: BotClient) {
  console.log("[NCAP Timer Service] Started background timer service");
  
  // Run immediately then set interval
  safeCheck(client);
  setInterval(() => safeCheck(client), CHECK_INTERVAL_MS);
}

/**
 * Safe wrapper for timer check
 */
async function safeCheck(client: BotClient) {
  try {
    await checkTimers(client);
  } catch (error) {
    console.error("[NCAP Timer Service] Fatal Error:", error);
  }
}

/**
 * Check if current time is within business hours
 * Business hours: 9 AM - 9 PM AEST (UTC+10)
 */
function isBusinessHours(): boolean {
  const now = new Date();
  const aestTime = new Date(now.toLocaleString("en-AU", { timeZone: "Australia/Sydney" }));
  const hour = aestTime.getHours();
  
  return hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END;
}

/**
 * Main timer check function
 * Processes all active NCAP submissions, updates timers, detects gantry transitions
 */
async function checkTimers(client: BotClient) {
  const db = new NcapDatabaseManager();
  const calculator = new NcapCalculator();

  try {
    // Get all pending submissions
    const submissions = db.db
      .prepare("SELECT * FROM ncap_submissions WHERE status = ?")
      .all("pending") as any[];

    for (const submission of submissions) {
      // Decrement timer by 1 minute if in business hours
      let newExpiryTime = submission.expireTime;
      
      if (isBusinessHours()) {
        const currentTime = Date.now();
        const timeRemaining = submission.expireTime.getTime() - currentTime;
        const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));

        if (minutesRemaining <= 0) {
          // Timer expired
          await processExpiration(client, db, submission);
          continue;
        }

        // Check for notification threshold
        if (minutesRemaining === NOTIFICATION_THRESHOLD_MINUTES) {
          await sendNotification(
            client,
            submission,
            `⏰ NCAP **${submission.ncapId}** expires in 1 hour. Cast your vote now!`
          );
        }
      }

      // Recalculate timer based on vote counts and gantry state
      const approveCount = db.getApprovalCount(submission.ncapId);
      const objectCount = db.getObjectionCount(submission.ncapId);
      
      const timerCalc = calculator.calculateDynamicTimer(
        submission.ncapId,
        approveCount,
        objectCount
      );

      // Check for gantry state changes
      const oldGantryState = submission.gantryState || GantryState.VotedApproval;
      if (timerCalc.gantryState !== oldGantryState) {
        await handleGantryTransition(
          client,
          db,
          submission,
          oldGantryState,
          timerCalc.gantryState
        );

        // Update submission with new gantry state
        db.db
          .prepare("UPDATE ncap_submissions SET gantryState = ? WHERE ncap_id = ?")
          .run(timerCalc.gantryState, submission.ncapId);
      }

      // Update Discord embed with new calculations
      const message = await getSubmissionMessage(client, submission);
      if (message) {
        const updatedSubmission = db.getSubmission(submission.ncapId);
        if (updatedSubmission) {
          const embed = createNcapTimerEmbed(updatedSubmission, timerCalc);
          try {
            await message.edit({ embeds: [embed] });
          } catch (e) {
            console.error(`Failed to update message for ${submission.ncapId}:`, e);
          }
        }
      }
    }
  } catch (error) {
    console.error("[NCAP Timer Service] Check Error:", error);
  }
}

/**
 * Handle NCAP submission expiration
 */
async function processExpiration(
  client: BotClient,
  db: NcapDatabaseManager,
  submission: any
) {
  console.log(`[NCAP Timer Service] Processing expiration: ${submission.ncapId}`);

  try {
    // Get final vote counts
    const approveCount = db.getApprovalCount(submission.ncapId);
    const objectCount = db.getObjectionCount(submission.ncapId);
    const totalVotes = approveCount + objectCount;

    // Determine outcome based on Rule 49(4)
    let finalStatus = "approved"; // Default: Approved (Natural Approval)
    let statusReason = "Natural Approval - No objections raised";

    if (totalVotes > 0) {
      const approvalRate = approveCount / totalVotes;
      
      // Check if objection reached veto threshold (20%)
      if (objectCount / totalVotes >= 0.2) {
        finalStatus = "rejected";
        statusReason = "Veto Pool Activated - 20%+ objections raised (Rule 49(4)(a))";
      }
      // Check for supermajority bypass (75%+)
      else if (approvalRate >= 0.75) {
        finalStatus = "approved";
        statusReason = "Supermajority Approval - 75%+ approved (Rule 49(3)(c))";
      }
    }

    // Update submission status
    db.db
      .prepare("UPDATE ncap_submissions SET status = ? WHERE ncap_id = ?")
      .run(finalStatus, submission.ncapId);

    // Log audit entry
    db.addAuditLog({
      ncapId: submission.ncapId,
      action: "expiration",
      performedBy: "system",
      details: {
        finalStatus,
        approveCount,
        objectCount,
        totalVotes,
        reason: statusReason,
      },
    });

    // Update Discord message
    const message = await getSubmissionMessage(client, submission);
    if (message) {
      const finalColor = finalStatus === "approved" ? 0x00aa00 : 0xff4444;
      const finalEmbed = new EmbedBuilder()
        .setTitle(
          `✅ NCAP ${finalStatus === "approved" ? "APPROVED" : "REJECTED"}`
        )
        .setDescription(
          `**${submission.ncapId}**: ${submission.title}\n\n${statusReason}`
        )
        .addFields({
          name: "Final Vote",
          value: `${approveCount} Approvals / ${objectCount} Objections`,
          inline: true,
        })
        .setColor(finalColor)
        .setTimestamp();

      try {
        await message.edit({ embeds: [finalEmbed], components: [] });
      } catch (e) {
        console.error(`Failed to update final message for ${submission.ncapId}:`, e);
      }
    }

    // Send notification
    const notificationText =
      finalStatus === "approved"
        ? `✅ NCAP **${submission.ncapId}** has been **APPROVED** - ${statusReason}`
        : `❌ NCAP **${submission.ncapId}** has been **REJECTED** - ${statusReason}`;

    await sendNotification(client, submission, notificationText);
  } catch (error) {
    console.error(`[NCAP Timer Service] Expiration Error for ${submission.ncapId}:`, error);
  }
}

/**
 * Handle gantry state transitions
 */
async function handleGantryTransition(
  client: BotClient,
  db: NcapDatabaseManager,
  submission: any,
  oldState: GantryState,
  newState: GantryState
) {
  console.log(
    `[NCAP Timer Service] Gantry Transition: ${submission.ncapId} ${oldState} → ${newState}`
  );

  try {
    // Log transition
    db.addAuditLog({
      ncapId: submission.ncapId,
      action: "gantry_transition",
      performedBy: "system",
      details: {
        from: oldState,
        to: newState,
        reason: "Automatic gantry transition based on vote participation",
      },
    });

    // Send notification based on transition type
    let notificationText = "";

    if (newState === GantryState.NaturalApproval) {
      notificationText = `🟢 NCAP **${submission.ncapId}** entered **Natural Approval** - approval likely (Rule 49(3)(a))`;
    } else if (newState === GantryState.Objection) {
      notificationText = `🔴 NCAP **${submission.ncapId}** entered **Objection Gantry** - timer extended to 2x (Rule 49(3)(b))`;
    }

    if (notificationText) {
      await sendNotification(client, submission, notificationText);
    }
  } catch (error) {
    console.error(
      `[NCAP Timer Service] Gantry Transition Error for ${submission.ncapId}:`,
      error
    );
  }
}

/**
 * Get the Discord message for an NCAP submission
 */
async function getSubmissionMessage(client: BotClient, submission: any) {
  try {
    if (!submission.discord_message_id) {
      return null;
    }

    const channel = await client.channels.fetch(submission.discord_channel_id);
    if (!channel || !channel.isTextBased()) {
      return null;
    }

    const message = await channel.messages.fetch(submission.discord_message_id);
    return message || null;
  } catch (error) {
    console.error(`Failed to fetch message for ${submission.ncapId}:`, error);
    return null;
  }
}

/**
 * Send notification to NCAP alerts channel
 */
async function sendNotification(
  client: BotClient,
  submission: any,
  message: string
) {
  try {
    const channel = client.channels.cache.find((c) => c.name === "ncap-alerts");
    if (channel && channel.isTextBased()) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(message)
            .setColor(0x0099ff)
            .setTimestamp(),
        ],
      });
    }
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

/**
 * Create embed showing current timer state
 */
function createNcapTimerEmbed(submission: any, timerCalc: any): EmbedBuilder {
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

  const GANTRY_COLORS: Record<GantryState, number> = {
    [GantryState.NaturalApproval]: 0x90ee90,
    [GantryState.VotedApproval]: 0xffa500,
    [GantryState.Objection]: 0xff4444,
  };

  let gantryStatus = "🟠 Voted Approval";
  if (timerCalc.gantryState === GantryState.NaturalApproval) {
    gantryStatus = "🟢 Natural Approval";
  } else if (timerCalc.gantryState === GantryState.Objection) {
    gantryStatus = "🔴 Objection Gantry";
  }

  return new EmbedBuilder()
    .setTitle(`NCAP: ${submission.title}`)
    .setDescription(submission.description)
    .setColor(GANTRY_COLORS[timerCalc.gantryState] || 0xffa500)
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
        name: "⏱️ Time Remaining",
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
        value: `Base: ${timerCalc.initialTimerMinutes}m → Current: ${timerCalc.currentTimerMinutes}m\nModifier: ${timerCalc.timerModifier.toFixed(2)}x`,
        inline: false,
      }
    );
}

export { startNcapTimerService, isBusinessHours };
