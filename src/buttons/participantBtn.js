const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    Client,
    ButtonInteraction,
} = require('discord.js')

module.exports = {
    customId: 'participantBtn',
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    run: async (client, interaction) => {
        const modal = new ModalBuilder()
            .setCustomId('participantMdl')
            .setTitle('Change user limit')

        const row = new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('participantTxI')
                .setLabel('New limit of users: (max: 99)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        )

        modal.addComponents(row)
        await interaction.showModal(modal)
    },
}
