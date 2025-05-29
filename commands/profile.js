// Dependencies
const { MessageEmbed } = require('discord.js');
const config = require('../test_config.json');
const fs = require('fs');
const path = require('path');

const allowedRoles = [
  config.Owner,
  config.Coowner,
  config.Admin,
  config.Mods,
  config.Headstaff,
  config.SeniorStaff,
  config.JuniorStaff,
  config.TrailStaff,
];

function loadVouchData() {
  try {
    const vouchData = fs.readFileSync(path.join(__dirname, '../vouchCounts/vouchData.json'), 'utf8');
    // const vouchData = fs.readFileSync('/home/container/vouchCounts/vouchData.json', 'utf8'); //hosting site
    return JSON.parse(vouchData);
  } catch (error) {
    return {};
  }
}

function loadDailyVouchData() {
  try {
    const dailyVouchData = fs.readFileSync(path.join(__dirname, '../vouchCounts/dailyvouch.json'), 'utf8');
    // const dailyVouchData = fs.readFileSync(path.join('/home/container/vouchCounts/dailyvouch.json'), 'utf8'); //hosting site
    return JSON.parse(dailyVouchData);
  } catch (error) {
    return {};
  }
}

module.exports = {
  name: 'profile',
  description: "View a user's vouch count and reviews.",
  options: [
    {
      name: 'user',
      type: 'USER',
      description: "View a user's vouch count and reviews",
      required: false,
    }
  ],
  async execute(interaction) {
    const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasAllowedRole) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Insufficient permissions!')
            .setDescription('You do not have permission to use this command.')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    }

    const mentionedUser = interaction.options.getUser('user') || interaction.user;

    const vouchData = loadVouchData();
    const dailyVouchData = loadDailyVouchData();
    const userId = mentionedUser.id.toString();

    if (vouchData[userId]) {
      const userVouchData = vouchData[userId];
      const totalVouches = userVouchData.vouchCount || 0;
      const positiveReviews = userVouchData.positiveReviews || 0;
      const negativeReviews = userVouchData.negativeReviews || 0;

      const userDailyVouches = dailyVouchData[userId] || {};
      const dailyVouches = userDailyVouches.daily || [];
      const threeDayVouches = userDailyVouches['3d'] || [];
      const oneWeekVouches = userDailyVouches['1w'] || [];

      const today = new Date().getTime();
      const threeDaysAgo = today - 3 * 24 * 60 * 60 * 1000;
      const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;

      const last3DaysVouches = threeDayVouches.reduce((total, entry) => {
        const timestamp = new Date(entry.timestamp).getTime();
        return timestamp >= threeDaysAgo ? total + entry.vouches : total;
      }, 0);

      const lastWeekVouches = oneWeekVouches.reduce((total, entry) => {
        const timestamp = new Date(entry.timestamp).getTime();
        return timestamp >= oneWeekAgo ? total + entry.vouches : total;
      }, 0);

      const panel = new MessageEmbed()
        .setColor('#3498db')
        .setTitle(`User Profile: ${mentionedUser.username}`)
        .setDescription('**Vouch and Review Statistics**')
        .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ dynamic: true, size: 32 }))
        .setTimestamp()
        .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true, size: 32 }));

      panel.addField('Total Vouches', String(totalVouches), true);
      panel.addField('Positive Reviews', String(positiveReviews), true);
      panel.addField('Negative Reviews', String(negativeReviews), true);
      panel.addField('Daily Vouches', String(dailyVouches.length > 0 ? dailyVouches[0].vouches : 0), true);
      panel.addField('Vouches from 3 Days', String(last3DaysVouches), true);
      panel.addField('Vouches from 1 Week', String(lastWeekVouches), true);

      interaction.reply({ embeds: [panel] });
    } else {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('User Not Found!')
            .setDescription('No vouch data found for the mentioned user.')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    }
  },
};
