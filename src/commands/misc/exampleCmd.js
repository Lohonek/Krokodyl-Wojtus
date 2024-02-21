const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('test if everything work')
    .setDMPermission(false)
    .addSubcommandGroup((subcommandgroup) =>
      subcommandgroup
        .setName('user')
        .setDescription('Configure a user')
        .addSubcommand((subcomand) =>
          subcomand
            .setName('role')
            .setDescription('Configure a user role')
            .addUserOption((option) =>
              option.setName('user').setDescription('The user to configure')
            )
        )
        .addSubcommand((subcomand) =>
          subcomand
            .setName('nickname')
            .setDescription('Configure a user nickname')
            .addStringOption((option) =>
              option
                .setName('nickanme')
                .setDescription('The nickanme the user should have')
            )
            .addUserOption((option) =>
              option.setName('user').setDescription('The user to configure')
            )
        )
    )
    .addSubcommand((subcomand) =>
      subcomand.setName('message').setDescription('Configure a message')
    )
    .toJSON(),
  userPermissions: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.Connect],

  run: (client, interaction) => {
    return interaction.reply('This is a super command')
  },
}
