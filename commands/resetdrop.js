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
  name: 'resetdrop',
  description: 'Reset daily execution limit and drop cooldown.',
  async execute(interaction) {
    loadData();

    const allowedRoles = [
      config.Owner,
      config.Coowner
    ];

    const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasAllowedRole) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Permission Denied!')
            .setDescription('You do not have the required role to use this command.')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    dropState.setDropInProgress(false);
    dropState.setDropCooldown(0);
    saveData();

    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(config.color.green)
          .setTitle('Reset Successful!')
          .setDescription('Daily execution limit and drop cooldown have been reset.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()
      ],
      ephemeral: true
    });
  },
};
