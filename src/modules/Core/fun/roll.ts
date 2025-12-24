import { createCommand } from "@/builders/CommandBuilder";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { errorEmbed } from "@/utils/responses";

export default createCommand(
  "roll",
  "Roll dice using D&D notation (e.g., 2d6, 1d20)",
  (builder) => {
    builder
      .addStringOption(
        "dice",
        "Dice notation (e.g., 2d6 = roll two 6-sided dice)",
        true
      )
      .execute(async ({ interaction }) => {
        const diceInput = interaction.options
          .getString("dice", true)
          .toLowerCase();

        // Parse dice notation (e.g., "2d6" or "1d20")
        const match = diceInput.match(/^(\d+)d(\d+)$/);

        if (!match) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                "Invalid Dice Notation",
                "Please use the format `NdN` (e.g., `2d6`, `1d20`, `3d8`).\n\n**Examples:**\n`1d20` - Roll one 20-sided die\n`2d6` - Roll two 6-sided dice\n`4d8` - Roll four 8-sided dice"
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }

        const numDice = parseInt(match[1]);
        const numSides = parseInt(match[2]);

        // Validate input
        if (numDice < 1 || numDice > 100) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                "Invalid Number of Dice",
                "Please roll between 1 and 100 dice."
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }

        if (numSides < 2 || numSides > 1000) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                "Invalid Dice Sides",
                "Dice must have between 2 and 1000 sides."
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }

        // Roll the dice
        const rolls: number[] = [];
        let total = 0;
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * numSides) + 1;
          rolls.push(roll);
          total += roll;
        }

        // Determine color based on average roll
        const average = total / numDice;
        const middleValue = (numSides + 1) / 2;
        let color = 0x7289da;
        if (average >= middleValue * 1.3) color = 0x00ff88; // High roll (green)
        else if (average <= middleValue * 0.7) color = 0xff3366; // Low roll (red)

        const embed = new EmbedBuilder()
          .setTitle(`🎲 Rolling ${diceInput.toUpperCase()}`)
          .setColor(color)
          .setTimestamp();

        if (numDice <= 20) {
          // Show individual rolls for reasonable numbers
          embed.addFields(
            {
              name: "Rolls",
              value: rolls.map((r, i) => `Die ${i + 1}: **${r}**`).join("\n"),
              inline: true,
            },
            { name: "Total", value: `**${total}**`, inline: true }
          );
        } else {
          // For many dice, just show the total
          embed.setDescription(
            `**Total:** ${total}\n**Average:** ${average.toFixed(2)}`
          );
        }

        await interaction.reply({ embeds: [embed] });
      });
  }
);
