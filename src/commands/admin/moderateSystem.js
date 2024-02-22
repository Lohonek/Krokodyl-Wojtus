const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js')

const moderationSchema = require('../../schemas/moderation')
const mConfig = require('../../messageConfig.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderatesystem')
    .setDescription('An advanced moderating system')
    .addSubcommand((s) =>
      s
        .setName('configure')
        .setDescription(
          'Configures the advanced moderating system into the server'
        )
        .addChannelOption((o) =>
          o
            .setName('logging_channel')
            .setDescription('The channel where all moderation will be logged')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription(
          'Removes the advanced moderation system from the server'
        )
    )
    .toJSON(),
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [],

  run: async (client, interaction) => {
    const { options, guildId, guild } = interaction
    const subcmd = options.getSubcommand()

    if (!['configure', 'remove'].includes(subcmd)) return

    const rEmbed = new EmbedBuilder().setFooter({
      iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
      text: `${client.user.username} - Advanced moderation system`,
    })

    switch (subcmd) {
      case 'configure':
        const loggingChannel = options.getChannel('logging_channel')

        let dataGD = await moderationSchema.findOne({ GuildId: guildId })

        if (!dataGD) {
          rEmbed
            .setColor(`${mConfig.embedColorWarning}`)
            .setDescription(
              '`⌛` New server detected: Configuring the advanced moderating system...'
            )
          await interaction.reply({
            embeds: [rEmbed],
            fetchReply: true,
            ephemeral: true,
          })

          dataGD = new moderationSchema({
            GuildId: guildId,
            LogChannelID: loggingChannel.id,
          })

          dataGD.save()

          rEmbed
            .setColor(mConfig.embedColorSuccess)
            .setDescription(
              `\`👩\` Successfully configured advanced moderation system`
            )
            .addFields({
              name: 'Logging channel',
              value: `${loggingChannel}`,
              inline: true,
            })

          setTimeout(() => {
            interaction.editReply({ embeds: [rEmbed], ephemeral: true })
          }, 2_000)
        } else {
          await moderationSchema.findOneAndUpdate(
            { GuildId: guildId },
            { LogChannelID: loggingChannel.id }
          )

          rEmbed
            .setColor(mConfig.embedColorSuccess)
            .setDescription(
              `\`👩\` Successfully updated the advanced moderation system`
            )
            .addFields({
              name: 'Logging channel',
              value: `${loggingChannel}`,
              inline: true,
            })

          interaction.reply({ embeds: [rEmbed], ephemeral: true })
        }
        break

      case 'remove':
        const removed = await moderationSchema.findByIdAndDelete({
          GuildID: guildId,
        })

        if (removed) {
          rEmbed
            .setColor(mConfig.embedColorSuccess)
            .setDescription(
              `\`➕\` Successfully removed the advanced moderation system`
            )
        } else {
          rEmbed
            .setColor(mConfig.embedColorError)
            .setDescription(
              `\`➕\` This server isn't configured yet, Use /moderatesystem to start configuring this system`
            )
        }
        interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }
  },
}
