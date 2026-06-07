import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { botConfig } from "../../config/botConfig.js";

// Tracks active votes per guild to prevent duplicates
const activeVotes = new Map();

export const data = new SlashCommandBuilder()
  .setName("sessionvote")
  .setDescription("Start a vote to begin an ERLC session")
  .addIntegerOption((option) =>
    option
      .setName("minimum_votes")
      .setDescription("Minimum votes required to start the session")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addIntegerOption((option) =>
    option
      .setName("time")
      .setDescription("How long the vote lasts (in minutes)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(60)
  );

export async function execute(interaction) {
  const guildId = interaction.guildId;

  // Prevent duplicate active votes
  if (activeVotes.has(guildId)) {
    return interaction.reply({
      content: "❌ There is already an active session vote in this server.",
      ephemeral: true,
    });
  }

  const minimumVotes = interaction.options.getInteger("minimum_votes");
  const timeMinutes = interaction.options.getInteger("time");
  const timeMs = timeMinutes * 60 * 1000;

  const voters = new Set();

  const embed = new EmbedBuilder()
    .setTitle("🗳️ Session Vote")
    .setDescription(
      `A vote to start an ERLC session has been initiated!\n\n` +
        `Click **Vote Yes** to cast your vote.\n\n` +
        `**Votes:** 0 / ${minimumVotes}\n` +
        `**Time Remaining:** ${timeMinutes} minute(s)`
    )
    .setColor(parseInt(botConfig.embeds.colors.info.replace("#", ""), 16))
    .setFooter({ text: botConfig.embeds.footer.text })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vote_yes")
      .setLabel("✅ Vote Yes")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("vote_cancel")
      .setLabel("❌ Cancel Vote")
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
  const message = await interaction.fetchReply();

  activeVotes.set(guildId, true);

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeMs,
  });

  collector.on("collect", async (btn) => {
    // Cancel vote — only the original initiator can cancel
    if (btn.customId === "vote_cancel") {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({
          content: "❌ Only the person who started the vote can cancel it.",
          ephemeral: true,
        });
      }
      collector.stop("cancelled");
      return;
    }

    // Vote yes
    if (btn.customId === "vote_yes") {
      if (voters.has(btn.user.id)) {
        return btn.reply({
          content: "❌ You have already voted.",
          ephemeral: true,
        });
      }
      voters.add(btn.user.id);
      await btn.reply({ content: "✅ Your vote has been counted!", ephemeral: true });

      const updatedEmbed = EmbedBuilder.from(embed).setDescription(
        `A vote to start an ERLC session has been initiated!\n\n` +
          `Click **Vote Yes** to cast your vote.\n\n` +
          `**Votes:** ${voters.size} / ${minimumVotes}\n` +
          `**Time Remaining:** ${timeMinutes} minute(s)`
      );

      await message.edit({ embeds: [updatedEmbed], components: [row] });

      // Check if minimum votes reached
      if (voters.size >= minimumVotes) {
        collector.stop("passed");
      }
    }
  });

  collector.on("end", async (_, reason) => {
    activeVotes.delete(guildId);

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("vote_yes")
        .setLabel("✅ Vote Yes")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("vote_cancel")
        .setLabel("❌ Cancel Vote")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

    if (reason === "passed") {
      const passedEmbed = new EmbedBuilder()
        .setTitle("✅ Vote Passed — Session Starting!")
        .setDescription(
          `The vote passed with **${voters.size}** vote(s)!\n\n🚨 **The ERLC session is now starting!**`
        )
        .setColor(parseInt(botConfig.embeds.colors.success.replace("#", ""), 16))
        .setFooter({ text: botConfig.embeds.footer.text })
        .setTimestamp();

      await message.edit({ embeds: [passedEmbed], components: [disabledRow] });
      await message.channel.send(
        `🚨 **Session is now starting!** Good luck everyone!`
      );
    } else if (reason === "cancelled") {
      const cancelledEmbed = new EmbedBuilder()
        .setTitle("🚫 Vote Cancelled")
        .setDescription("The session vote was cancelled by the initiator.")
        .setColor(parseInt(botConfig.embeds.colors.error.replace("#", ""), 16))
        .setFooter({ text: botConfig.embeds.footer.text })
        .setTimestamp();

      await message.edit({ embeds: [cancelledEmbed], components: [disabledRow] });
    } else {
      // Timed out
      const timedOutEmbed = new EmbedBuilder()
        .setTitle("⏰ Vote Failed — Not Enough Votes")
        .setDescription(
          `The vote ended with **${voters.size} / ${minimumVotes}** votes.\n\nBetter luck next time!`
        )
        .setColor(parseInt(botConfig.embeds.colors.error.replace("#", ""), 16))
        .setFooter({ text: botConfig.embeds.footer.text })
        .setTimestamp();

      await message.edit({ embeds: [timedOutEmbed], components: [disabledRow] });
    }
  });
}
