const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    Client,
    ChatInputCommandInteraction,
} = require('discord.js')
const JTCschema = require('../../schemas/join-to-create')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('jtc')
        .setDescription(`A join to create system`)
        .addSubcommand((s) =>
            s
                .setName('configure')
                .setDescription(`Configures the jtc system`)
                .addChannelOption((o) =>
                    o
                        .setName('category')
                        .setDescription(`The category to create the channel in`)
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
                .addStringOption((o) =>
                    o
                        .setName('name')
                        .setDescription(
                            `What should the name of the channel be? (default: Join to create)`
                        )
                        .setMaxLength(25)
                        .setRequired(false)
                )
        )
        .addSubcommand((s) =>
            s
                .setName(`remove`)
                .setDescription(`Remove the Join to create system`)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.MoveMembers,
    ],
    /**
     *
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { options, guild, guildId: GuildID } = interaction
        const subCommand = options.getSubcommand()

        const dataGD = await JTCschema.findOne({
            GuildID,
        })
        switch (subCommand) {
            case 'configure':
                const category = options.getChannel('category')
                const channelName =
                    options.getString('name') || 'Join to create'

                if (dataGD)
                    return interaction.reply({
                        content: `\`❌\` This server already has a join-to-create system configured!`,
                        ephemeral: true,
                    })

                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                })

                await JTCschema.create({
                    GuildID,
                    Category: category.id,
                    Channel: channel.id,
                })
                interaction.reply({
                    content: `\`✅\` Successfully created ${channel} and the join-to-create system.`,
                    ephemeral: true,
                })
                break
            case 'remove':
                if (!dataGD)
                    return interaction.reply({
                        content:
                            '`❌` This server has not yet enabled the join-to-create system! Please run </jtc configure:> to enable it!',
                    })

                await guild.channels.cache.get(dataGD.Channel).delete()

                await JTCschema.findOneAndDelete({
                    GuildID,
                })
                return interaction.reply({
                    content: `\`✅\` Removed the system!`,
                    ephemeral: true,
                })
        }
    },
}
