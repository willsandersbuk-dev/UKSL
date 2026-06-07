import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { botConfig } from "../../config/bot.js";

export const data = new SlashCommandBuilder()
  .setName("sessionend")
  .setDescription("End the current ERLC session and send a closing announcement")
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Optional reason for ending the session")
      .setRequired(false)
  );

export async function execute(interaction) {
  const reason = interaction.options.getString("reason");

  const embed = new EmbedBuilder()
    .setTitle("🔴 ERLC Session Ended")
    .setDescription(
      `The ERLC session has been ended by ${interaction.user}.\n\n` +
        `${reason ? `📋 **Reason:** ${reason}\n\n` : ""}` +
        `Thank you to everyone who participated! See you next time.`
    )
    .addFields(
      { name: "Ended By", value: `${interaction.user}`, inline: true },
      {
        name: "Ended At",
        value: `<t:${Math.floor(Date.now() / 1000)}:T>`,
        inline: true,
      }
    )
    .setColor(parseInt(botConfig.embeds.colors.error.replace("#", ""), 16))
    .setFooter({ text: botConfig.embeds.footer.text })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
