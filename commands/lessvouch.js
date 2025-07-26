const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json')
const allowedRoleIDs = [config.Owner, config.Coowner];

// const vouchDataFilePath = path.join(__dirname, '..', 'vouchCounts', 'vouchData.json');

const vouchDataFilePath = path.join('/home/container/vouchCounts', 'vouchData.json'); //hosting vouch

function loadVouchData(filePath) {
  try {
    const data = require(filePath);
    return data;
  } catch (error) {
    return {};
  }
}

const vouchData = loadVouchData(vouchDataFilePath);

module.exports = {
  name: 'lessvouch',
  description: 'Reduce vouches for a user.',
  options: [
    {
      name: 'user',
      type: 'USER',
      description: 'The user to reduce vouches for.',
      required: true,
    },
    {
      name: 'amount',
      type: 'INTEGER',
      description: 'The number of vouches to reduce.',
      required: true,
    },
  ],
  async execute(interaction) {
    if (interaction.channelId === config.ownerandcoownerChannel) {
      const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoleIDs.includes(role.id));

      if (!hasAllowedRole) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setTitle('Insufficient permissions!')
              .setDescription('You do not have permission to use this command.')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      }

      const mentionedUser = interaction.options.getUser('user');
      const vouchAmount = interaction.options.getInteger('amount');

      if (!mentionedUser || isNaN(vouchAmount)) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setTitle('Invalid parameters!')
              .setDescription('Please mention a user and provide a valid vouch amount.')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      }

      if (!vouchData[mentionedUser.id]) {
        vouchData[mentionedUser.id] = {
          vouchCount: 0,
          positiveReviews: 0,
          negativeReviews: 0,
        };
      }

      const reducedVouchAmount = Math.abs(vouchAmount) * -1;

      vouchData[mentionedUser.id].vouchCount += reducedVouchAmount;
      vouchData[mentionedUser.id].positiveReviews += Math.max(reducedVouchAmount, 0);

      fs.writeFileSync(vouchDataFilePath, JSON.stringify(vouchData, null, 2), (err) => {
        if (err) {
          console.error('Error writing file:', err);
        }
      });

      const panelMessage = new MessageEmbed()
        .setColor('GREEN')
        .setTitle(`Vouch reduced`)
        .setDescription(`Vouches for ${mentionedUser} reduced by ${Math.abs(vouchAmount)}.`)
        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
        .setTimestamp();

      await interaction.reply({ embeds: [panelMessage] });
    } else {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setTitle('Wrong command usage!')
            .setDescription('You cannot use the `lessvouch` command in this channel!')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    }
  },
};
