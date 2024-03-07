const {
    SlashCommandBuilder,
    Client,
    ChatInputCommandInteraction,
    EmbedBuilder,
} = require('discord.js')
const userPremiumSchema = require('../../schemas/userpremium')
const premiumKeySchema = require('../../schemas/premiumkey')

const mConfig = require('../../messageConfig.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-premium')
        .setDescription(
            'Check to see if you have an active premium subscription.'
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
        const { user } = interaction

        const rEmbed = new EmbedBuilder()
            .setTitle('TNS | Premium Check')
            .setColor('White')
            .setDescription('Checking if you have premium...')

        await interaction.reply({ embeds: [rEmbed], ephemeral: true })

        const dataUser = await userPremiumSchema.findOne({ UserID: user.id })
        if (!dataUser) {
            rEmbed
                .setTitle('TNS | Premium Check')
                .setColor(mConfig.embedColorError)
                .setDescription('`❌` You are not a premium member.')
                .setFooter({
                    iconURL: `${client.user.displayAvatarURL({
                        dynamic: true,
                    })}`,
                    text: `${client.user.username} - Premium system`,
                })

            setTimeout(() => {
                return interaction.editReply({
                    embeds: [rEmbed],
                    ephemeral: true,
                })
            }, 2_000)
        }
        const dataKey = await premiumKeySchema.findOne({ Code: dataUser.Code })

        rEmbed
            .setTitle('TNS | Premium Check')
            .setDescription('`✅` You are a premium member.')
            .setColor(mConfig.embedColorSuccess)
            .addFields(
                { name: 'Code', value: `||${dataUser.Code}||` },
                {
                    name: 'Valid until',
                    value: `<t:${timeformat(dataKey.DateTag)}>`,
                }
            )
            .setFooter({
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                text: `${client.user.username} - Premium system`,
            })

        setTimeout(() => {
            return interaction.editReply({ embeds: [rEmbed], ephemeral: true })
        }, 2_000)
    },
}

function timeformat(time) {
    const dateNow = Date.now()
    return Math.floor(parseInt(dateNow) / 1000) + time / 1000
}
