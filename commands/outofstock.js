// Dependencies
const { MessageEmbed, Message } = require('discord.js');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');


const log = new CatLoggr();

module.exports = {
  name: 'less', 
  description: 'Remove an account from a service.', 
  async execute(message, args) {
    const service = args[0];
    const amount = parseInt(args[1]);
    const stockFolder = args[2];

    const allowedRoles = [config.Owner, config.Coowner,config.Admin]; 
    const hasAllowedRole = message.member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasAllowedRole) {
      return message.channel.send(
        new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Permission Denied!')
          .setDescription('You do not have the required roles to use this command.')
          .setFooter(message.author.tag, message.author.displayAvatarURL())
          .setTimestamp()
      );
    }

    if (!service || isNaN(amount) || !stockFolder) {
      return message.channel.send(
        new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Missing parameters!')
          .setDescription('You need to specify a service, an amount, and a stock folder!')
          .addField('For example', `${config.prefix}${this.name} netflix 10 fstock`)
          .setFooter(message.author.tag, message.author.displayAvatarURL())
          .setTimestamp()
      );
    }

    const filePath = path.join(__dirname, '..', stockFolder, `${service}.txt`);

    try {
      const existingContent = await fs.readFile(filePath, 'utf8');

      const codesToRemove = existingContent.split(os.EOL).slice(0, amount).join(os.EOL);
      const remainingCodes = existingContent.split(os.EOL).slice(amount).join(os.EOL);

      await fs.writeFile(filePath, remainingCodes);

      const reply = await message.channel.send(
        new MessageEmbed()
          .setColor(config.color.green)
          .setTitle('Codes removed!')
          .setDescription(`Successfully removed ${amount} codes from the ${service} stock!`)
          .setFooter(message.author.tag, message.author.displayAvatarURL())
          .setTimestamp()
      );
      reply.delete({ timeout: 5000 });
    } catch (error) {
      log.error(error);
      message.channel.send('An error occurred while removing codes.');
    }
  }
};
