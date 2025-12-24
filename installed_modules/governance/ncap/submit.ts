import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  FileUploadBuilder,
} from "discord.js";
import { BotClient, Command } from "@/types/discord";
import {
  getChannelCategory,
  ChannelCategory,
} from "@installed/governance/ChannelUtils";
import { errorEmbed, successEmbed } from "@/utils/responses";
import moment from "moment";

// Define the command
const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ncap-submit")
    .setDescription("Submit content for NCAP authorization"),

  execute: async ({ interaction: interactionRaw, client }) => {
    const interaction = interactionRaw as ChatInputCommandInteraction;

    // Build Modal
    const modal = new ModalBuilder()
      .setCustomId("ncap_submit_modal_slash")
      .setTitle("Submit to NCAP");

    // 1. Channel
    const channelSelect = new StringSelectMenuBuilder()
      .setCustomId("channel")
      .setPlaceholder("Select Authorization Channel")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Social Media")
          .setValue("socmed")
          .setDescription("#auth-socmed"),
        new StringSelectMenuOptionBuilder()
          .setLabel("General")
          .setValue("general")
          .setDescription("#auth-general")
      )
      .setRequired(true);

    const channelLabel = new LabelBuilder()
      .setLabel("Authorization Channel")
      .setDescription("Where should this post be sent?")
      .setStringSelectMenuComponent(channelSelect);

    // 2. Urgency
    const urgencySelect = new StringSelectMenuBuilder()
      .setCustomId("urgency")
      .setPlaceholder("Select Urgency Level")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Standard (4h)")
          .setValue("standard")
          .setDescription("Normal priority"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Urgent (2h)")
          .setValue("urgent")
          .setDescription("High priority"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Complex (6h)")
          .setValue("complex")
          .setDescription("Requires in-depth review")
      )
      .setRequired(true);

    const urgencyLabel = new LabelBuilder()
      .setLabel("Urgency Level")
      .setDescription("Determines the timer duration")
      .setStringSelectMenuComponent(urgencySelect);

    // 3. Content
    const contentInput = new TextInputBuilder()
      .setCustomId("content")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Enter the content here...")
      .setRequired(true);

    const contentLabel = new LabelBuilder()
      .setLabel("Content")
      .setDescription("The main text content")
      .setTextInputComponent(contentInput);

    // 4. Media
    const fileUpload = new FileUploadBuilder()
      .setCustomId("media")
      .setRequired(false); // Optional

    const fileLabel = new LabelBuilder()
      .setLabel("Attachment (Optional)")
      .setDescription("Upload an image or file")
      .setFileUploadComponent(fileUpload);

    // Add components
    (modal as any).addLabelComponents(
      channelLabel,
      urgencyLabel,
      contentLabel,
      fileLabel
    );

    await interaction.showModal(modal);
  },
};

export default command;
