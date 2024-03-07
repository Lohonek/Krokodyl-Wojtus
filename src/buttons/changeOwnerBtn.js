const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    Client,
    ButtonInteraction,
} = require('discord.js')

module.exports = {
    customId: 'changeOwnerBtn',
    userPermissions: [],
    botPermissions: [],

    /**
     *
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    run: async (client, interaction) => {
        const modal = new ModalBuilder()
            .setCustomId('changeOwnerMdl')
            .setTitle('Change Owner')

        const row = new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('changeOwnerTxI')
                .setLabel('The user ID of the new owner:')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        )

        modal.addComponents(row)
        await interaction.showModal(modal)
    },
}
