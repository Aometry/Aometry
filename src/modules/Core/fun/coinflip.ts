import { createCommand } from "@/builders/CommandBuilder";
import { successEmbed } from "@/utils/responses";

export default createCommand("coinflip", "Flip a coin", (builder) => {
  builder.execute(async ({ interaction }) => {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";

    await interaction.reply({
      embeds: [
        successEmbed("🪙 Coin Flip", `The coin landed on **${result}**!`),
      ],
    });
  });
});
