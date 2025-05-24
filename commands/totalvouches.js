const { MessageEmbed } = require('discord.js');
const config = require('../test_config.json');
const fs = require('fs/promises');
const path = require('path');


const allowedRoles = [
    config.Member,
    config.Owner,
    config.Coowner,
    config.Admin,
    config.Mods,
    config.Headstaff,
    config.SeniorStaff,
    config.JuniorStaff,
    config.TrailStaff
];

// const vouchDataFilePath = path.join(__dirname, '..', 'vouchCounts', 'vouchData.json');
const vouchDataFilePath = '/home/container/vouchCounts/vouchData.json'; //hosting 

module.exports = {
    name: 'totalvouches',
    description: 'Count total vouches for all users.',
    async execute(interaction) {
        const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

        if (!hasAllowedRole) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Insufficient permissions!')
                        .setDescription('You do not have permission to use this command.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        let totalVouches = 0;

        try {
            const vouchData = await fs.readFile(vouchDataFilePath, 'utf-8');
            const usersData = JSON.parse(vouchData);

            for (const userId in usersData) {
                if (usersData[userId].vouchCount) {
                    totalVouches += usersData[userId].vouchCount;
                }
            }
        } catch (error) {
            console.error('Error reading vouch data:', error);
        }

        const panel = new MessageEmbed()
            .setColor(config.color.blue)
            .setTitle('**Total Vouches**')
            .setDescription(`Total vouch counts across all users: ${totalVouches}`)
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp();

        await interaction.reply({ embeds: [panel] });
    },
};
