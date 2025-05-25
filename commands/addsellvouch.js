const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');
const allowedRoleIDs = [config.Coowner, config.Owner];

// const vouchDataFilePath = path.join(__dirname, '..', 'vouchCounts', 'sellerVouch.json');
const vouchDataFilePath = path.join('/home/container/vouchCounts', 'sellerVouch.json'); //hosting site
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
  name: 'addsellvouch',
  description: 'Add seller vouches for a user.',
  options: [
    {
      name: 'user',
      type: 'USER',
      description: 'The seller to add vouches for.',
      required: true,
    },
    {
      name: 'amount',
      type: 'INTEGER',
      description: 'The number of vouches to add.',
      required: true,
    },
  ],
  async execute(interaction) {
    if (interaction.channelId === config.ownerandcoownerChannel) {
      const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoleIDs.includes(role.id));

      if (!hasAllowedRole) {
        return interaction.reply({
          content: 'You do not have permission to use this command.',
          ephemeral: true
        });
      }

      const mentionedUser = interaction.options.getUser('user');
      const vouchAmount = interaction.options.getInteger('amount');

      if (!mentionedUser || isNaN(vouchAmount)) {
        return interaction.reply({
          content: 'Please mention a user and provide a valid vouch amount.',
          ephemeral: true
        });
      }

      if (!vouchData[mentionedUser.id]) {
        vouchData[mentionedUser.id] = {
          sellerVouchCount: 0,
          positiveReviews: 0,
          negativeReviews: 0,
        };
      }

      vouchData[mentionedUser.id].sellerVouchCount += vouchAmount;
      vouchData[mentionedUser.id].positiveReviews += Math.max(vouchAmount, 0);

      fs.writeFileSync(vouchDataFilePath, JSON.stringify(vouchData, null, 2), (err) => {
        if (err) {
          console.error('Error writing file:', err);
        }
      });

      const panelMessage = new MessageEmbed()
        .setColor('GREEN')
        .setTitle(`Vouch added`)
        .setDescription(`Vouches for ${mentionedUser} added by ${Math.abs(vouchAmount)}.`)
        .setTimestamp();

      interaction.reply({ embeds: [panelMessage] });
    } else {
      interaction.reply({
        content: 'You cannot use the `addseller` command in this channel!',
        ephemeral: true
      });
    }
  },
};
