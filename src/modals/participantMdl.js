const generateEmbed = require('../utils/join-to-create/generateEmbed')
const generateRow = require('../utils/join-to-create/generateRow')
const JTCschema = require('../schemas/join-to-create')
const { Client, ModalSubmitInteraction } = require('discord.js')

module.exports = {
    customId: 'participantMdl',
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ModalSubmitInteraction} interaction
     */
    run: async (client, interaction) => {
        const { fields } = interaction
        await interaction.deferReply({ ephemeral: true })

        const config = await JTCschema.findOne({
            GuildID: interaction.guild.id,
        })
        const channelConfig = config?.Channels.find(
            (channel) => channel.ChannelID === interaction.channelId
        )

        if (!channelConfig || channelConfig.OwnerID !== interaction.user.id)
            return interaction.editReply({
                content: "You can't use this button!",
                ephemeral: true,
            })

        const { MessageID, ChannelID } = channelConfig
        const channel = client.channels.cache.get(ChannelID)
        const originalMessage = await channel.messages.fetch(MessageID)

        try {
            let newParticipantCount = parseInt(
                fields.getTextInputValue('participantTxI')
            )

            if (
                !isNaN(newParticipantCount) &&
                newParticipantCount >= 0 &&
                newParticipantCount <= 99
            ) {
                await interaction.channel.edit({
                    userLimit: newParticipantCount,
                })

                channelConfig.ParticipantCount = newParticipantCount
                await config.save().catch((err) => console.log(err))

                await originalMessage.edit({
                    embeds: [generateEmbed(channelConfig)],
                    components: [generateRow(channelConfig)],
                })

                await interaction.followUp({
                    content: '`✅` Successfully changed the limit!',
                    ephemeral: true,
                })
            } else {
                await interaction.followUp({
                    content: '`❌` Invalid number!',
                    ephemeral: true,
                })
            }
        } catch (error) {
            console.log(error)
        }
    },
}
