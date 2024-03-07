const { model, Schema } = require('mongoose')

const premiumUserSchema = new Schema({
    Code: String,
    UserID: String,
})

module.exports = model('premiumuser', premiumUserSchema)
