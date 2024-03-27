const { EmbedBuilder, Client, Message } = require('discord.js')
const User = require('../../schemas/levels')
const Setup = require('../../schemas/levelSetup')
const mConfig = require('../../messageConfig.json')

const cooldown = new Set()

module.exports =
    /**
     *
     * @param {Client} client
     * @param {Message} message
     */
    async (client, message) => {
        const { guild, guildId: GuildID, channel, author } = message
        const UserID = author.id
        if (author.bot || !guild) return
        if (cooldown.has(UserID)) return
        if (!message.content) return

        try {
            const channelDB = await Setup.findOne({ GuildID })
            let notificationChannel = null

            if (!channelDB) {
                await Setup.create({
                    GuildID,
                    Boost: 0,
                    Channel: '',
                    Enabled: false,
                }).catch((err) => console.log(err))
                return
            } else if (channelDB.Channel.length > 0) {
                notificationChannel = await client.channels
                    .fetch(channelDB.Channel)
                    .catch((err) => console.log(err))
            }
            if (channelDB.Enabled === false) return

            if (!notificationChannel) notificationChannel = channel
            let min = 25
            let max = 300
            let xpAmount = Math.floor(Math.random() * (max - min + 1) + min)

            if (channelDB && channelDB.Boost !== 0) xpAmount *= channelDB.Boost

            let user = await User.findOne({ GuildID, UserID })
            if (!user) {
                await User.create({ GuildID, UserID })
            } else {
                user.Xp += xpAmount
                await user.save()

                const newLevel = parseInt(
                    (1 + Math.sqrt(1 + (8 * user.Xp) / 300)) / 2
                )
                const oldLevel = user.Level
                user.Level = newLevel

                if (oldLevel < newLevel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🎉 Congratulations 🎉')
                        .setThumbnail(
                            author.displayAvatarURL({ dynamic: true })
                        )
                        .addFields(
                            {
                                name: 'User:',
                                value: `${author.globalName}`,
                                inline: true,
                            },
                            {
                                name: 'New Level:',
                                value: `${newLevel}`,
                                inline: true,
                            },
                            {
                                name: 'Check the global leaderboard usering:',
                                value: `</leaderboard:1194422567440761014>`,
                            }
                        )
                        .setColor(mConfig.embedColorSuccess)
                    notificationChannel.send({ embeds: [embed] })
                }
                await user.save()
            }
        } catch (error) {
            console.log(error)
        }

        cooldown.add(UserID)
        setTimeout(() => {
            cooldown.delete(UserID)
        }, 5_000)
    }
