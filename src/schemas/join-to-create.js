const { Schema, model } = require('mongoose')

const JTCschema = new Schema(
    {
        GuildID: { type: String, required: true },
        Category: { type: String, required: true },
        Channel: { type: String, required: true },
        Channels: [
            {
                ChannelID: { type: String, required: true },
                OwnerID: { type: String, required: true },
                MessageID: { type: String, required: true },
                isLocked: { type: Boolean, default: false },
                participantCount: { type: Number },
                isInvisible: { type: Boolean, default: false },
            },
        ],
    },
    { strict: false }
)

module.exports = model('JTCsetup', JTCschema)
