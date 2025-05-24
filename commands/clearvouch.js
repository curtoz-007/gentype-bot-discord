const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');

const allowedRoleIDs = [config.Owner,config.Coowner,];

// const vouchDataFilePath = path.join(__dirname, '..', 'vouchCounts', 'vouchData.json');

const vouchDataFilePath = path.join('/home/container/vouchCounts', 'vouchData.json');//hosting 
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
  name: 'clearvouch',
  description: 'Reset vouches for a user.',
   
  options: [
    {
        name: 'user',
        type: 'USER',
        description: 'The user to reset vouches for.',
        required: true,
    },
],
  async execute(interaction) {
    if (interaction.channel.id === '1204421801631944724') {
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


      const mentionedUser = interaction.options.get('user').user;

      if (!mentionedUser) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setTitle('Invalid parameters!')
              .setDescription('Please mention a user to clear their vouches.')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      }

      if (!vouchData[mentionedUser.id]) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setTitle('No vouches found!')
              .setDescription(`${mentionedUser} has no vouches to clear.`)
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      }

      vouchData[mentionedUser.id] = {
        vouchCount: 0,
        positiveReviews: 0,
        negativeReviews: 0,
      };

      fs.writeFileSync(vouchDataFilePath, JSON.stringify(vouchData, null, 2), (err) => {
        if (err) {
          console.error('Error writing file:', err);
        }
      });

      const panelMessage = new MessageEmbed()
        .setColor('GREEN')
        .setTitle(`Vouches Reset`)
        .setDescription(`Vouches for ${mentionedUser} have been reset to 0.`)
        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
        .setTimestamp();

      await interaction.reply({ embeds: [panelMessage] });
    } else {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setTitle('Wrong command usage!')
            .setDescription('You cannot use the `clearvouch` command in this channel!')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    }
  },
};
