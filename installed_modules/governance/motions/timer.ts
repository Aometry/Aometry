import { BotClient } from "@/types/discord";
import { TextChannel, EmbedBuilder } from "discord.js";
import moment from "moment";
import {
  getChannelCategory,
  ChannelCategory,
} from "@installed/governance/ChannelUtils";

const CHECK_INTERVAL_MS = 60 * 1000; // Every minute

export function startMotionTimerService(client: BotClient) {
  safeCheck(client);
  setInterval(() => safeCheck(client), CHECK_INTERVAL_MS);
}

async function safeCheck(client: BotClient) {
  try {
    await checkMotionTimers(client);
  } catch (error) {
    console.error("Motion Timer Service Crash:", error);
  }
}

function isBusinessHours(): boolean {
  // Logic: 9am - 9pm AEST (UTC+10)
  // 23:00 UTC <= now < 11:00 UTC
  const now = moment.utc();
  const hour = now.hour();
  return hour >= 23 || hour < 11;
}

async function checkMotionTimers(client: BotClient) {
  try {
    const db = client.databaseManager.getSqlite();

    if (!isBusinessHours()) return;

    // 1. Decrement Ticker for OPEN motions
    db.prepare(
      "UPDATE motions SET timer_minutes = timer_minutes - 1 WHERE status = 'open'"
    ).run();

    // 2. Find Expired
    const expiredMotions = db
      .prepare(
        "SELECT * FROM motions WHERE status = 'open' AND timer_minutes <= 0"
      )
      .all();

    for (const motion of expiredMotions) {
      await processMotionResult(client, db, motion);
    }
  } catch (err) {
    console.error("Motion Timer Error:", err);
  }
}

async function processMotionResult(client: BotClient, db: any, motion: any) {
  console.log(`Closing Motion: ${motion.id}`);

  let yes = 0;
  let no = 0;
  let abs = 0;
  let passed = false;

  // 1. Fetch Message & End Poll
  try {
    const channel = (await client.channels.fetch(
      motion.channel_id
    )) as TextChannel;
    if (!channel) throw new Error("Channel not found");

    const message = await channel.messages.fetch(motion.message_id);
    if (!message) throw new Error("Message not found");

    if (message.poll) {
      await message.poll.end(); // Stop voting

      // 2. Count Votes from Poll results
      for (const answer of message.poll.answers.values()) {
        const text = answer.text; // "Yes", "No", "Abstain"
        const count = answer.voteCount;

        if (text === "Yes") yes = count;
        else if (text === "No") no = count;
        else if (text === "Abstain") abs = count;
      }
    } else {
      console.warn(`Motion ${motion.id} has no poll attached.`);
    }

    // 3. Determine Result
    passed = yes > no;
    const resultStatus = passed ? "passed" : "failed";

    // 4. Update DB
    db.prepare("UPDATE motions SET status = ? WHERE id = ?").run(
      resultStatus,
      motion.id
    );

    // 5. Update Original Embed Visuals
    const embed = EmbedBuilder.from(message.embeds[0]);
    embed.setColor(passed ? 0x22c55e : 0xef4444); // Green or Red
    embed.setTitle(`${embed.data.title} [${passed ? "PASSED" : "FAILED"}]`);

    // Polls show their own results, so we don't strictly *need* footer counts,
    // but it's nice for the decision log logic which needs them passed down.
    embed.setFooter({
      text: `Voting Closed. Result: ${passed ? "PASSED" : "FAILED"}`,
    });

    await message.edit({ embeds: [embed] }); // Poll remains attached and shows final state
  } catch (err) {
    console.error(`Failed to process motion result ${motion.id}`, err);
    // If we can't find the message, we can't count votes from the Poll.
    // Fail safe: mark as 'failed' or 'error'?
    // For now, leave as 'open' requires manual intervention, OR mark 'expired'.
    // Let's rely on the error log.
    return;
  }

  // 6. Post to Decision Log (Only if Passed)
  // Note: If message fetch failed, we return early, so this won't run with 0 votes.
  if (passed) {
    await postToDecisionLog(client, motion, { yes, no, abs });
  }
}

async function postToDecisionLog(
  client: BotClient,
  motion: any,
  counts: { yes: number; no: number; abs: number }
) {
  try {
    const logChannel = client.channels.cache.find(
      (c) =>
        c.isTextBased() &&
        getChannelCategory((c as TextChannel).name) ===
          ChannelCategory.DECISION_LOG // Assuming category logic works, or just find by name 'decision-log' if simpler?
    ) as TextChannel;

    // Fallback search if category fails (e.g. if channel helper expects exact name match and channel is named differently but user said '#decision-log')
    // Actually the helper matches 'decision-log' exact string.
    // Let's assume the channel is named 'decision-log'.

    if (!logChannel) {
      console.warn("No #decision-log channel found.");
      return;
    }

    const logEmbed = new EmbedBuilder()
      .setTitle("📜 Motion Passed")
      .setDescription(`**${motion.id}**\n${motion.text}`)
      .setColor(0x22c55e)
      .addFields(
        { name: "Proposed By", value: `<@${motion.author_id}>`, inline: true },
        {
          name: "Votes",
          value: `✅ ${counts.yes} | ❌ ${counts.no} | 😶 ${counts.abs}`,
          inline: true,
        }
      )
      .setTimestamp();

    if (motion.context_url) {
      logEmbed.addFields({
        name: "Context",
        value: `[Link](${motion.context_url})`,
      });
    }

    // Add link to original motion if possible? We have channel_id and message_id
    // https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID
    // We can construct it if we have guild id, but motion object doesn't have it.
    // We can get it from channel object if we fetched it earlier, or just skip.

    await logChannel.send({ embeds: [logEmbed] });
  } catch (err) {
    console.error("Failed to post to decision log", err);
  }
}
