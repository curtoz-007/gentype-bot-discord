const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');

module.exports = {
  name: 'inactive',
  description: 'Mark yourself as inactive.',
  options: [
    {
      name: 'reason',
      type: 'STRING',
      description: 'Reason for being inactive.',
      required: true
    },
    {
      name: 'days_weeks',
      type: 'STRING',
      description: 'Duration unit of inactivity.',
      required: true,
      choices: [
        {
          name: 'Minute',
          value: 'minute'
        },
        {
          name: 'Hour',
          value: 'hour'
        },
        {
          name: 'Day',
          value: 'day'
        },
        {
          name: 'Week',
          value: 'week'
        }
      ]
    },
    {
      name: 'time',
      type: 'INTEGER',
      description: 'Duration of inactivity.',
      required: true
    }
  ],
  async execute(interaction) {
    const allowedChannel = config.inactiveChannel;

    if (interaction.channelId !== allowedChannel) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Command Restricted!')
            .setDescription('This command can only be used in a specific channel.')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const reason = interaction.options.getString('reason');
    const weekMonth = interaction.options.getString('days_weeks');
    const time = interaction.options.getInteger('time');

    const user = interaction.user;
    const guild = interaction.guild;
    const member = guild.members.cache.get(user.id);

    let maxTime;
    if (weekMonth === 'minute') {
      maxTime = 60; // Max minutes if the user chooses 'Minute'
    } else if (weekMonth === 'hour') {
      maxTime = 24; // Max hours if the user chooses 'Hour'
    } else if (weekMonth === 'day') {
      maxTime = 7; // Max days if the user chooses 'Day'
    } else if (weekMonth === 'week') {
      maxTime = 2; // Max weeks if the user chooses 'Week'
    }

    if (time < 1 || time > maxTime) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Invalid Duration!')
            .setDescription(`Please choose a duration between 1 and ${maxTime} ${weekMonth}.`)
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const inactiveTimeMs = calculateInactiveTime(weekMonth, time).ms;
    const inactiveTimeFormatted = calculateInactiveTime(weekMonth, time).formatted;
    const options = { timeZone: 'Asia/Kathmandu', dateStyle: 'short' }; 
    const dateInactive = new Date().toLocaleDateString('en-GB', options); 

    const nickname = member.nickname || user.username;
    const newNickname = `${nickname} (INACTIVE)`;

    member.setNickname(newNickname)
      .then(() => {
        const filePath = path.join(__dirname, '..', 'inactive.json');
        const data = {
          userId: user.id,
          reason,
          inactiveTimeMs,
          inactiveTimeFormatted,
          dateInactive,
        };

        fs.readFile(filePath, 'utf8', (err, existingData) => {
          if (err) {
            console.error(err);
            return;
          }

          let inactiveList = [];
          if (existingData) {
            inactiveList = JSON.parse(existingData);
          }

          inactiveList.push(data);

          fs.writeFile(filePath, JSON.stringify(inactiveList), 'utf8', (writeErr) => {
            if (writeErr) {
              console.error(writeErr);
              return;
            }

            let reminderTimeMs;
            if (weekMonth === 'minute') {
              reminderTimeMs = inactiveTimeMs - 4 * 60 * 1000; 
            } else if (weekMonth === 'hour') {
              reminderTimeMs = inactiveTimeMs - 8 * 60 * 1000; 
            } else if (weekMonth === 'day') {
              reminderTimeMs = inactiveTimeMs - 12 * 60 * 60 * 1000; 
            } else if (weekMonth === 'week') {
              reminderTimeMs = inactiveTimeMs - 2 * 24 * 60 * 60 * 1000; 
            }

            const reminderEmbed = new MessageEmbed()
              .setColor(config.color.blue)
              .setTitle('Inactive Period Reminder')
              .setDescription(`Hello ${user.username}! This is a notification to remind you that your inactive period is ending soon.`)
              .addField('Action Required', 'Please use the /active command to mark yourself as active again if you are returning.')
              .setFooter('Automated Reminder')
              .setTimestamp();

            setTimeout(() => {
              user.send({ embeds: [reminderEmbed] })
                .then(() => console.log('Reminder DM sent successfully'))
                .catch(error => console.error('Error sending reminder DM:', error));
            }, reminderTimeMs);

            interaction.reply({
              embeds: [
                new MessageEmbed()
                  .setColor(config.color.green)
                  .setTitle('You are now inactive!')
                  .setDescription(`Successfully marked yourself as inactive for ${inactiveTimeFormatted} with reason: ${reason}`)
                  .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                  .setTimestamp()
              ]
            });
          });
        });
      })
      .catch(err => {
        console.error(err);
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(config.color.red)
              .setTitle('Error!')
              .setDescription('Could not set yourself as inactive. Please check permissions or try again later.')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ],
          ephemeral: true
        });
      });
  }
};

function calculateInactiveTime(weekMonth, time) {
  const timeUnits = {
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000,
  };

  const ms = time * timeUnits[weekMonth.toLowerCase()];
  return { ms, formatted: `${time} ${weekMonth.toLowerCase()}` };
}
