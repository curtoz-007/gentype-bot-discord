const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');

const log = new CatLoggr();

module.exports = {
  name: 'add',
  description: 'Add an account to a service.',
  options: [
    {
      name: 'service',
      description: 'The service to add the account to.',
      type: 'STRING',
      required: true,
    },
    {
      name: 'amount',
      description: 'The number of accounts to add.',
      type: 'INTEGER',
      required: true,
    },
    {
      name: 'stockfolder',
      description: 'The stock folder to add accounts to.',
      type: 'STRING',
      required: true,
    },
  ],
  async execute(interaction) {
    const service = interaction.options.getString('service');
    const amount = interaction.options.getInteger('amount');
    const stockFolder = interaction.options.getString('stockfolder');

    const allowedRoles = [config.Coowner, config.Owner];
    const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasAllowedRole) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Permission Denied!')
          .setDescription('You do not have the required roles to use this command.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    if (!service || isNaN(amount) || !stockFolder) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Missing parameters!')
          .setDescription('You need to specify a service, an amount, and a stock folder!')
          .addField('For example', `${config.prefix}${this.name} netflix 10 fstock`)
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    const folderPath = path.join(__dirname, '..', stockFolder);
    const filePath = path.join(folderPath, `${service}.txt`);

    try {

      await fs.mkdir(folderPath, { recursive: true });

      await fs.writeFile(filePath, '', { flag: 'a' });

      const generatedCodes = Array.from({ length: amount }, generateRandomString);

      const existingContent = await fs.readFile(filePath, 'utf8');
      const combinedContent = generatedCodes.join(os.EOL) + (existingContent ? os.EOL + existingContent : '');
      await fs.writeFile(filePath, combinedContent);

      interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.green)
          .setTitle('Codes added!')
          .setDescription(`Successfully added ${amount} codes to the ${service} stock!`)
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL())
          .setTimestamp()]
      }).then(() => {
        setTimeout(() => interaction.deleteReply(), 5000);
      });
    } catch (error) {
      log.error(error);
      interaction.reply('An error occurred while adding codes.');
    }
  }
};

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
}
