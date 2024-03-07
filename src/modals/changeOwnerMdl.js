const generateEmbed = require('../utils/join-to-create/generateEmbed')
const generateRow = require('../utils/join-to-create/generateRow')
const JTCschema = require('../schemas/join-to-create')
const { Client, ModalSubmitInteraction } = require('discord.js')

module.exports = {
    customId: 'changeOwnerMdl',
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ModalSubmitInteraction} interaction
     */
    run: async (client, interaction) => {
        const { fields, guild, member } = interaction
        await interaction.deferReply({ ephemeral: true })

        const config = await JTCschema.findOne({
            GuildID: interaction.guild.id,
        })
        const channelConfig = config.Channels.find(
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
            let target = fields.getTextInputValue('changeOwnerTxI')

            const targetMember = await guild.members.cache.get(target)
            if (!targetMember)
                return interaction.followUp({
                    content: '`❌` Invalid member!',
                    ephemeral: true,
                })

            const userVoiceChannel = member.voice?.channel
            const targetVoiceChannel = targetMember.voice?.channel

            if (
                !userVoiceChannel ||
                !targetMember.voice ||
                !targetVoiceChannel
            ) {
                return interaction.followUp({
                    content:
                        '`❌` You and the target member must be in a voice channel!',
                    ephemeral: true,
                })
            }

            if (userVoiceChannel.id !== targetVoiceChannel.id) {
                return interaction.followUp({
                    content:
                        '`❌` You and the target member must be in the same voice channel!',
                    ephemeral: true,
                })
            }

            channelConfig.OwnerID = targetMember.id

            const channel = guild.channels.cache.get(channelConfig.ChannelID)
            await channel.edit({
                name: `${targetMember.user.username}'s Channel`,
            })

            await config.save().catch((err) => console.log(err))

            await interaction.followUp({
                content: `\`✅\` Successfully changed the owner to ${targetMember}!`,
                ephemeral: true,
            })
            await originalMessage.edit({
                embeds: [generateEmbed(channelConfig)],
                components: [generateRow(channelConfig)],
            })
        } catch (error) {
            console.log(error)
        }
    },
}
