import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { botConfig } from "../../config/botConfig.js";

export const data = new SlashCommandBuilder()
  .setName("sessionboost")
  .setDescription("Boost the current ERLC session by pinging everyone with a hype message")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Custom boost message to send alongside the ping")
      .setRequired(false)
  );

export async function execute(interaction) {
  const customMessage = interaction.options.getString("message");

  const embed = new EmbedBuilder()
    .setTitle("⚡ SESSION BOOST!")
    .setDescription(
      `🎮 **The ERLC session needs YOU!**\n\n` +
        `${customMessage ? `📢 **${customMessage}**\n\n` : ""}` +
        `Join now and help the session — the more the merrier!`
    )
    .addFields({
      name: "Boosted By",
      value: `${interaction.user}`,
      inline: true,
    })
    .setColor(parseInt(botConfig.embeds.colors.blurple.replace("#", ""), 16))
    .setFooter({ text: botConfig.embeds.footer.text })
    .setTimestamp();

  // Reply ephemerally first to acknowledge the command
  await interaction.reply({ content: "✅ Boost sent!", ephemeral: true });

  // Send the actual boost message with @everyone ping
  await interaction.channel.send({
    content: `@everyone`,
    embeds: [embed],
  });
}
