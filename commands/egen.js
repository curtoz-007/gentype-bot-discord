const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');

const log = new CatLoggr();
const generated = new Set(); 
const usedCodes = new Set(); 

let cooldowns = {};

function loadCooldowns() {
  try {
    const data = fs.readFileSync('./cooldownData.json', 'utf-8');
    cooldowns = JSON.parse(data);
  } catch (error) {
    cooldowns = {}; 
  }
}

function saveCooldowns() {
  fs.writeFileSync('./cooldownData.json', JSON.stringify(cooldowns, null, 2), 'utf-8');
}

loadCooldowns();

module.exports = {

  name: 'egen',
  description: 'Generate a specified service if stocked (Extreme).',
  options: [
      {
          name: 'service',
          type: 'STRING',
          description: 'The service to generate.',
          required: true,
          choices: [
              {
                  name: 'Canvas',
                  value: 'canva'
              },
              {
                  name: 'Crunchyroll',
                  value: 'crunchyroll-fa'
              },
              {
                  name: 'Linkvertise-fa',
                  value: 'linkvertise-fa'
              },
              {
                  name: 'Microsoft365',
                  value: 'microsoft365'
              },
              {
                  name: 'Netflix',
                  value: 'netflixaccount'
              },
              {
                  name: 'spotify',
                  value: 'spotify'
              },
              {
                  name:'Yt premium',
                  value:'yt-premium'
              }
          ]
      }
  ],
  async execute(interaction) {
    const { member, channelId } = interaction;

    try {
      interaction.client.channels.cache.get(config.egenChannel).id; 
    } catch (error) {
      if (error) log.error(error); 

      if (config.command.error_message === true) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(config.color.red)
              .setTitle('Error occurred!')
              .setDescription('Not a valid gen channel specified!')
              .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      } else return;
    }

    if (channelId === config.egenChannel) {
      // Check if the user has one of the specified roles exempt from cooldown
      const userRoles = member.roles.cache;
      const exemptRoles = [
        config.Owner,
        config.Coowner,
        config.Admin,
        config.Mods,
        '1208803670196625458'
      ];
      const hasExemptRole = exemptRoles.some(roleId => userRoles.has(roleId));

      const cooldownTime = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

      if (cooldowns.hasOwnProperty(member.id) && !hasExemptRole) {
        const cooldownData = cooldowns[member.id];
        const cooldownExpirationTime = cooldownData.expirationTime;
        const remainingTime = cooldownExpirationTime - Date.now();

        if (remainingTime > 0) {
          const days = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
          const hours = Math.floor((remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Cooldown!')
                .setDescription(`Please wait **(${days} days) (${hours} hours) (${minutes} minutes)** before executing the command again!`)
                .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            ]
          });
        } else {
          delete cooldowns[member.id];
          saveCooldowns(); 
        }
      }

      const service = interaction.options.getString('service');

      if (!service) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(config.color.red)
              .setTitle('Missing parameters!')
              .setDescription('You need to give a service name!')
              .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      }

      const filePath = `${__dirname}/../estock/${service}.txt`;

      fs.readFile(filePath, 'utf-8', function (error, data) {
        if (!error) {
          const lines = data.split('\n').filter(line => line.trim() !== '');

          if (lines.length === 0) {
            return interaction.reply({
              embeds: [
                new MessageEmbed()
                  .setColor(config.color.red)
                  .setTitle('Generator error!')
                  .setDescription(`I do not find the \`${service}\` service in my stock!`)
                  .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
                  .setTimestamp()
              ]
            });
          }

          let selectedCode = lines[Math.floor(Math.random() * lines.length)];

          while (usedCodes.has(selectedCode)) {
            selectedCode = lines[Math.floor(Math.random() * lines.length)];
          }

          const messageToSend = new MessageEmbed()
            .setColor(config.color.green)
            .setTitle('Account Generated')
            .addField('Service', `\`${service[0].toUpperCase()}${service.slice(1).toLowerCase()}\``, true)
            .addField(
              'Info',
              `For the ${service} account, please follow these instructions:\n` +
              `Send your Email and Pass using the slash command: **/submitaccount ${service[0].toLowerCase()}${service.slice(1)}**`
            );

          member.send({ embeds: [messageToSend] });

          cooldowns[member.id] = {
            expirationTime: Date.now() + cooldownTime,
            generatedService: service, 
          };

          saveCooldowns();

          usedCodes.add(selectedCode);

          lines.splice(lines.indexOf(selectedCode), 1); 
          const updatedData = lines.join('\n'); 

          fs.writeFile(filePath, updatedData, 'utf-8', function (error) {
            if (error) {
              console.error(error);
            }
          });

          interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(config.color.green)
                .setTitle('Account generated successfully!')
                .setDescription(`Check your private messages for the generated ${service} account information!`)
                .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            ]
          });
        } else {
          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Generator error!')
                .setDescription(`Service \`${service}\` does not exist!`)
                .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            ]
          });
        }
      });
    } else {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Wrong command usage!')
            .setDescription(`You cannot use the \`gen\` command in this channel! Try it in <#${config.egenChannel}>!`)
            .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    }
  }
};
