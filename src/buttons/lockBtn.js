const generateEmbed = require('../utils/join-to-create/generateEmbed')
const generateRow = require('../utils/join-to-create/generateRow')
const JTCschema = require('../schemas/join-to-create')
const { ButtonInteraction, Client } = require('discord.js')

module.exports = {
    customId: 'lockBtn',
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    run: async (client, interaction) => {
        const config = await JTCschema.findOne({
            GuildID: interaction.guild.id,
        })
        const channelConfig = config?.Channels.find(
            (channel) => channel.ChannelID === interaction.channelId
        )

        if (!channelConfig || channelConfig.OwnerID !== interaction.user.id)
            return interaction.reply({
                content: "You can't use this button!",
                ephemeral: true,
            })

        const { MessageID, isLocked, ChannelID } = channelConfig
        const channel = client.channels.cache.get(ChannelID)
        const originalMessage = await channel.messages.fetch(MessageID)

        if (isLocked) {
            await interaction.channel.permissionOverwrites.edit(
                interaction.guild.roles.everyone,
                {
                    Connect: true,
                }
            )
            await interaction.channel.permissionOverwrites.edit(
                interaction.user,
                {
                    Connect: true,
                }
            )

            channelConfig.isLocked = false
            await config.save().catch((err) => console.log(err))

            await originalMessage.edit({
                embeds: [generateEmbed(channelConfig)],
                components: [generateRow(channelConfig)],
            })
            await interaction.reply({
                content: '`✅` Unlocked Successfully!',
                ephemeral: true,
            })
        } else {
            await interaction.channel.permissionOverwrites.edit(
                interaction.guild.roles.everyone,
                {
                    Connect: false,
                }
            )
            await interaction.channel.permissionOverwrites.edit(
                interaction.user,
                {
                    Connect: true,
                }
            )

            channelConfig.isLocked = true
            await config.save().catch((err) => console.log(err))

            await originalMessage.edit({
                embeds: [generateEmbed(channelConfig)],
                components: [generateRow(channelConfig)],
            })
            await interaction.reply({
                content: '`✅` Locked Successfully!',
                ephemeral: true,
            })
        }
    },
}
