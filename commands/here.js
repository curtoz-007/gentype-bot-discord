const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json')

const hereCooldownDuration = 86400000;

// const hereCooldownFilePath = path.join('/home/container', 'hereCooldown.json'); //hosting site path 
const hereCooldownFilePath = path.join(__dirname, '..', 'herecooldown.json');

function loadHereCooldownData(filePath) {
    try {
      const data = require(filePath);
      return data;
    } catch (error) {
      console.error("Error loading cooldown data:", error);
      return {};
    }
  }
  
const hereCooldownData = loadHereCooldownData(hereCooldownFilePath);

module.exports = {
  name: 'here',
  description: 'Ping @here and display a success message (once per day per user) in a specific category.',
  
  execute(interaction) {
    const specifiedCategoryName = 'Marketplace';
    const isCorrectCategory = interaction.channel.parent && interaction.channel.parent.name.toLowerCase() === specifiedCategoryName.toLowerCase();
    const exemptRoles = [
      config.Owner,
      config.Coowner,
      config.MarketPlaceSeller,
      config.Admin,
        ];
      if (
          interaction.member &&
          exemptRoles.some(roleId => interaction.member.roles.cache.has(roleId)) &&
          isCorrectCategory
      ){
      const lastUsage = hereCooldownData[interaction.user.id] || 0;
      const currentTime = Date.now();

      if (currentTime - lastUsage >= hereCooldownDuration) {
        hereCooldownData[interaction.user.id] = currentTime;
        fs.writeFileSync(hereCooldownFilePath, JSON.stringify(hereCooldownData, null, 2));

        interaction.channel.send('@here');


        interaction.reply({
            embeds : [new MessageEmbed()
            .setColor('GREEN')
            .setTitle('PING SUCCESSFUL')
            .setDescription('You have Pinged for the day!!')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()]
        });

      } else {
        const remainingCooldown = hereCooldownDuration - (currentTime - lastUsage);
        const remainingHours = Math.floor(remainingCooldown / 3600000);
        const remainingMinutes = Math.ceil((remainingCooldown % 3600000) / 60000);

        interaction.reply({
            embeds: [new MessageEmbed()
              .setColor('RED')
              .setTitle('Cooldown!')
              .setDescription(`Please wait ${remainingHours} hours and ${remainingMinutes} minutes before using the \`here\` command again!`)
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()]
          });
          
      }
    } else {
        interaction.reply({
            embeds: [new MessageEmbed()
              .setColor('RED')
              .setTitle('Invalid Usage!')
              .setDescription('You do not have the required role or the command can only be used in a specific category.')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()]
          });
          
    }
  },
};
