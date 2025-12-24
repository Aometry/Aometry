import { BotClient, Command } from "@/types/discord";
import { TextChannel, EmbedBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "@/utils/responses";
import moment from "moment";

// Config
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

export function startNcapTimerService(client: BotClient) {
  // Run immediately then interval
  safeCheck(client);
  setInterval(() => safeCheck(client), CHECK_INTERVAL_MS);
}

async function safeCheck(client: BotClient) {
  try {
    await checkTimers(client);
  } catch (error) {
    console.error("NCAP Timer Service Crash:", error);
  }
}

function isBusinessHours(): boolean {
  // Logic: 9am - 9pm AEST (UTC+10)
  // 9am AEST = 23:00 UTC (Previous Day)
  // 9pm AEST = 11:00 UTC
  // Range: 23:00 <= UTC < 11:00 (crossing midnight)

  const now = moment.utc();
  const hour = now.hour();

  // Hours: 23, 0, 1, ..., 10 are valid.
  // invalid: 11, 12, ..., 22.

  return hour >= 23 || hour < 11;
}

async function checkTimers(client: BotClient) {
  try {
    const db = client.databaseManager.getSqlite();

    if (!isBusinessHours()) {
      // Logic: If not business hours, we DO NOT decrement.
      // But we still might want to check if any expired naturally (e.g. from before)?
      // User implies pause logic.
      // "Timer is paused" implies no action.
      // But let's check just in case something is <= 0 anyway.
      // Actually, if we don't decrement, nothing reaches 0.
      return;
    }

    // 1. Decrement all pending posts by 1 minute
    db.prepare(
      "UPDATE ncap_posts SET timer_minutes = timer_minutes - 1 WHERE status = 'pending'"
    ).run();

    // 2. Find expired pending posts (<= 0)
    const expiredPosts = db
      .prepare(
        `
      SELECT * FROM ncap_posts 
      WHERE status = 'pending' 
      AND timer_minutes <= 0
    `
      )
      .all(); // No args needed now

    for (const post of expiredPosts) {
      await processExpiration(client, db, post);
    }
  } catch (err) {
    console.error("NCAP Timer Service Error:", err);
  }
}

async function processExpiration(client: BotClient, db: any, post: any) {
  console.log(`Processing expired NCAP post: ${post.id}`);

  // Logic: Mark as 'authorized' (assuming no objection stopped it, and status is pending)
  // Spec: "If T=0: Authorized."

  // 1. Update DB
  db.prepare("UPDATE ncap_posts SET status = 'authorized' WHERE id = ?").run(
    post.id
  );

  // 2. Update Message
  try {
    const channel = (await client.channels.fetch(
      post.channel_id
    )) as TextChannel;
    if (!channel) return;

    const message = await channel.messages.fetch(post.message_id);
    if (!message) return;

    const embed = EmbedBuilder.from(message.embeds[0]);

    // Update Color (Green for Authorized) and Fields
    embed.setColor(0x22c55e); // Green

    // Find/Update Status
    const fields = embed.data.fields || [];
    const statusField = fields.find((f) => f.name.includes("Status"));
    if (statusField) statusField.value = "✅ Authorized";

    const timerField = fields.find((f) => f.name.includes("Timer"));
    if (timerField) timerField.value = "Expired (Authorized)";

    embed.setFields(fields);
    // Remove buttons? Usually yes once actionable state ends.
    // Spec doesn't strictly say, but usually yes to prevent late clicks.

    await message.edit({ embeds: [embed], components: [] });

    // 3. Notify / Post to final channel?
    // Spec: "Authorized -> (maybe move to logs?)"
    // For now, in-place update is sufficient as per spec flow.
  } catch (err) {
    console.error(`Failed to update message for ${post.id}:`, err);
  }
}
