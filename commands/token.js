const { MessageEmbed } = require('discord.js');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');

const connection = mysql.createPool({
  host: '116.202.80.93',
  user: 'u173_65chR9Uhqj',
  password: 'Am523Pd^oxnkYU^puiC5eJ7@',
  database: 's173_Chonk',
});

module.exports = {
  name: 'token',
  description: 'Generate and send a token to the user\'s DM.',
  async execute(interaction) {
    const allowedChannelId = config.tokenChannel; 
    const allowedRoleId = config.CheckerAccess; 

    try {
      if (!interaction.guild || interaction.user.bot) return;

      if (interaction.channelId !== allowedChannelId) return;

      if (!interaction.member.roles.cache.has(allowedRoleId)) {
        return interaction.reply({
            embeds: [
              {
                color: config.color.red,
                title: 'Permission Denied',
                description: 'You do not have permission to use this command.',
                footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
                timestamp: new Date(),
              },
            ],
          });
      }

    

      const generatedToken = generateRandomToken(12);
      const formattedToken = formatToken(generatedToken, 3);

      await connection.execute('INSERT INTO tokens (token) VALUES (?)', [formattedToken]);

      const embed = new MessageEmbed()
        .setColor(0x00FFFF)
        .setDescription('Token Sent In Your DM');

        const sentEmbed = await interaction.reply({ embeds: [embed] });


      const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
      const dmEmbed = new MessageEmbed()
        .setColor(0x00FFFF)
        .setTitle('Here is your token')
        .addFields(
          { name: 'Copy this token', value: '```\n' + formattedToken + '\n```' }
        )
        .setFooter(`This token will expire in ${formatTimeLeft(expirationTime)}`);

      const dmMessage = await interaction.user.send({ embeds: [dmEmbed] });

      setTimeout(async () => {
        try {
          await connection.execute('DELETE FROM tokens WHERE token = ?', [formattedToken]);
         

          const expiredEmbed = new MessageEmbed()
            .setColor(0x000000)
            .setDescription('Token Expired');

          await dmMessage.edit({ embeds: [expiredEmbed] });
        } catch (err) {
          console.error('Error deleting token:', err);
        }
      }, 5 * 60 * 1000);

      console.log('Token command executed');
    } catch (error) {
      console.error('Error in token command:', error);
      interaction.reply('There was an error processing your command.');
    }
  },
};

function generateRandomToken(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

function formatToken(token, interval) {
  const chunks = [];
  for (let i = 0; i < token.length;  i+= interval) {
    chunks.push(token.slice(i, i + interval));
  }
  return chunks.join('-');
}

function formatTimeLeft(expirationTime) {
  const now = new Date();
  const timeLeft = expirationTime - now;
  const minutes = Math.floor(timeLeft / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
  return `${minutes} minutes and ${seconds} seconds`;
}
