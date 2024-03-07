const {
    SlashCommandBuilder,
    EmbedBuilder,
    time,
    discordSort,
} = require('discord.js')
const packageJson = require('../../../package.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about the bot, server, or user.')
        .addSubcommand((s) =>
            s
                .setName('user')
                .setDescription('Displays information about a user.')
                .addUserOption((o) =>
                    o
                        .setName('target')
                        .setDescription(
                            'The user to display information about.'
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName('server')
                .setDescription('Displays information about the server.')
        )
        .addSubcommand((s) =>
            s
                .setName('bot')
                .setDescription('Displays information about the bot.')
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ fetchReply: true })

        const { options, guild } = interaction
        const subcommand = options.getSubcommand()

        const infoEmbed = new EmbedBuilder().setColor('FFFFFF')

        switch (subcommand) {
            case 'user':
                const user = options.getUser('target')
                const member = options.getMember('target')

                infoEmbed.setAuthor({
                    name: user.tag,
                    iconURL: user.displayAvatarURL({ dynamic: true }),
                })
                infoEmbed.addFields(
                    { name: 'User ID', value: `\`${user.id}\``, inline: true },
                    {
                        name: 'Nickname',
                        value: `${member.nickname || '`No nickname`'}`,
                        inline: true,
                    },
                    {
                        name: 'Username',
                        value: `${user.username}`,
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: `${getStatusText(member.presence?.status)}`,
                        inline: true,
                    },
                    {
                        name: 'Joined Server',
                        value: `${time(member.joinedAt, 'R')}`,
                        inline: true,
                    },
                    {
                        name: 'Joined Discord',
                        value: `${time(user.createdAt, 'R')}`,
                        inline: true,
                    },
                    {
                        name: 'Highest Role',
                        value: `${
                            discordSort(member.roles.cache).last().toString() ||
                            '`No highest role`'
                        }`,
                        inline: true,
                    }
                )
                infoEmbed.setThumbnail(user.displayAvatarURL({ dynamic: true }))
                break

            case 'server':
                infoEmbed.setAuthor({
                    name: guild.name,
                    iconURL: guild.iconURL({ dynamic: true }),
                })
                infoEmbed.addFields(
                    {
                        name: 'Owner',
                        value: `<@${guild.ownerId}>`,
                        inline: true,
                    },
                    {
                        name: 'Members',
                        value: `${guild.memberCount}`,
                        inline: true,
                    },
                    {
                        name: 'Roles',
                        value: `${guild.roles.cache.size}`,
                        inline: true,
                    },
                    {
                        name: 'Channels',
                        value: `${guild.channels.cache.size}`,
                        inline: true,
                    },
                    {
                        name: 'Created At',
                        value: `${time(guild.createdAt, 'R')}`,
                        inline: true,
                    },
                    {
                        name: 'Boosts',
                        value: `${guild.premiumSubscriptionCount}`,
                        inline: true,
                    }
                )
                infoEmbed.setThumbnail(guild.iconURL({ dynamic: true }))
                break

            case 'bot':
                const uptime = new Date(Date.now() - client.uptime)

                infoEmbed.setAuthor({
                    name: client.user.tag,
                    iconURL: client.user.displayAvatarURL({ dynamic: true }),
                })
                infoEmbed.addFields(
                    {
                        name: 'Ping',
                        value: `${Math.round(client.ws.ping)}ms`,
                        inline: true,
                    },
                    {
                        name: 'Uptime',
                        value: `${time(uptime, 'R')}`,
                        inline: true,
                    },
                    {
                        name: 'Memory Usage',
                        value: `${(
                            process.memoryUsage().heapUsed /
                            1024 /
                            1024
                        ).toFixed(2)} MB`,
                        inline: true,
                    },
                    {
                        name: 'CPU Usage',
                        value: `${(
                            process.cpuUsage().system /
                            1024 /
                            1024
                        ).toFixed(2)}%`,
                        inline: true,
                    },
                    {
                        name: 'Node.js Version',
                        value: `${process.version}`,
                        inline: true,
                    },
                    {
                        name: 'Discord.js Version',
                        value: `${packageJson.dependencies[
                            'discord.js'
                        ].substring(1)}`,
                        inline: true,
                    }
                )
                infoEmbed.setThumbnail(
                    client.user.displayAvatarURL({ dynamic: true })
                )
                break
        }

        await interaction.editReply({ embeds: [infoEmbed] })
    },
}

function getStatusText(status) {
    switch (status) {
        case 'online':
            return '`🟢` Online'
        case 'idle':
            return '`🟠` Idle'
        case 'dnd':
            return '`🔴` Do not disturb'
        case 'offline':
            return '`⚫` Offline'
        case 'invisible':
            return '`⚫` Offline'
        default:
            return '`❓` Unknown'
    }
}
