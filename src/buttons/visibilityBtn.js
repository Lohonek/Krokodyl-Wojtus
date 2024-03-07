const generateEmbed = require("../utils/join-to-create/generateEmbed");
const generateRow = require("../utils/join-to-create/generateRow");
const JTCschema = require("../schemas/join-to-create");
const { ButtonInteraction, Client } = require("discord.js");

module.exports = {
    customId: "visibilityBtn",
    userPermissions: [],
    botPermissions: [],
    /**
     *
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    run: async (client, interaction) => {
        const config = await JTCschema.findOne({ GuildID: interaction.guild.id });
        const channelConfig = config?.Channels.find(
            (channel) => channel.ChannelID === interaction.channelId
        );

        const { MessageID, isInvisible, ChannelID } = channelConfig;
        const channel = client.channels.cache.get(ChannelID);
        const originalMessage = await channel.messages.fetch(MessageID);

        if (isInvisible) {
            await interaction.channel.permissionOverwrites.edit(
                interaction.guild.roles.everyone,
                {
                    ViewChannel: true,
                }
            );
            await interaction.channel.permissionOverwrites.edit(interaction.user, {
                ViewChannel: true,
            });

            channelConfig.isInvisible = false;
            await config.save().catch((err) => console.log(err));

            await originalMessage.edit({
                embeds: [generateEmbed(channelConfig)],
                components: [generateRow(channelConfig)],
            });
            await interaction.reply({
                content: "`✅` Made channel visible Successfully!",
                ephemeral: true,
            });
        } else {
            await interaction.channel.permissionOverwrites.edit(
                interaction.guild.roles.everyone,
                {
                    ViewChannel: false,
                }
            );
            await interaction.channel.permissionOverwrites.edit(interaction.user, {
                ViewChannel: true,
            });

            channelConfig.isInvisible = true;
            await config.save().catch((err) => console.log(err));

            await originalMessage.edit({
                embeds: [generateEmbed(channelConfig)],
                components: [generateRow(channelConfig)],
            });
            await interaction.reply({
                content: "`✅` Made channel invisible Successfully!",
                ephemeral: true,
            });
        }
    },
};
