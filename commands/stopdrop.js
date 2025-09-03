const { MessageEmbed } = require('discord.js');
const config = require('../test_config.json');
const fs = require('fs');
const dropState = require('./dropState');

function loadData() {
    try {
        const data = fs.readFileSync(__dirname + '/dropcooldown.json', 'utf8');
        const parsedData = JSON.parse(data);
        dropState.updateDropStateAndCooldown(parsedData.dropInProgress, parsedData.dropCooldown || 0);
        return parsedData;
    } catch (err) {
        console.error('Error loading data:', err);
        return { dropInProgress: false, dropCooldown: 0 };
    }
}

function saveData() {
    const dataToSave = {
        dropInProgress: dropState.getDropInProgress(),
        dropCooldown: dropState.getDropCooldown(),
    };
    fs.writeFileSync(__dirname + '/dropcooldown.json', JSON.stringify(dataToSave, null, 2), 'utf8');
}

module.exports = {
    name: 'stopdrop',
    description: 'Stop the ongoing code drop.',
    execute(interaction) {
        const loadedData = loadData(); 

        const allowedRoles = [config.JuniorStaff];
        const allowedChannelId = config.dropChannel;

        const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));
        const isAllowedChannel = interaction.channel.id === allowedChannelId;

        if (!hasAllowedRole || !isAllowedChannel) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Permission Denied!')
                        .setDescription('You do not have the required roles or the command is not allowed in this channel.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        if (!loadedData.dropInProgress) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('No Drop in Progress!')
                        .setDescription('There is no ongoing drop to stop.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        dropState.setDropInProgress(false);
        saveData();

        return interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle('Drop Stopped!')
                    .setDescription('The ongoing drop has been stopped.')
                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL())
                    .setTimestamp()
            ]
        });
    }
};
