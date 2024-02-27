const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActivityType,
    EmbedBuilder,
    Client,
    ChatInputCommandInteraction,
} = require('discord.js')
const botStatuses = require('../../schemas/botPresence')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('presence')
        .setDescription('Manage the bots activty and status')
        .addSubcommand((s) =>
            s
                .setName('add')
                .setDescription('Add a new presence')
                .addStringOption((o) =>
                    o
                        .setName('name')
                        .setDescription('The name of the activity')
                        .setRequired(true)
                )
                .addStringOption((o) =>
                    o
                        .setName('type')
                        .setDescription('The type')
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Playing',
                                value: `${ActivityType.Playing}`,
                            },
                            {
                                name: 'Listening',
                                value: `${ActivityType.Listening}`,
                            },
                            {
                                name: 'Watching',
                                value: `${ActivityType.Watching}`,
                            },
                            {
                                name: 'Competing',
                                value: `${ActivityType.Competing}`,
                            },
                            { name: 'Custom', value: `${ActivityType.Custom}` }
                        )
                )
                .addStringOption((o) =>
                    o
                        .setName('status')
                        .setDescription('The status to add')
                        .addChoices(
                            { name: 'Online', value: 'online' },
                            { name: 'Idle', value: 'idle' },
                            { name: 'Do Not Disturb', value: 'dnd' },
                            { name: 'Invisible', value: 'invisible' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('remove')
                .setDescription('Remove the last added activity from the bot.')
        )
        .addSubcommand((s) =>
            s.setName('list').setDescription('List all the bots activities.')
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.SendMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],
    devOnly: true,
    /**
     * @param { Client } client
     * @param { ChatInputCommandInteraction } interaction
     */
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const data = await botStatuses.findOne({ ClientID: client.user.id })

        switch (subcommand) {
            case 'add':
                const name = interaction.options.getString('name')
                const type = interaction.options.getString('type')
                const status = interaction.options.getString('status')

                if (!data) {
                    await botStatuses.create({
                        ClientID: client.user.id,
                        Presences: [
                            {
                                Name: name,
                                Type: parseInt(type),
                            },
                        ],
                    })
                } else {
                    await botStatuses.findOneAndUpdate(
                        { ClientID: client.user.id },
                        {
                            $push: {
                                Presences: {
                                    Activity: [
                                        { Name: name, Type: parseInt(type) },
                                    ],
                                    Status: status,
                                },
                            },
                        }
                    )
                }
                return interaction.reply({
                    content: `\`✅\` Successfully added the activity \`${name}\` to the bot!`,
                    ephemeral: true,
                })
            case 'remove':
                if (!data) {
                    return interaction.reply({
                        content: `\`❌\` There are no activities to remove!`,
                        ephemeral: true,
                    })
                }

                await botStatuses.findOneAndUpdate(
                    {
                        ClientID: client.user.id,
                    },
                    {
                        $pop: {
                            Presences: 1,
                        },
                    }
                )
                return interaction.reply({
                    content: `\`✅\` Successfully removed the last activity from the bot!`,
                    ephemeral: true,
                })

            case 'list':
                if (!data) {
                    return interaction.reply({
                        content: `\`❌\` There are no activities to list!`,
                        ephemeral: true,
                    })
                }

                const presences = data.Presences

                const rEmbed = new EmbedBuilder()
                    .setTitle(`\`⭐\` Activities of the bot`)
                    .setColor('White')
                    .setFooter({
                        iconURL: client.user.displayAvatarURL({
                            dynamic: true,
                        }),
                        text: `${client.user.username} | Activity List`,
                    })

                const activityType = [
                    'Playing',
                    'Listening',
                    'Watching',
                    'Competing',
                    'Custom',
                ]
                const activityStatus = {
                    online: 'Online',
                    idle: 'Idle',
                    dnd: 'Do Not Disturb',
                    invisible: 'Invisible',
                }

                presences.forEach((presence, index) => {
                    rEmbed.addFields({
                        name: `\`${index + 1}\` - \`${
                            presence.Activity[0].Name
                        }\``,
                        value: `**Type:** ${
                            activityType[presence.Activity[0].Type]
                        }\n**Status:** ${activityStatus[presence.Status]}`,
                    })
                })

                return interaction.reply({ embeds: [rEmbed], ephemeral: true })
        }
    },
}
