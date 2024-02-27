const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js')
const mongoose = require('mongoose')
const fs = require('fs')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Get bot info or bot stats')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('info')
        .setDescription('Get information about the bot.')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('stats').setDescription('Get the bot status')
    )
    .toJSON(),

  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand()
    if (subcommand === 'info') {
      const { guild } = interaction
      await interaction.deferReply()
      try {
        const discordJsVersion = require('discord.js').version

        const nodeJsVersion = process.version

        const mongoDbVersion = mongoose.version
        const activeCommands = await guild.commands.fetch()
        const activeCommandCount = activeCommands.size
        const embed = new EmbedBuilder()
          .setAuthor({
            name: 'Bot Info',
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
          })
          .addFields(
            {
              name: `\`🤖\`** | DJS Version:**`,
              value: `> [*${discordJsVersion}*](https://discord.js.org/docs/packages/discord.js/14.14.1)`,
              inline: true,
            },
            {
              name: `\`🚀\`** | NodeJs Version:**`,
              value: `> [*${nodeJsVersion}*](https://nodejs.org/dist/latest-v20.x/docs/api/)`,
              inline: true,
            },
            {
              name: `\`🗄️\`** | Database Version:**`,
              value: `> [*${mongoDbVersion}*](https://docs.mongodb.com/drivers/node/)`,
              inline: true,
            },
            {
              name: `\`🧑‍💻\`** | Developer:**`,
              value: `> \`nyku\``,
              inline: true,
            },
            {
              name: `\`🗓️\`** | Created:**`,
              value: `> \`14/02/2024\``,
              inline: true,
            },
            {
              name: `\`⚙️\`** | Version:**`,
              value: `> \`0.0.1\``,
              inline: true,
            }
          )
          .setColor('Fuchsia')
          .setTimestamp()
          .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: `${interaction.user.displayAvatarURL({
              dynamic: true,
            })}`,
          })

        await interaction.editReply({ embeds: [embed] })
      } catch (error) {
        console.log(`An error occured in the bot-info command:\n\n${error}`)
      }
    }
    if (subcommand === 'stats') {
      try {
        const startTime = Date.now()

        const placeEmbed = new EmbedBuilder()
          .setTitle('Fetching...')
          .setColor('Fuchsia')

        await interaction.reply({ embeds: [placeEmbed] })

        const latency = await client.ws.ping
        const restLatency = Date.now() - startTime
        const uptime = new Date(Date.now() - client.uptime)

        function formatBytes(bytes) {
          const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
          if (bytes === 0) return '0 Byte'
          const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
          const result = (bytes / Math.pow(1024, i)).toFixed(2)

          if (isNaN(result)) {
            console.log('Error: Result is NaN. Bytes:', bytes)
            return 'Error'
          }

          return result + ' ' + sizes[i]
        }

        async function getDirectorySize(path) {
          const calculateSize = async (currentPath) => {
            let totalSize = 0
            const files = fs.readdirSync(currentPath)

            for (const file of files) {
              const filePath = `${currentPath}/${file}`
              const stats = fs.statSync(filePath)

              if (stats.isDirectory()) {
                totalSize += await calculateSize(filePath)
              } else {
                totalSize += stats.size
              }
            }

            return totalSize
          }

          return await calculateSize(path)
        }
        const projectDirectoryPath =
          'C:\\Users\\nyku\\Documents\\GitHub\\Krokodyl-Wojtus'
        const projectSize = await getDirectorySize(projectDirectoryPath)

        const embed = new EmbedBuilder()
          .setAuthor({
            name: 'Bot Status',
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
          })
          .addFields(
            {
              name: `\`🔌\`** | WebSocket:**`,
              value: `> *\`${latency} m/s\`*`,
              inline: true,
            },
            {
              name: `\`🌍\`** | REST:**`,
              value: `> *\`${restLatency} m/s\`*`,
              inline: true,
            },
            {
              name: `\`📈\`** | UpTime:**`,
              value: `> ${time(uptime, 'R')}`,
              inline: true,
            },
            {
              name: `\`💻\`** | CPU:**`,
              value: `> *\`${(process.cpuUsage().system / 1024 / 1024).toFixed(
                2
              )}%\`*`,
              inline: true,
            },
            {
              name: `\`💽\`** | RAM:**`,
              value: `> *\`${(
                process.memoryUsage().heapUsed /
                1024 /
                1024
              ).toFixed(2)}MB\`*`,
              inline: true,
            },
            {
              name: `\`🗃️\`** | Storage:**`,
              value: `> *\`${formatBytes(projectSize)}\`*`,
              inline: true,
            }
          )
          .setColor('Fuchsia')
          .setTimestamp()
          .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
          })

        await interaction.editReply({ embeds: [embed] })
      } catch (error) {
        console.log(`An error occured in the bot-status command:\n\n${error}`)
      }
    }
  },
}
