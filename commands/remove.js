// Dependencies
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');

// Functions
const log = new CatLoggr();

module.exports = {
    name: 'remove', 
    description: 'Remove a service.', 

    async execute(interaction) {
        const serviceOption = interaction.options.getString('service');
        const folderOption = interaction.options.getString('servicefolder');

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
        
        if (!serviceOption || !folderOption) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Missing parameters!')
                        .setDescription('You need to provide both a service name and a folder name!')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        const filePath = `${__dirname}/../${folderOption}/${serviceOption}.txt`;

        fs.unlink(filePath, function (error) {
            if (error) return log.error(error); 
            interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.green)
                        .setTitle('Service removed!')
                        .setDescription(`${serviceOption} service removed from the ${folderOption}!`)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL())
                        .setTimestamp()
                ]
            });
        });
    },
    options: [
        {
            name: 'service',
            description: 'The name of the service to remove.',
            type: 'STRING',
            required: true,
        },
        {
            name: 'servicefolder',
            description: 'The folder containing the service file.',
            type: 'STRING',
            required: true,
        },
    ],
};
