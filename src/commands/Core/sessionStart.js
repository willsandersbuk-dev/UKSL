import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { botConfig } from "../../config/botConfig.js";

export const data = new SlashCommandBuilder()
  .setName("sessionstart")
  .setDescription("Immediately start an ERLC session without a vote")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Optional message to include with the session start announcement")
      .setRequired(false)
  );

export async function execute(interaction) {
  const customMessage = interaction.options.getString("message");

  const embed = new EmbedBuilder()
    .setTitle("🚨 ERLC Session Starting!")
    .setDescription(
      `An ERLC session has been started by ${interaction.user}!\n\n` +
        `${customMessage ? `📢 **${customMessage}**\n\n` : ""}` +
        `Please join the server and get ready!`
    )
    .addFields(
      { name: "Started By", value: `${interaction.user}`, inline: true },
      {
        name: "Started At",
        value: `<t:${Math.floor(Date.now() / 1000)}:T>`,
        inline: true,
      }
    )
    .setColor(parseInt(botConfig.embeds.colors.success.replace("#", ""), 16))
    .setFooter({ text: botConfig.embeds.footer.text })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
