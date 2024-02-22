const { EmbedBuilder } = require('discord.js')
const { developerId, testServerId } = require('../../config.json')
const mConfig = require('../../messageConfig.json')
const getLocalCommands = require('../../utils/getLocalCommands')

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand) return

  const localCommands = getLocalCommands()

  const commandObject = localCommands.find(
    (cmd) => cmd.data.name === interaction.commandName
  )

  if (!commandObject) return

  const createEmbed = (color, description) =>
    new EmbedBuilder().setColor(color).setDescription(description)

  if (commandObject.devOnly && !developerId.includes(interaction.member.id)) {
    const rEmbed = createEmbed(mConfig.embedColorError, mConfig.commandDevOnly)
    return interaction.reply({ embeds: [rEmbed], ephemeral: true })
  }

  if (commandObject.testMode && interaction.guild.id !== testServerId) {
    const rEmbed = createEmbed(mConfig.embedColorError, mConfig.commandTestMode)
    return interaction.reply({ embeds: [rEmbed], ephemeral: true })
  }
  for (const permission of commandObject.userPermissions || []) {
    if (!interaction.member.permissions.has(permission)) {
      const rEmbed = createEmbed(
        mConfig.embedColorError,
        mConfig.userNoPermissions
      )
      return interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }
  }

  const bot = interaction.guild.members.me

  for (const permission of commandObject.userPermissions || []) {
    if (!bot.permissions.has(permission)) {
      const rEmbed = createEmbed(
        mConfig.embedColorError,
        mConfig.botNoPermissionss
      )
      return interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }

    try {
      await commandObject.run(client, interaction)
    } catch (err) {
      console.log(`[ERROR] an error occured ${err}`.red)
    }
  }
}
