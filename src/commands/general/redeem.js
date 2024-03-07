const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    ChatInputCommandInteraction,
} = require('discord.js')
const premiumKeySchema = require('../../schemas/premiumkey')
const userPremiumSchema = require('../../schemas/userpremium')

const mConfig = require('../../messageConfig.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeems a code from the premium system.')
        .addStringOption((o) =>
            o
                .setName('code')
                .setDescription('The code to redeem.')
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { options, user } = interaction
        await interaction.deferReply({ ephemeral: true, fetchReply: true })

        const code = options.getString('code')

        const data = await premiumKeySchema.findOne({ Code: code })
        if (!data)
            return interaction.editReply({
                content:
                    '`❌` This code is invalid. Please contact the developers if you think this is a mistake.',
            })

        if (
            checkUser(data, interaction) ||
            checkMaxUsage(data, interaction) ||
            checkExpiry(data, interaction, true)
        )
            return

        const userData = await userPremiumSchema.findOne({ UserID: user.id })

        const rEmbed = new EmbedBuilder().setFooter({
            text: `${client.user.username} | Premium System`,
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
        })

        if (userData) {
            if (userData.Code === code) {
                return interaction.editReply({
                    content:
                        '`❌` This product key is already registered. Contact the developers if you want to renew it.',
                })
            } else {
                let databaseCode = userData.Code ? userData.Code : code
                const dataWithDatabaseCode = await premiumKeySchema.findOne({
                    Code: databaseCode,
                })
                var databaseTime = dataWithDatabaseCode.DateTag
                var expiryCheck = checkExpiry(
                    dataWithDatabaseCode,
                    interaction,
                    false
                )
            }

            let msg
            if (!expiryCheck) {
                msg = `\`❔\` Your product key hasn't expired yet, Would you still like to renew it?\n\n\`⏱️\` Subscription time ends: <t:${timeformat(
                    parseInt(databaseTime)
                )}:R>`
            } else {
                msg =
                    '`❕` Your product key has expired, Would you like to renew it?'
            }

            rEmbed
                .setTitle('Renew Premium?')
                .setDescription(msg)
                .setColor('White')
                .setTimestamp()

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setCustomId('renew-yes')
                    .setLabel('Yes, renew it!'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('renew-no')
                    .setLabel("No, don't renew it!")
            )

            const newPage = await interaction.editReply({
                embeds: [rEmbed],
                components: [buttons],
            })

            let time = 30_000
            const collector = newPage.createMessageComponentCollector({ time })

            collector.on('collect', async (i) => {
                interaction.editReply({ components: [] })
                switch (i.customId) {
                    case 'renew-yes':
                        rEmbed
                            .setColor(mConfig.embedColorWarning)
                            .setDescription('`⌛` Renewing your premium...')
                        await interaction.editReply({
                            embeds: [rEmbed],
                            ephemeral: true,
                        })

                        userData.Code = code
                        data.CurrentUsage += 1

                        data.save()
                        userData.save()

                        rEmbed
                            .setColor(mConfig.embedColorSuccess)
                            .setDescription(
                                '`✅` Your premium has been renewed!'
                            )
                        await interaction.editReply({
                            embeds: [rEmbed],
                            ephemeral: true,
                        })

                        await i.reply({
                            content:
                                '`✅` Successfully renewed your premium, thanks for supporting us!',
                            ephemeral: true,
                        })
                        break

                    case 'renew-no':
                        rEmbed
                            .setColor(mConfig.embedColorWarning)
                            .setDescription(
                                '`❌` Canceling your premium renewal...'
                            )
                        await interaction.editReply({
                            embeds: [rEmbed],
                            ephemeral: true,
                        })
                        await i.reply({
                            content:
                                '`❌` Renewal declined. If you change your mind, feel free to renew at any time.',
                            ephemeral: true,
                        })
                        break
                }
            })
            collector.on('end', async () => {
                rEmbed
                    .setColor(mConfig.embedColorError)
                    .setDescription(
                        "`❌` You didn't respond in time. If you change your mind, feel free to renew at any time."
                    )
                await interaction.editReply({
                    embeds: [rEmbed],
                    ephemeral: true,
                })
                return
            })
        } else {
            const formattedTime = data.DateTag
            let newdata = new userPremiumSchema({
                Code: code,
                UserID: user.id,
            })
            newdata.save()

            rEmbed
                .setColor(mConfig.embedColorSuccess)
                .setDescription(
                    `\`✅\` Successfully activated your premium code, Your premium subscribtion will expire at <t:${timeformat(
                        parseInt(formattedTime)
                    )}>`
                )
            await interaction.editReply({ embeds: [rEmbed], ephemeral: true })

            data.CurrentUsage += 1
            data.save()

            return
        }
    },
}

function timeformat(time) {
    const dateNow = Date.now()
    return Math.floor(parseInt(dateNow) / 1000 + time / 1000)
}

function checkUser(data, interaction) {
    if (data.UserID !== 'None' && data.UserID !== interaction.user.id) {
        interaction.editReply({
            content:
                '`❌` This product key is not assigned to you. Please contact the developers if you think this is a mistake.',
        })
        return true
    }

    return false
}

function checkMaxUsage(data, interaction) {
    if (data.CurrentUsage >= data.Uses) {
        interaction.editReply({
            content:
                '`❌` This product key has reached its maximum usage. Please contact the developers if you think this is a mistake.',
        })
        return true
    }

    return false
}

function checkExpiry(data, interaction, expired) {
    const dateDifference = Date.now() - data.Date
    const inputTime = data.DateTag

    if (dateDifference > inputTime) {
        if (expired) {
            interaction.editReply({
                content:
                    '`❌` This product key has expired. Please contact the developers if you think this is a mistake',
            })
        }
        return true
    }
    return false
}
