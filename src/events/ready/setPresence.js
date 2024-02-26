require('colors')
const { ActivityType, Client } = require('discord.js')
const botStatuses = require('../../schemas/botPresence')

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {
    const botStatusesData = await botStatuses.findOne({
      ClientID: client.user.id,
    })

    if (!botStatusesData) {
      await botStatuses.create({
        ClientID: client.user.id,
        Presences: [
          {
            Activity: [
              {
                Name: `in ${client.guilds.cache.size} servers!`,
                Type: ActivityType.Playing,
              },
            ],
            Status: 'online',
          },
        ],
      })
    }

    setInterval(async () => {
      const botStatusesData = await botStatuses.findOne({
        ClientID: client.user.id,
      })
      const presences = botStatusesData.Presences
      const presence = presences[Math.floor(Math.random() * presences.length)]

      client.user.setPresence({
        activities: [
          { name: presence.Activity[0].Name, type: presence.Activity[0].Type },
        ],
        status: presence.Status,
      })
    }, 15_000)
  }
