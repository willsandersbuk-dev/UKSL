import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { botConfig } from "../../config/bot.js";

export const data = new SlashCommandBuilder()
  .setName("dmall")
  .setDescription("Send a DM to all server members")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("The message to send to all members")
      .setRequired(true)
      .setMaxLength(1800)
  )
  .addStringOption((option) =>
    option
      .setName("title")
      .setDescription("Optional title for the DM embed")
      .setRequired(false)
      .setMaxLength(256)
  );

export async function execute(interaction) {
  // Defer early — this will take a while
  await interaction.deferReply({ ephemeral: true });

  const message = interaction.options.getString("message");
  const title = interaction.options.getString("title") || "📢 Message from the Server";

  // Fetch all members
  await interaction.guild.members.fetch();
  const members = interaction.guild.members.cache.filter((m) => !m.user.bot);

  const dmEmbed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(message)
    .addFields({
      name: "Server",
      value: interaction.guild.name,
      inline: true,
    })
    .setColor(parseInt(botConfig.embeds.colors.primary.replace("#", ""), 16))
    .setFooter({ text: botConfig.embeds.footer.text })
    .setTimestamp();

  let successCount = 0;
  let failCount = 0;

  // Progress embed shown to the command user
  const progressEmbed = new EmbedBuilder()
    .setTitle("📨 Sending DMs...")
    .setDescription(`Sending to **${members.size}** members. Please wait...`)
    .setColor(parseInt(botConfig.embeds.colors.warning.replace("#", ""), 16))
    .setFooter({ text: botConfig.embeds.footer.text });

  await interaction.editReply({ embeds: [progressEmbed] });

  for (const [, member] of members) {
    try {
      await member.send({ embeds: [dmEmbed] });
      successCount++;
    } catch {
      // Member has DMs closed or blocked the bot
      failCount++;
    }

    // Small delay to avoid hitting rate limits
    await new Promise((res) => setTimeout(res, 500));
  }

  const resultEmbed = new EmbedBuilder()
    .setTitle("✅ DM All Complete")
    .setDescription(`Finished sending DMs to all server members.`)
    .addFields(
      { name: "✅ Delivered", value: `${successCount}`, inline: true },
      { name: "❌ Failed", value: `${failCount}`, inline: true },
      { name: "📋 Total", value: `${members.size}`, inline: true }
    )
    .setColor(parseInt(botConfig.embeds.colors.success.replace("#", ""), 16))
    .setFooter({ text: botConfig.embeds.footer.text })
    .setTimestamp();

  await interaction.editReply({ embeds: [resultEmbed] });
}
