const { model, Schema } = require('mongoose')

let moderationSchema = new Schema(
  {
    GuildId: String,
    LogChannelID: String,
  },
  { strict: false }
)

module.exports = model('moderation', moderationSchema)
