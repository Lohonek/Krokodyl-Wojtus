const { EmbedBuilder } = require('discord.js')
const { developerId, testServerId } = require('../../config.json')
const mConfig = require('../../messageConfig.json')
const getLocalContextMenus = require('../../utils/getLocalCommands')

module.exports = async (client, interaction) => {
  if (!interaction.isConxtextMenuCommand) return

  const localContextMenus = getLocalContextMenus()

  try {
    const menuObject = localContextMenus.find(
      (cmd) => cmd.data.name === interaction.commandName
    )

    if (!menuObject) return

    const createEmbed = (color, description) =>
      new EmbedBuilder().setColor(color).setDescription(description)

    if (menuObject.devOnly && !developerId.includes(interaction.member.id)) {
      const rEmbed = createEmbed(
        mConfig.embedColorError,
        mConfig.commandDevOnly
      )
      return interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }

    if (menuObject.testMode && interaction.guild.id !== testServerId) {
      const rEmbed = createEmbed(
        mConfig.embedColorError,
        mConfig.commandTestMode
      )
      return interaction.reply({ embeds: [rEmbed], ephemeral: true })
    }
    for (const permission of menuObject.userPermissions || []) {
      if (!interaction.member.permissions.has(permission)) {
        const rEmbed = createEmbed(
          mConfig.embedColorError,
          mConfig.userNoPermissions
        )
        return interaction.reply({ embeds: [rEmbed], ephemeral: true })
      }
    }

    const bot = interaction.guild.members.me

    for (const permission of menuObject.userPermissions || []) {
      if (!bot.permissions.has(permission)) {
        const rEmbed = createEmbed(
          mConfig.embedColorError,
          mConfig.botNoPermissionss
        )
        return interaction.reply({ embeds: [rEmbed], ephemeral: true })
      }
    }
    await menuObject.run(client, interaction)
  } catch (error) {
    console.log(`[ERROR] an error occured${err}`.red)
  }
}
