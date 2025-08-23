const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');
// const config = require('../main_config.json');
module.exports = {
  name: 'active',
  description: 'Use this command to become active.',
  async execute(interaction) {
    const member = interaction.member;
    const guild = interaction.guild;

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

    const nickname = member.nickname || interaction.user.username;

    if (!nickname.includes('(INACTIVE)')) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Not Inactive!')
            .setDescription('You are not inactive.')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true 
      });
    }

    const newNickname = nickname.replace(/\s?\(INACTIVE\)\s?/g, '');

    member.setNickname(newNickname)
      .then(() => {
        const filePath = path.join(__dirname, '..', 'inactive.json');
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          let inactiveList = [];
          if (data) {
            inactiveList = JSON.parse(data);
          }

          const updatedList = inactiveList.filter(userData => userData.userId !== interaction.user.id);

          fs.writeFile(filePath, JSON.stringify(updatedList), 'utf8', (writeErr) => {
            if (writeErr) {
              console.error(writeErr);
              return;
            }

            interaction.reply({
              embeds: [
                new MessageEmbed()
                  .setColor(config.color.green)
                  .setTitle('You are now active!')
                  .setDescription('Successfully marked yourself as active again.')
                  .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                  .setTimestamp()
              ],
              ephemeral: false 
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
              .setDescription('Could not set yourself as active. Please check permissions or try again later.')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ],
          ephemeral: true 
        });
      });
  },
};
