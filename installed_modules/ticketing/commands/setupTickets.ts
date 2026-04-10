import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "@/types/discord";
import { successEmbed } from "@/utils/responses";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("setup-tickets")
    .setDescription("Creates a standing ticket panel in the current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  execute: async ({ interaction }) => {
    console.log(`[SetupTickets] Executing command ${interaction.id}`);
    // Show Modal
    const modal = new ModalBuilder()
      .setCustomId("setup_ticket_modal")
      .setTitle("Ticket Panel Setup");

    const titleInput = new TextInputBuilder()
      .setCustomId("panel_title")
      .setLabel("Panel Title")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Support Tickets")
      .setRequired(true)
      .setValue("🎫 Implementation / Support Tickets");

    const descInput = new TextInputBuilder()
      .setCustomId("panel_desc")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Click the button below...")
      .setRequired(true)
      .setValue(
        "Click the button below to open a new implementation or support ticket.\nA private thread will be created for you."
      );

    const buttonLabelInput = new TextInputBuilder()
      .setCustomId("button_label")
      .setLabel("Button Label")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Create Ticket")
      .setRequired(true)
      .setValue("Create Ticket");

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      titleInput
    );
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      descInput
    );
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      buttonLabelInput
    );

    modal.addComponents(firstRow, secondRow, thirdRow);

    await interaction.showModal(modal);
  },
};

export default command;
