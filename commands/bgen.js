// Dependencies
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');

// Functions
const log = new CatLoggr();
const generated = new Set();
const usedCodes = new Set();
let cooldowns = {};

function loadCooldowns() {
  try {
    const data = fs.readFileSync('./basiccooldown.json', 'utf-8');
    cooldowns = JSON.parse(data);
  } catch (error) {
    cooldowns = {};
  }
}

function saveCooldowns() {
  fs.writeFileSync('./basiccooldown.json', JSON.stringify(cooldowns, null, 2), 'utf-8');
}

loadCooldowns();

module.exports = {
  name: 'bgen',
  description: 'Generate a specified service if stocked (Basic).',
  options: [
    {
      name: 'service',
      type: 'STRING',
      description: 'The service to generate.',
      required: true,
      choices: [
        {
          name: '1k tiktok views',
          value: '1k-tiktok-views'
        },
        {
          name: 'crunchyroll',
          value: 'crunchyroll'
        },
        {
          name: 'custom-gif',
          value: 'cutom-gif'
        },
        {
          name: 'disney+',
          value: 'disney+'
        },
        {
          name: 'nordvpn',
          value: 'nordvpn'
        },
          {
          name: 'steam',
          value: 'steam'
        }
      ]
    }
  ],

  async execute(interaction, client) {
    try {
      interaction.client.channels.cache.get(config.bgenChannel).id;
    } catch (error) {
      if (error) log.error(error);

      if (config.command.error_message === true) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(config.color.red)
              .setTitle('Error occurred!')
              .setDescription('Not a valid gen channel specified!')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      } else return;
    }

    if (interaction.channelId === config.bgenChannel) {
      const userRoles = interaction.member.roles.cache;
      const exemptRoles = [
        config.Owner,
        config.Coowner,
        config.Admin,
        config.Mods,
        '1208803670196625458'
      ];

      const hasExemptRole = exemptRoles.some(roleId => userRoles.has(roleId));

      if (cooldowns.hasOwnProperty(interaction.user.id) && !hasExemptRole) {
        const cooldownExpirationTime = cooldowns[interaction.user.id];
        const remainingTime = cooldownExpirationTime - Date.now();

        if (remainingTime > 0) {
          const hoursRemaining = Math.floor(remainingTime / (60 * 60 * 1000));
          const minutesRemaining = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Cooldown!')
                .setDescription(`Please wait ${hoursRemaining} hour(s) and ${minutesRemaining} minute(s) before executing that command again!`)
                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            ]
          });
        } else {
          delete cooldowns[interaction.user.id];
          saveCooldowns();
        }
      }

      const service = interaction.options.getString('service').toLowerCase();

      if (!service) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(config.color.red)
              .setTitle('Missing parameters!')
              .setDescription('You need to give a service name!')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      }

      const filePath = `${__dirname}/../bstock/${service}.txt`;

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
                  .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                  .setTimestamp()
              ]
            });
          }

          let selectedCode = lines[Math.floor(Math.random() * lines.length)];

          while (usedCodes.has(selectedCode)) {
            selectedCode = lines[Math.floor(Math.random() * lines.length)];
          }

          interaction.user.send({
            embeds: [
              new MessageEmbed()
                .setColor(config.color.green)
                .setTitle('CODE GENERATED')
                .addField('Code generated for', `\`${service[0].toUpperCase()}${service.slice(1).toLowerCase()}\``, true)
                .addField('Here is your code:', '```\n' + selectedCode + '\n```', true)
                .addField(
                  'Verification Instructions',
                  'Please click the link provided below, wait for a few seconds, then open the form and keep your Discord username there.\n' +
                  '**Link:** [Verification Link](https://kajilinks.com/verify)'  
                )
                .setFooter('Generated by Chonk G3N')
                .setTimestamp()
            ]
          });

          usedCodes.add(selectedCode);

          interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(config.color.green)
                .setTitle('Account generated successfully!')
                .setDescription(`Check your private messages for the generated account information!`)
                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            ]
          });

          if (!hasExemptRole) {
            const cooldownTime = 1.5 * 60 * 60 * 1000;
            cooldowns[interaction.user.id] = Date.now() + cooldownTime;
            saveCooldowns();
          }
        } else {
          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Generator error!')
                .setDescription(`Service \`${service}\` does not exist!`)
                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
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
            .setDescription(`You cannot use the \`gen\` command in this channel! Try it in <#${config.bgenChannel}>!`)
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    }
  }
};
