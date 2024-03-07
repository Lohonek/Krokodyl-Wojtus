const { EmbedBuilder } = require('discord.js')

module.exports = (channelConfig) => {
    const { isLocked, isInvisible, participantCount, OwnerID } = channelConfig

    const embed = new EmbedBuilder()
        .setTitle('Channel Dashboard')
        .addFields(
            {
                name: '`🔒` Locked',
                value: `${isLocked ? 'Yes' : 'No'}`,
                inline: true,
            },
            {
                name: '`🔍` Invisible',
                value: `${isInvisible ? 'Yes' : 'No'}`,
                inline: true,
            },
            {
                name: '`👥` Participant Count',
                value: `${participantCount}`,
            },
            {
                name: '`👑` Owner',
                value: `<@${OwnerID}>`,
            }
        )
        .setColor(`White`)
        .setFooter({ text: `Channel dashboard of ${OwnerID}` })

    return embed
}
