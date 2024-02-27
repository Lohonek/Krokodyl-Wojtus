const { PermissionFlagsBits } = require('discord.js')

module.exports = {
    customId: 'cancelCloseTicketBtn',
    userPermissions: [PermissionFlagsBits.ManageThreads],
    botPermissions: [],
    run: async (client, interaction) => {
        try {
            return await interaction.reply({
                content: 'Cancelled closing ticket.',
                ephemeral: true,
            })
        } catch (err) {
            console.log(err)
        }
    },
}
