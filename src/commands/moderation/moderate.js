const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js')

const mConfig = require('../../messageConfig.json')
const moderationSchema = require('../../schemas/moderation')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderate')
    .setDescription('Moderate a server member')
    .addUserOption((o) =>
      o
        .setName('user')
        .setDescription('The server member you want to moderate ')
        .setRequired(true)
    )
    .toJSON(),
  userPermissions: [PermissionFlagsBits.ManageMessages],
  botPermissions: [],

  run: async (client, interaction) => {
    const { options, guildId, guild, member } = interaction

    const user = options.getUser('user')
    const targetMember = await guild.member.fetch(member)

    const rEmbed = new EmbedBuilder()
      .setColor('FFFFFF')
      .setFooter({ text: `${client.user.username} - Moderate user` })

    let data = await moderationSchema.findOne({ GuildId: guildId })

    if (!data) {
      rEmbed
        .setColor(mConfig.embedColorError)
        .setDescription(
          `\`➕\` This server isn't configured yet, Use /moderatesystem to start configuring this system`
        )
      return interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }
    if (targetMember.id === member.id) {
      rEmbed
        .setColor(mConfig.embedColorError)
        .setDescription(`${mConfig.unableIoInteractWithYourself}`)
      return interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }

    if (targetMember.roles.highest.position >= member.roles.highest.position) {
      rEmbed
        .setColor(mConfig.embedColorError)
        .setDescription(`${mConfig.hasHigherRolePosition}`)
      return interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }

    const moderationButtons = new ActionRowBuilder().setComponents(
      new ButtonBuilder()
        .setCustomId('banBtn')
        .setLabel('Server ban')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('kickBtn')
        .setLabel('Server kick')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancelBtn')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    )
    rEmbed
      .setAuthor({
        name: `${targetMember.user.username}`,
        iconURL: `${targetMember.user.displayAvatarURL({ dynamic: true })}`,
      })
      .setDescription(
        `\❔\` What action do you want to use against ${targetMember.user.username}`
      )

    interaction.reply({ embeds: [rEmbed], components: [moderationButtons] })
  },
}
