const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
    Client,
    ChatInputCommandInteraction,
} = require('discord.js')
const canvacord = require('canvacord')
const User = require('../../schemas/levels')
const mConfig = require('../../messageConfig.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Gets the rank of a server member or your own.')
        .addUserOption((opt) =>
            opt
                .setName('user')
                .setDescription('The user to get the rank of.')
                .setRequired(false)
        )
        .setDMPermission(false)
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { options, guild, guildId: GuildID } = interaction
        await interaction.deferReply()

        const givenMember = options.getMember('user') || interaction.user
        const member = guild.members.cache.get(givenMember.id)
        const UserID = member.id
        let user = await User.findOne({
            GuildID,
            UserID,
        })

        if (!user) {
            const embed = new EmbedBuilder()
                .setDescription(`This user has no data`)
                .setColor(mConfig.embedColorError)
            return await interaction.followUp({ embeds: [embed] })
        } else {
            const currentLevel = parseInt(
                (1 + Math.sqrt(1 + (8 * user.Xp) / 300)) / 2
            )
            const nextLevel = currentLevel + 1
            const xpRequiredForNextLevel = Math.ceil(
                (nextLevel * (nextLevel - 1) * 300) / 2
            )

            const rank = new canvacord.Rank()
                .setAvatar(member.user.displayAvatarURL())
                .setCurrentXP(user.Xp)
                .setLevel(user.Level)
                .setRank(0, 0, false)
                .setRequiredXP(xpRequiredForNextLevel)
                .setStatus('online')
                .setProgressBar('#75ff7e', 'COLOR')
                .setUsername(member.user.username)
                .setDiscriminator('0000')
                .setBackground(
                    'IMAGE',
                    'https://wallpapertag.com/wallpaper/full/e/c/6/477550-most-popular-hubble-ultra-deep-field-wallpaper-1920x1200.jpg'
                )

            const card = await rank.build()
            const attachment = new AttachmentBuilder(card, { name: 'rank.png' })

            const rEmbed = new EmbedBuilder()
                .setColor(mConfig.embedColorSuccess)
                .setDescription(`${member.user.globalName}`)
                .setImage('attachment://rank.png')

            return interaction.editReply({
                embeds: [rEmbed],
                files: [attachment],
            })
        }
    },
}
