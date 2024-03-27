const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

module.exports = (channelConfig) => {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('lockBtn')
            .setLabel(
                `${
                    channelConfig.isLocked
                        ? '🔓 Unlock channel'
                        : '🔒 Lock channel'
                }`
            )
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('visibilityBtn')
            .setLabel(
                `${
                    channelConfig.isInvisible
                        ? '👀 Make visible'
                        : '🔎 Make Invisible'
                }`
            )
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('participantBtn')
            .setLabel(`👥 Change Participant Count`)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('changeOwnerBtn')
            .setLabel(`🔁 Change Ownership`)
            .setStyle(ButtonStyle.Primary)
    )

    return row
}
