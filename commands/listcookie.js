const { MessageEmbed } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'listcookie',
    description: 'List available cookie services.',
  async execute(interaction) {
    const cookieFolder = path.join(__dirname, 'Cookies');

    try {
      const files = await fs.readdir(cookieFolder);
      const subfolders = await Promise.all(files.map(async file => {
        const stats = await fs.stat(path.join(cookieFolder, file));
        if (stats.isDirectory()) return file;
      }));

      const validSubfolders = subfolders.filter(folder => folder !== undefined);

      if (validSubfolders.length === 0) {
        return interaction.reply('No cookie services found.');
      }

      const formattedSubfolders = validSubfolders.map(folder => `- **${folder}**`).join('\n');

      const embed = new MessageEmbed()
        .setTitle('Available Cookie Services')
        .setDescription(formattedSubfolders)
        .setColor('#ff0000');

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to access the Cookies folder.');
    }
  },
};
