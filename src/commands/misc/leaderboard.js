const {
    SlashCommandBuilder,
    EmbedBuilder,
    Client,
    ChatInputCommandInteraction,
} = require('discord.js')
const User = require('../../schemas/levels')
const AsciiTable = require('ascii-table')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Gets the leaderboard for the server.')
        .setDMPermission(false)
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { guildId: GuildID, guild, user } = interaction

        const users = await User.find({ GuildID }).sort({ level: -1 }).limit(10)
        const startIndex = 0

        if (users.length) {
            const table = new AsciiTable('Ranking')
            table.setHeading('Position', 'User', 'Level', 'XP')

            users.forEach((user, position) => {
                const member = guild.members.cache.get(user.UserID)
                table.addRow(
                    startIndex + position + 1,
                    member ? member.user.globalName : 'Unknown User',
                    user.Level,
                    user.Xp
                )
            })

            const rEmbed = new EmbedBuilder()
                .setTitle(`📊 XP Leaderboard: ${guild.name}`)
                .setColor('FFFFFF')
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setDescription('```' + table.toString() + '```')
                .setFooter(
                    { text: `Requested by: ${user.tag}` },
                    { iconURL: user.displayAvatarURL({ dynamic: true }) }
                )
            interaction.reply({ embeds: [rEmbed] })
        } else {
            const rEmbed = new EmbedBuilder()
                .setTitle(`📊 XP Leaderboard: ${guild.name}`)
                .setColor('FFFFFF')
                .setDescription(
                    '## *There is currently no leaderboard available.*'
                )
                .setFooter(
                    { text: `Requested by: ${user.tag}` },
                    { iconURL: user.displayAvatarURL({ dynamic: true }) }
                )
            interaction.reply({ embeds: [rEmbed] })
        }
    },
}
