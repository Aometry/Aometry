import {
  Events,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { createEvent } from "@/builders/EventBuilder";
import Logger from "@/utilities/Logger";

export default createEvent(Events.InteractionCreate, {
  execute: async ({ args: [interaction], client }) => {
    const db = client.databaseManager.getSqlite();
    if (interaction.isButton() || interaction.isModalSubmit()) {
      console.log(
        `[Ticketing/InteractionCreate] Handling interaction ${interaction.id} | Type: ${interaction.type} | CustomID: ${interaction.customId}`
      );
    }

    // 1. Handle Modal Submission
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "setup_ticket_modal") {
        const title = interaction.fields.getTextInputValue("panel_title");
        const desc = interaction.fields.getTextInputValue("panel_desc");
        const btnLabel = interaction.fields.getTextInputValue("button_label");

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(desc)
          .setColor(0x0099ff)
          .setFooter({ text: "Aometry Ticketing System" });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_create")
            .setLabel(btnLabel)
            .setEmoji("🎫")
            .setStyle(ButtonStyle.Primary)
        );

        const channel = interaction.channel as TextChannel;
        await channel.send({ embeds: [embed], components: [row] });

        await interaction.reply({
          content: "Ticket panel created successfully!",
          flags: 64,
        });
      }
    }

    // 2. Handle Buttons
    if (!interaction.isButton()) return;

    const { customId, user, channel } = interaction as ButtonInteraction;

    if (customId === "ticket_create") {
      try {
        if (!channel || channel.type !== ChannelType.GuildText) {
          await interaction.reply({
            content: "Tickets can only be created in text channels.",
            flags: 64,
          });
          return;
        }

        await interaction.deferReply({ flags: 64 });

        // Generate UUID (6 chars)
        const crypto = require("crypto");
        const ticketId = crypto.randomBytes(3).toString("hex").toUpperCase();

        // Create private thread
        const thread = await (channel as TextChannel).threads.create({
          name: `#${ticketId}-${user.username}`,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
          type: ChannelType.PrivateThread,
          reason: `Ticket created by ${user.tag}`,
        });

        await thread.members.add(user.id);

        // Insert into DB
        const now = new Date().toISOString();
        db.prepare(
          "INSERT INTO tickets (id, user_id, thread_id, status, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(ticketId, user.id, thread.id, "open", now);

        // Post panel in thread
        const embed = new EmbedBuilder()
          .setTitle(`Ticket #${ticketId}`)
          .setDescription(
            `Welcome ${user}. Support will be with you shortly.\n\nClick "Close Ticket" when your issue is resolved.`
          )
          .setColor(0x00ff00)
          .setFooter({ text: `ID: ${ticketId}` });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Close Ticket")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒")
        );

        await thread.send({
          content: `${user}`,
          embeds: [embed],
          components: [row],
        });

        await interaction.editReply({
          content: `Ticket created: <#${thread.id}>`,
        });
        Logger.info(`Ticket created ${ticketId} for ${user.tag}`);
      } catch (error) {
        Logger.error(`Failed to create ticket: ${error}`);
        try {
          if (interaction.deferred) {
            await interaction.editReply("Failed to create ticket.");
          } else if (!interaction.replied) {
            await interaction.reply({
              content: "Failed to create ticket.",
              flags: 64,
            });
          }
        } catch (ignored) {
          // ignore
        }
      }
    } else if (customId === "ticket_close") {
      try {
        await interaction.reply({
          content: "Closing ticket...",
          flags: 64,
        });

        const thread = interaction.channel;
        if (thread && thread.isThread()) {
          // Update DB Status
          // We can verify this is a ticket thread by checking DB, but for now just trusting context + button ID inside a thread.
          // Ideally we parse ID from footer or channel name, but simple close is fine.

          if (!thread.locked) {
            await thread.setLocked(true);
            await thread.setArchived(true);
            Logger.info(`Ticket closed by ${user.tag}: ${thread.id}`);
          }
        } else {
          Logger.warning("Ticket close button clicked outside of thread");
        }
      } catch (error) {
        Logger.error(`Failed to close ticket: ${error}`);
      }
    }
  },
});
