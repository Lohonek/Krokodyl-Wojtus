const { model, Schema } = require('mongoose')

let levelSchema = new Schema(
    {
        GuildID: { type: String, required: true },
        UserID: { type: String, required: true },
        Xp: { type: Number, default: 0 },
        Level: { type: Number, default: 0 },
    },
    {
        strict: false,
    }
)

module.exports = model('levels', levelSchema)
