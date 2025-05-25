// Dependencies
const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises; // Using promises for file system operations
const config = require('../test_config.json');

module.exports = {
    name: 'stock',
    description: 'Display the service stock.',
    async execute(interaction) {
        try {
            const isFileEmpty = async (filePath) => {
                const content = await fs.readFile(filePath, 'utf-8');
                return content.trim() === '';
            };


            const freeStockFiles = await fs.readdir(`${__dirname}/../fstock`);
            const basicStockFiles = await fs.readdir(`${__dirname}/../bstock`);
            const premiumStockFiles = await fs.readdir(`${__dirname}/../pstock`);
            const extremeStockFiles = await fs.readdir(`${__dirname}/../estock`);


            const embed = new MessageEmbed()
                .setColor('#00FFFF')
                .setTitle('Chonk G3N Has Following Services');

            const freeStockField = await Promise.all(freeStockFiles.map(async (file) => {
                const filePath = `${__dirname}/../fstock/${file}`;
                return (await isFileEmpty(filePath)) ? `${file.replace('.txt', '')} (Out of stock)` : file.replace('.txt', '');
            }));
            embed.addField('**Free Stock**', freeStockField.join('\n') || 'No services available');

            const basicStockField = await Promise.all(basicStockFiles.map(async (file) => {
                const filePath = `${__dirname}/../bstock/${file}`;
                return (await isFileEmpty(filePath)) ? `${file.replace('.txt', '')} (Out of stock)` : file.replace('.txt', '');
            }));
            embed.addField('**Basic Stock**', basicStockField.join('\n') || 'No services available');

            const premiumStockField = await Promise.all(premiumStockFiles.map(async (file) => {
                const filePath = `${__dirname}/../pstock/${file}`;
                return (await isFileEmpty(filePath)) ? `${file.replace('.txt', '')} (Out of stock)` : file.replace('.txt', '');
            }));
            embed.addField('**Premium Stock**', premiumStockField.join('\n') || 'No services available');

            const extremeStockField = await Promise.all(extremeStockFiles.map(async (file) => {
                const filePath = `${__dirname}/../estock/${file}`;
                return (await isFileEmpty(filePath)) ? `${file.replace('.txt', '')} (Out of stock)` : file.replace('.txt', '');
            }));
            embed.addField('**Extreme Stock**', extremeStockField.join('\n') || 'No services available');

            embed.setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ dynamic: true }));

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error:', error);
            interaction.reply('An error occurred while fetching the service stock.');
        }
    }
};
