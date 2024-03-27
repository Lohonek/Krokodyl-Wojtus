const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js')
const loggingSchema = require('../../schemas/auditlogging')
const mConfig = require('../../messageConfig.json')
const aConfig = require('../../auditConfig.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loggingsystem')
        .setDescription('An audit logging system using webhooks.')
        .addSubcommand((s) =>
            s
                .setName('configure')
                .setDescription(
                    'Configures the audit logging system using webhooks into the server.'
                )
        )
        .addSubcommand((s) =>
            s
                .setName('remove')
                .setDescription(
                    'Removes the audit logging system from the server.'
                )
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ViewAuditLog],
    botPermissions: [PermissionFlagsBits.ViewAuditLog],

    run: async (client, interaction) => {
        const { options, guildId, channel, guild } = interaction
        const subcmd = options.getSubcommand()
        if (!['configure', 'remove'].includes(subcmd)) return

        const rEmbed = new EmbedBuilder().setFooter({
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
            text: `${client.user.username} - Audit logging system`,
        })

        switch (subcmd) {
            case 'configure':
                let dataGD = await loggingSchema.findOne({ GuildID: guildId })
                let response
                if (!dataGD) {
                    rEmbed
                        .setColor(mConfig.embedColorWarning)
                        .setDescription(
                            '`⌛` New server detected: Configuring the audit logging system...'
                        )

                    response = await interaction.reply({
                        embeds: [rEmbed],
                        fetchReply: true,
                        ephemeral: true,
                    })

                    dataGD = new loggingSchema({
                        GuildID: guildId,
                        Webhooks: [],
                        ChannelLogs: [],
                        GuildLogs: [],
                        MemberLogs: [],
                        IntegrationLogs: [],
                        OtherLogs: [],
                    })
                    dataGD.save()
                } else {
                    response = await interaction.deferReply({
                        fetchReply: true,
                        ephemeral: true,
                    })
                }

                const choices = aConfig.auditLogList
                const auditTypeSSM = new ActionRowBuilder().setComponents(
                    new StringSelectMenuBuilder({
                        options: choices.slice(0, 14).map((choice) => ({
                            label: choice.event,
                            value: choice.event,
                        })),
                    })
                        .setCustomId('auditTypeSSM')
                        .setPlaceholder('Select an audit type')
                        .setMaxValues(14)
                )

                const loggingChannelCSM = new ActionRowBuilder().setComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId('loggingChannelCSM')
                        .setPlaceholder('Select a text channel')
                        .setMaxValues(1)
                        .setDefaultChannels(channel.id)
                        .setChannelTypes(ChannelType.GuildText)
                )

                const continueBtn = new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setCustomId('loggingContinueBtn')
                        .setLabel('Save & continue')
                        .setStyle(ButtonStyle.Success)
                )

                rEmbed
                    .setColor(mConfig.embedColorWarning)
                    .setTitle('Channels & messages (1/5)')
                    .setDescription(
                        `\`❔\` What audit types related to \`Channels & messages\` should be logged and in which channel should every audit log action be sent to? Please select them in the dropdown menus below.\n\n\`💡\` You can change this anytime using the \`/loggingsystem configure\` command.`
                    )
                    .setFields(
                        {
                            name: 'Logging channel',
                            value: `<#${channel.id}> \`(this channel)\``,
                            inline: true,
                        },
                        {
                            name: 'Enabled audit types',
                            value: `\`No audit types enabled.\``,
                            inline: true,
                        }
                    )

                interaction.editReply({
                    embeds: [rEmbed],
                    components: [auditTypeSSM, loggingChannelCSM, continueBtn],
                })

                let time = 30_000
                const SSMcollector = response.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time,
                })
                const CSMcollector = response.createMessageComponentCollector({
                    componentType: ComponentType.ChannelSelect,
                    time,
                })
                const Btncollector = response.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time,
                })

                SSMcollector.on('collect', async (i) => {
                    rEmbed.data.fields[1].value = `\`${i.values
                        .sort()
                        .join('` `')}\``

                    let enabledAuditTypes = []
                    i.component.options.forEach((o) => {
                        if (i.values.includes(o.value)) {
                            o = new StringSelectMenuOptionBuilder({
                                label: o.label,
                                value: o.value,
                                default: true,
                            })
                        } else {
                            o = new StringSelectMenuOptionBuilder({
                                label: o.label,
                                value: o.value,
                                default: false,
                            })
                        }
                        enabledAuditTypes.push(o)
                    })
                    auditTypeSSM.components[0].options =
                        enabledAuditTypes.slice(-i.component.options.length)

                    interaction.editReply({
                        embeds: [rEmbed],
                        components: [
                            auditTypeSSM,
                            loggingChannelCSM,
                            continueBtn,
                        ],
                    })
                    i.reply({
                        content: `Updated the enabled audit types to: \`${i.values
                            .sort()
                            .join('` `')}\``,
                        ephemeral: true,
                    })

                    SSMcollector.resetTimer()
                    CSMcollector.resetTimer()
                    Btncollector.resetTimer()
                })

                CSMcollector.on('collect', async (i) => {
                    channel.id === i.values[0]
                        ? (rEmbed.data.fields[0].value = `<#${channel.id}> \`(this channel)\``)
                        : (rEmbed.data.fields[0].value = `<#${i.values[0]}>`)

                    interaction.editReply({
                        embeds: [rEmbed],
                        components: [
                            auditTypeSSM,
                            loggingChannelCSM,
                            continueBtn,
                        ],
                    })
                    i.reply({
                        content: `Updated the logging channel to: <#${i.values[0]}>`,
                        ephemeral: true,
                    })

                    SSMcollector.resetTimer()
                    CSMcollector.resetTimer()
                    Btncollector.resetTimer()
                })

                let buttonClicks = 0
                let webhookToDatabase = []
                Btncollector.on('collect', async (i) => {
                    await i.deferReply({ ephemeral: true })

                    const auditTypes =
                        i.message.components[0].components[0].data.options
                    const logChannelId = i.message.embeds[0].fields[0].value
                        .split(' ')[0]
                        .slice(2, -1)

                    const logChannel = guild.channels.cache.get(logChannelId)
                    const channelWebhooks = await logChannel.fetchWebhooks()
                    const clientChannelWebhooks = channelWebhooks.filter(
                        (w) => w.name === client.user.username
                    )

                    let webhookData
                    if (clientChannelWebhooks.size < 1) {
                        const newWebhook = await logChannel.createWebhook({
                            name: client.user.username,
                            avatar: client.user.displayAvatarURL({
                                dynamic: true,
                            }),
                        })

                        webhookData = {
                            channelId: newWebhook.channelId,
                            token: newWebhook.token,
                        }
                    } else {
                        webhookData = {
                            channelId: clientChannelWebhooks.first().channelId,
                            token: clientChannelWebhooks.first().token,
                        }
                    }
                    webhookToDatabase.push(webhookData)

                    let auditToDatabase = []
                    auditTypes.forEach((auditData) => {
                        if (auditData.default === true) {
                            auditData = { name: auditData.value, enabled: true }
                        } else {
                            auditData = {
                                name: auditData.value,
                                enabled: false,
                            }
                        }
                        auditToDatabase.push(auditData)
                    })

                    let newOptions = []
                    let indexStart
                    let indexEnd

                    let auditCategory
                    buttonClicks++

                    switch (buttonClicks) {
                        case 1:
                            auditCategory = 'Emojis, events, stickers & roles'
                            indexStart = 14
                            indexEnd = 26

                            await loggingSchema.findOneAndUpdate(
                                { GuildID: guildId },
                                {
                                    Webhooks: webhookToDatabase,
                                    ChannelLogs: auditToDatabase,
                                }
                            )
                            break
                        case 2:
                            auditCategory = 'Guild members'
                            indexStart = 26
                            indexEnd = 37

                            await loggingSchema.findOneAndUpdate(
                                { GuildID: guildId },
                                {
                                    Webhooks: webhookToDatabase,
                                    GuildLogs: auditToDatabase,
                                }
                            )
                            break
                        case 3:
                            auditCategory = 'Integrations & AutoMod'
                            indexStart = 37
                            indexEnd = 51

                            await loggingSchema.findOneAndUpdate(
                                { GuildID: guildId },
                                {
                                    Webhooks: webhookToDatabase,
                                    MemberLogs: auditToDatabase,
                                }
                            )
                            break
                        case 4:
                            auditCategory = 'Other audit types'
                            indexStart = 51
                            indexEnd = 60

                            await loggingSchema.findOneAndUpdate(
                                { GuildID: guildId },
                                {
                                    Webhooks: webhookToDatabase,
                                    IntegrationLogs: auditToDatabase,
                                }
                            )
                            break
                        case 5:
                            const updatedData =
                                await loggingSchema.findOneAndUpdate(
                                    { GuildID: guildId },
                                    {
                                        Webhooks: webhookToDatabase,
                                        OtherLogs: auditToDatabase,
                                    },
                                    { returnNewDocument: true }
                                )
                            const sEmbed = new EmbedBuilder()
                                .setColor(mConfig.embedColorWarning)
                                .setDescription(
                                    '`⌛` Setting up the channel webhooks...'
                                )
                                .setFooter({
                                    iconURL: `${client.user.displayAvatarURL({
                                        dynamic: true,
                                    })}`,
                                    text: `${client.user.username} - Audit logging system`,
                                })
                            interaction.editReply({
                                embeds: [sEmbed],
                                components: [],
                            })
                            i.editReply({
                                content:
                                    'Saved audit types and logging channel.',
                            })

                            const guildWebhooks = await guild.fetchWebhooks()
                            const clientGulidWebhooks = guildWebhooks.filter(
                                (w) => w.name === client.user.username
                            )
                            let existingWebhookChannels =
                                clientGulidWebhooks.map(
                                    (webhook) => webhook.channelId
                                )

                            let updatedWebhookChannels = []
                            updatedData.Webhooks.forEach((webhookData) => {
                                updatedWebhookChannels.push(
                                    webhookData.channelId
                                )
                            })

                            for (
                                let x = 0;
                                x < existingWebhookChannels.length;
                                x++
                            ) {
                                if (
                                    updatedWebhookChannels.includes(
                                        existingWebhookChannels[x]
                                    )
                                )
                                    continue

                                const removingChannel =
                                    guild.channels.cache.get(
                                        existingWebhookChannels[x]
                                    )
                                const removingChannelWebhooks =
                                    await removingChannel.fetchWebhooks()
                                const removingWebhook = removingChannelWebhooks
                                    .filter(
                                        (w) => w.name === client.user.username
                                    )
                                    .first()

                                await removingWebhook.delete()
                            }

                            sEmbed
                                .setColor(mConfig.embedColorSuccess)
                                .setDescription(
                                    '`✅` Set up all webhooks successfully.'
                                )

                            return interaction.editReply({ embeds: [sEmbed] })
                    }

                    rEmbed
                        .setTitle(`${auditCategory} (${buttonClicks + 1}/5)`)
                        .setDescription(
                            `\`❔\` What audit types related to \`${auditCategory}\` should be logged and in which channel should these be sent to? Please select them in the dropdown menus below.\n\n\`💡\` You can change this anytime using the \`/loggingsystem configure\` command.`
                        )
                        .setColor(mConfig.embedColorWarning)
                        .setFields(
                            {
                                name: 'Logging channel',
                                value: `-`,
                                inline: true,
                            },
                            {
                                name: 'Enabled audit types',
                                value: `\`No audit types enabled.\``,
                                inline: true,
                            }
                        )

                    choices
                        .slice(indexStart, indexEnd)
                        .map((choice) => ({
                            label: choice.event,
                            value: choice.event,
                        }))
                        .forEach((o) => {
                            o = new StringSelectMenuOptionBuilder({
                                label: o.label,
                                value: o.value,
                                default: false,
                            })
                            newOptions.push(o)
                        })

                    channel.id === logChannelId
                        ? (rEmbed.data.fields[0].value = `<#${channel.id}> \`(this channel)\``)
                        : (rEmbed.data.fields[0].value = `<#${logChannelId}>`)

                    auditTypeSSM.components[0].options = newOptions
                    auditTypeSSM.components[0].data.max_values =
                        indexEnd - indexStart

                    interaction.editReply({
                        embeds: [rEmbed],
                        components: [
                            auditTypeSSM,
                            loggingChannelCSM,
                            continueBtn,
                        ],
                        ephemeral: true,
                    })
                    i.editReply({
                        content: 'Saved audit types and logging channel.',
                    })

                    SSMcollector.resetTimer()
                    CSMcollector.resetTimer()
                    Btncollector.resetTimer()
                })

                SSMcollector.on('end', async () => {
                    if (buttonClicks === 5) return
                    const tEmbed = new EmbedBuilder()
                        .setColor(mConfig.embedColorError)
                        .setDescription(
                            `\`❌\` The configuration timed out.\n\n\`💡\` Run \`/loggingsystem configure\` again to start over.`
                        )
                        .setFooter({
                            iconURL: `${client.user.displayAvatarURL({
                                dynamic: true,
                            })}`,
                            text: `${client.user.username} - Audit logging system`,
                        })
                    interaction.editReply({
                        embeds: [tEmbed],
                        components: [],
                        ephemeral: true,
                    })
                })
                break

            case 'remove':
                await interaction.deferReply({ ephemeral: true })

                const removed = await loggingSchema.findOneAndDelete({
                    GuildID: guildId,
                })
                if (removed) {
                    const guildWebhooks = await guild.fetchWebhooks()
                    const clientGulidWebhooks = guildWebhooks.filter(
                        (w) => w.name === client.user.username
                    )
                    clientGulidWebhooks.each(async (webhook) => {
                        await webhook.delete()
                    })

                    rEmbed
                        .setColor(mConfig.embedColorSuccess)
                        .setDescription(
                            `\`✅\` Successfully removed the audit logging system.`
                        )
                } else {
                    rEmbed
                        .setColor(mConfig.embedColorError)
                        .setDescription(
                            `\`❌\` This server isn't configured yet.\n\n\`💡\` Use \`/loggingsystem configure\` to start configuring this server.`
                        )
                }
                return interaction.editReply({ embeds: [rEmbed] })
        }
    },
}

/* 
// --- Channels & messages (14 options)
"ChannelCreate", DONE
  "ChannelDelete", DONE
  "ChannelOverwriteCreate", DONE
  "ChannelOverwriteDelete", DONE
  "ChannelOverwriteUpdate", DONE
  "ChannelUpdate", DONE
  "MessageBulkDelete", DONE
  "MessageDelete", DONE / OPTIONAL EVENT LISTENER
  "MessagePin", DONE
  "MessageUnpin", DONE
  "MessageUpdate",*** / OPTIONAL EVENT LISTENER
  "ThreadCreate", DONE
  "ThreadDelete", DONE
  "ThreadUpdate" DONE

// --- Emojis, events, stickers & roles (12 options)
"EmojiCreate", DONE
  "EmojiDelete", DONE
  "EmojiUpdate", DONE
  "GuildScheduledEventCreate", DONE
  "GuildScheduledEventDelete", DONE
  "GuildScheduledEventUpdate", DONE
  "StickerCreate", DONE
  "StickerDelete", DONE
  "StickerUpdate", DONE
  "RoleCreate", DONE
  "RoleDelete", DONE
  "RoleUpdate" DONE
  
  // --- Guild members (11 options)
  "MemberAdd",*** / OPTIONAL EVENT LISTENER
  "MemberBanAdd", DONE
  "MemberBanRemove", DONE
  "MemberDisconnect", DONE
  "MemberKick", DONE
  "MemberMove", DONE
  "MemberPrune", DONE
  "MemberRemove",*** / OPTIONAL EVENT LISTENER
  "MemberRoleUpdate", DONE
  "MemberUpdate", DONE
  "VoiceStateUpdate"*** / OPTIONAL EVENT LISTENER
  
  // --- Integrations & AutoMod (14 options)
  "ApplicationCommandPermissionUpdate", DONE
  "AutoModerationBlockMessage", DONE
  "AutoModerationFlagToChannel", DONE
  "AutoModerationRuleCreate", DONE
  "AutoModerationRuleDelete", DONE
  "AutoModerationRuleUpdate", DONE
  "AutoModerationUserCommunicationDisabled", DONE
  "BotAdd", DONE
  "IntegrationCreate", DONE
  "IntegrationDelete", DONE
  "IntegrationUpdate", DONE
  "WebhookCreate", DONE
  "WebhookDelete", DONE
  "WebhookUpdate" DONE
  
  // --- Other (9 options)
  "CreatorMonetizationRequestCreated", DONE
  "CreatorMonetizationTermsAccepted", DONE
  "GuildUpdate", DONE
  "InviteCreate", DONE
  "InviteDelete", DONE
  "InviteUpdate", DONE
  "StageInstanceCreate", DONE
  "StageInstanceDelete", DONE
  "StageInstanceUpdate" DONE

  *** Non-official audit log entry type, but included in the logging system using an event listener.
*/
