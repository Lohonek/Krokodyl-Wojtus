const {
    SlashCommandBuilder,
    EmbedBuilder,
    Client,
    ChatInputCommandInteraction,
} = require('discord.js')
const premiumKeySchema = require('../../schemas/premiumkey')
const userPremiumSchema = require('../../schemas/userpremium')

const mConfig = require('../../messageConfig.json')
const ms = require('ms')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premiumsystem')
        .setDescription('An advanced premium system')
        .addSubcommandGroup((sg) =>
            sg
                .setName('code')
                .setDescription('Subcommandgroup code')
                .addSubcommand((sub) =>
                    sub
                        .setName('generate')
                        .setDescription('Generates a premium code')
                        .addStringOption((o) =>
                            o
                                .setName('expiration')
                                .setDescription(
                                    'When this premium code should expire (default: 1 month).'
                                )
                                .addChoices(
                                    { name: '7 Days', value: '7 days' },
                                    { name: '1 Month', value: '30 days' },
                                    { name: '6 Months', value: '180 days' },
                                    { name: '1 Year', value: '1 year' },
                                    { name: 'Lifetime', value: '100 years' },
                                    { name: 'Custom', value: 'custom' }
                                )
                        )
                        .addUserOption((o) =>
                            o
                                .setName('user')
                                .setDescription(
                                    'If set, the only user who can redeem this code.'
                                )
                        )
                        .addIntegerOption((o) =>
                            o
                                .setName('uses')
                                .setDescription(
                                    'How many times this code can be redeemd (default: 1, max: 50).'
                                )
                                .setMinValue(1)
                                .setMaxValue(50)
                        )
                )
                .addSubcommand((sub) =>
                    sub
                        .setName('renew')
                        .setDescription('Renews a premium code')
                        .addStringOption((o) =>
                            o
                                .setName('key')
                                .setDescription('The premium code to renew')
                                .setMinLength(4)
                                .setRequired(true)
                        )
                        .addStringOption((o) =>
                            o
                                .setName('expiration')
                                .setDescription(
                                    'When this premium code should expire (default: 1 month).'
                                )
                                .addChoices(
                                    { name: '7 Days', value: '7 days' },
                                    { name: '1 Month', value: '30 days' },
                                    { name: '6 Months', value: '180 days' },
                                    { name: '1 Year', value: '1 year' },
                                    { name: 'Lifetime', value: '100 years' },
                                    { name: 'Custom', value: 'custom' }
                                )
                        )
                )
        )
        .addSubcommandGroup((sg) =>
            sg
                .setName('remove')
                .setDescription('subcommandgroup remove.')
                .addSubcommand((sub) =>
                    sub
                        .setName('code')
                        .setDescription('Removes a premium code')
                        .addStringOption((o) =>
                            o
                                .setName('key')
                                .setDescription('The premium code to remove')
                                .setRequired(true)
                        )
                )
                .addSubcommand((sub) =>
                    sub
                        .setName('user')
                        .setDescription('Removes a user from a premium code')
                        .addStringOption((o) =>
                            o
                                .setName('user-id')
                                .setDescription(
                                    'The user ID whose premium should be removed.'
                                )
                                .setRequired(true)
                        )
                )
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    devOnly: true,
    /**
     *
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { options, channel, user } = interaction
        await interaction.deferReply({ ephemeral: true })

        const subcmdgrp = options.getSubcommandGroup()
        const subcmd = options.getSubcommand()

        const rEmbed = new EmbedBuilder().setFooter({
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
            text: `${client.user.username} | Premium System`,
        })

        switch (subcmdgrp) {
            case 'code':
                let time = options.getString('expiration') || '30 days'
                const target = options.getUser('user') || 'none'
                const uses = options.getInteger('uses') || 1

                const productKey = generateProductKey()

                let expirationCollector
                if (time === 'custom') {
                    rEmbed
                        .setDescription(
                            '`❔` When should this premium code expire?\n`❕` You have 15 seconds to reply. After this time the request will be automatically cancelled.\n\n`💡` To cancel the request, answer with `cancel`.'
                        )
                        .setColor('White')

                    interaction.editReply({ embeds: [rEmbed] })
                    const filter = (message) => message.author.id === user.id
                    expirationCollector = await channel
                        .awaitMessages({
                            filter,
                            max: 1,
                            time: 15_000,
                            errors: ['time'],
                        })
                        .then((expiration) => {
                            if (
                                expiration.first().content.toLowerCase() ===
                                'cancel'
                            ) {
                                expiration.first().delete()
                                rEmbed
                                    .setColor(mConfig.embedColorError)
                                    .setDescription(
                                        '`❌` The request has been cancelled.'
                                    )
                                interaction.editReply({ embeds: [rEmbed] })
                                return
                            }
                            return expiration
                        })
                        .catch(() => {
                            rEmbed
                                .setColor(mConfig.embedColorError)
                                .setDescription(
                                    '`❌` The request has been cancelled due to inactivity.'
                                )
                            interaction.editReply({ embeds: [rEmbed] })
                            return
                        })
                }
                const expiration = expirationCollector?.first()

                if (expiration) {
                    time = expiration.content
                    expiration.delete()
                }

                try {
                    time = ms(time)
                } catch (error) {
                    rEmbed
                        .setColor(mConfig.embedColorError)
                        .setDescription(
                            '`❌` Invalid time given for `expiration`\n\n`💡`Examples: `40h`, `100 seconds`, `2 days`'
                        )
                    return interaction.editReply({ embeds: [rEmbed] })
                }

                if (time < 0) {
                    rEmbed
                        .setColor(mConfig.embedColorError)
                        .setDescription(
                            '`❌` Invalid time given for `expiration`\n\n`💡`Examples: `40h`, `100 seconds`, `2 days`'
                        )
                    return interaction.editReply({ embeds: [rEmbed] })
                }

                switch (subcmd) {
                    case 'generate':
                        rEmbed
                            .setColor(mConfig.embedColorSuccess)
                            .setDescription(
                                '`✅` The premium code has been generated successfully.'
                            )
                        interaction.editReply({ embeds: [rEmbed] })

                        const sEmbed = new EmbedBuilder()
                            .setColor(mConfig.embedColorSuccess)
                            .setTitle('`🗝` Premium product key')
                            .setDescription(
                                '\n`❕` This prodct key should not be published in public chats. Share this key only with people you trust!'
                            )
                            .addFields(
                                {
                                    name: 'Product Key',
                                    value: `||${productKey}||`,
                                },
                                {
                                    name: 'Exporation time',
                                    value: `<t:${timeformat(time)}>`,
                                },
                                {
                                    name: 'Allowed user',
                                    value:
                                        target === 'none'
                                            ? 'none'
                                            : `<@${target.id}>`,
                                },
                                { name: 'Maximum uses', value: `${uses}` }
                            )
                            .setFooter({
                                iconURL: `${client.user.displayAvatarURL({
                                    dynamic: true,
                                })}`,
                                text: `${client.user.username} | Premium System`,
                            })

                        user.send({ embeds: [sEmbed] })

                        let newSchemaData = new premiumKeySchema({
                            GeneratedBy: user.id,
                            DateTag: time,
                            Code: productKey,
                            Date: Date.now(),
                            UserID: target.id || 'None',
                            Uses: uses,
                            CurrentUsage: 0,
                        })
                        await newSchemaData.save()
                        break

                    case 'renew':
                        const code = options.getString('key')

                        let schemaData = await premiumKeySchema.findOne({
                            Code: code,
                        })
                        if (!schemaData)
                            return interaction.editReply({
                                content:
                                    '`❌` The provided code does not exist in the database.',
                            })

                        rEmbed
                            .setColor(mConfig.embedColorWarning)
                            .setDescription('`⌛` Renewing the premium code...')

                        interaction.editReply({ embeds: [rEmbed] })

                        if (time) {
                            schemaData.Date = Date.now()
                            schemaData.DateTag = time
                            await schemaData.save()
                        } else {
                            schemaData.Date = Date.now()
                            await schemaData.save()
                        }

                        rEmbed
                            .setColor(mConfig.embedColorSuccess)
                            .setDescription(
                                `\`✅\` The premium code has been renewed. It will now expire at <t:${timeformat(
                                    parseInt(time)
                                )}>.`
                            )

                        interaction.editReply({ embeds: [rEmbed] })
                        break
                }

            case 'remove':
                switch (subcmd) {
                    case 'code':
                        const code = options.getString('key')
                        const premiumData = await premiumKeySchema.findOne({
                            Code: code,
                        })

                        if (!premiumData)
                            return interaction.editReply({
                                content:
                                    '`❌` The provided code does not exist in the database.',
                            })

                        rEmbed
                            .setColor(mConfig.embedColorWarning)
                            .setDescription('`⌛` Removing the premium code...')

                        interaction.editReply({ embeds: [rEmbed] })

                        await premiumKeySchema.findOneAndDelete({ Code: code })

                        rEmbed
                            .setColor(mConfig.embedColorSuccess)
                            .setDescription(
                                '`✅` The premium code has been removed from the database.'
                            )

                        interaction.editReply({ embeds: [rEmbed] })
                        break

                    case 'user':
                        const userId = options.getString('user-id')
                        const userData = await userPremiumSchema.findOne({
                            UserID: userId,
                        })

                        if (!userData)
                            return interaction.editReply({
                                content:
                                    '`❌` The provided user does not have premium in the database.',
                            })

                        rEmbed
                            .setColor(mConfig.embedColorWarning)
                            .setDescription(
                                '`⌛` Removing the premium from the user...'
                            )

                        interaction.editReply({ embeds: [rEmbed] })

                        await userPremiumSchema.findOneAndDelete({
                            UserID: userId,
                        })

                        rEmbed
                            .setColor(mConfig.embedColorSuccess)
                            .setDescription(
                                '`✅` The premium has been removed from the user in the database.'
                            )

                        interaction.editReply({ embeds: [rEmbed] })
                        break
                }
        }

        function timeformat(time) {
            const dateNow = Date.now()
            return Math.floor(parseInt(dateNow) / 1000 + time / 1000)
        }

        function generateProductKey() {
            const characters = 'AaBbCcDdEeFfGgHhKkLlMmNnXxSsQq'
            const id = process.pid
            let productKey = ''

            for (let i = 0; i < 5; i++) {
                productKey += characters.charAt(
                    Math.floor(Math.random() * characters.length)
                )

                let number = 10
                productKey += Math.floor(Math.random() * number)
            }

            productKey += Date.now().toString().slice(0, 4)
            productKey += id

            return productKey
        }
    },
}
