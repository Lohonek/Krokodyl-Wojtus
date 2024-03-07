const { model, Schema } = require('mongoose')

const premiumKeySchema = new Schema({
    GeneratedBy: String,
    DateTag: String,
    Code: String,
    Date: String,
    UserID: String,
    Uses: Number,
    CurrentUsage: Number,
})

module.exports = model('premiumkey', premiumKeySchema)
