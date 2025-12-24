import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  MessageContextMenuCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  LabelBuilder,
  FileUploadBuilder,
} from "discord.js";
import { BotClient, Command } from "@/types/discord";

// Context Menu Command: "Submit to NCAP"
const command: Command = {
  data: new ContextMenuCommandBuilder()
    .setName("Submit to NCAP")
    .setType(ApplicationCommandType.Message),

  execute: async ({ interaction, client }) => {
    const msgInteraction = interaction as MessageContextMenuCommandInteraction;
    const targetMessage = msgInteraction.targetMessage;
    const content = targetMessage.content;

    const modal = new ModalBuilder()
      .setCustomId(`ncap_submit_modal_${targetMessage.id}`)
      .setTitle("Submit to NCAP");

    // 1. Channel Select
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

    // 2. Urgency Select
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

    // 3. Content Input
    const contentInput = new TextInputBuilder()
      .setCustomId("content")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(content.slice(0, 4000))
      .setRequired(true);

    // Note: Older/Standard TextInputs didn't need LabelBuilder wrapper, but mixed usage implies we should wrap for consistency or if required by this version?
    // The guide showed `hobbiesLabel.setTextInputComponent(hobbiesInput)`.
    const contentLabel = new LabelBuilder()
      .setLabel("Content")
      .setDescription("Edit the content if needed")
      .setTextInputComponent(contentInput);

    // 4. Media
    const fileUpload = new FileUploadBuilder()
      .setCustomId("media")
      .setRequired(false); // Optional

    const fileLabel = new LabelBuilder()
      .setLabel("Attachment (Optional)")
      .setDescription("Upload an image or file")
      .setFileUploadComponent(fileUpload);

    // Verify method existence via unknown cast if typescript complains about addLabelComponents
    // The user guide says: modal.addLabelComponents(hobbiesLabel);
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
