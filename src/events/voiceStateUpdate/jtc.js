const { ChannelType, Client, VoiceState } = require('discord.js')
const generateEmbed = require('../../utils/join-to-create/generateEmbed')
const generateRow = require('../../utils/join-to-create/generateRow')
const JTCschema = require('../../schemas/join-to-create')

/**
 *
 * @param {Client} client
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
    try {
        const config = await JTCschema.findOne({ GuildID: newState.guild.id })
        const channelConfig = config?.Channels.find(
            (channel) => channel.ChannelID === oldState.channelId
        )

        if (
            config &&
            newState.channelId === config.Channel &&
            !newState.member.user.bot
        ) {
            const channelName = `${newState.member.user.username}'s Channel`

            const createdChannel = await newState.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: config.Category,
            })

            const JTCchannel = newState.guild.channels.cache.get(config.Channel)

            await JTCchannel.permissionOverwrites.edit(newState.member, {
                Connect: false,
            })

            await createdChannel.permissionOverwrites.edit(newState.member, {
                Connect: true,
            })
            await newState.setChannel(createdChannel)
            const newChannel = {
                ChannelID: createdChannel.id,
                OwnerID: newState.member.user.id,
                isLocked: false,
                MessageID: '',
                isInvisible: false,
                participantCount: 99,
            }

            const msg = await createdChannel.send({
                embeds: [generateEmbed(newChannel)],
                components: [generateRow(newChannel)],
            })
            newChannel.MessageID = msg.id
            config.Channels.push(newChannel)
            await config.save().catch((err) => console.log(err))
        }

        if (
            channelConfig &&
            channelConfig.ChannelID &&
            oldState.channel &&
            oldState.channel.members.size === 0
        ) {
            const JTCchannel = newState.guild.channels.cache.get(config.Channel)

            await JTCchannel.permissionOverwrites.delete(newState.member)

            await oldState.guild.channels.cache
                .get(channelConfig.ChannelID)
                .delete()

            config.Channels = config.Channels.filter(
                (channel) => channel.ChannelID !== channelConfig.ChannelID
            )

            await config.save().catch((err) => console.log(err))
        }
    } catch (error) {
        console.log(error)
    }
}
