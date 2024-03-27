const { model, Schema } = require('mongoose')

let levelSetupSchema = new Schema(
    {
        GuildID: { type: String, required: true },
        Channel: String,
        Boost: { type: Number, default: 0 },
        Enabled: { type: Boolean, default: false },
    },
    {
        strict: false,
    }
)

module.exports = model('levelSetup', levelSetupSchema)
