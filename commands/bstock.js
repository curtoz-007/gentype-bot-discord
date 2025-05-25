const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises;
const config = require('../test_config.json');

module.exports = {
  name: 'bstock',
  description: 'Display the service stock (basic)⭐.',
  async execute(interaction) {
    try {
      const stock = [];
      const files = await fs.readdir(`${__dirname}/../bstock/`);
      
      for (const file of files) {
        if (!file.endsWith('.txt')) continue;
        stock.push(file);
      }

      const embed = new MessageEmbed()
        .setColor(config.color.default)
        .setTitle(`${interaction.guild.name} has **${stock.length} services**`)
        .setDescription('');

      for (const data of stock) {
        const acc = await fs.readFile(`${__dirname}/../bstock/${data}`, 'utf-8');
        const lines = acc.split(/\r?\n/).filter(line => line.trim() !== '');

        const serviceName = data.replace('.txt', '');
        const stockCount = lines.length > 0 ? lines.length : 'Out of stock';

        embed.description += `**${serviceName}:** \`${stockCount}\`\n`;
      }

      interaction.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error:', error);
      interaction.channel.send('An error occurred while fetching stock data.');
    }
  }
};
