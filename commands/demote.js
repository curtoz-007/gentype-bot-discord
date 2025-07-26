// Dependencies
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');
const allowedRoleIDs = [config.Owner, config.Coowner];
const allowedChannelIDs = [config.ownerandcoownerChannel, config.staffcmdChannel, config.inactiveChannel];

const vouchDataFilePath = path.join('/home/container/vouchCounts', 'vouchData.json');

const roleThresholds = {
  [config.Mods]: 350,
  [config.HighCommandStaff]: 270,
  [config.HeadStaff]: 150,
  [config.SeniorStaff]: 80,
  [config.JuniorStaff]: 30,
  [config.TrialStaff]: 0,
};

function loadVouchData(filePath) {
  try {
    const data = require(filePath);
    return data;
  } catch (error) {
    return {};
  }
}

const vouchData = loadVouchData(vouchDataFilePath);

module.exports = {
  name: 'demote',
  description: 'Demote a user based on vouch thresholds.',
  options: [
    {
      name: 'user',
      type: 'USER',
      description: 'The user to demote.',
      required: true,
    },
    {
      name: 'role',
      type: 'ROLE',
      description: 'The role to demote the user to.',
      required: true,
    },
    {
      name: 'reason',
      type: 'STRING',
      description: 'The reason for the demotion.',
      required: false,
    },
  ],
  async execute(interaction) {
    if (!interaction.guild || !allowedChannelIDs.includes(interaction.channelId)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setTitle('Wrong command usage!')
            .setDescription('You cannot use the `demote` command in this channel!')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoleIDs.includes(role.id));

    if (!hasAllowedRole) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setTitle('Insufficient permissions!')
            .setDescription('You do not have permission to use this command.')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const mentionedUser = interaction.options.getUser('user');
    const targetRole = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'Not specified';

    if (!mentionedUser || !targetRole) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setTitle('Invalid parameters!')
            .setDescription('Please mention a user and provide a valid target role.')
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const targetRoleIndex = targetRole.position;
    const targetRoleThreshold = roleThresholds[targetRole.id];

    if (!vouchData[mentionedUser.id] || vouchData[mentionedUser.id].vouchCount < targetRoleThreshold) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setTitle('Insufficient vouches!')
            .setDescription(`The user ${mentionedUser} does not have enough vouches for the specified role.`)
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    // Adjust vouch count to just below the target role threshold
    vouchData[mentionedUser.id].vouchCount = Math.max(0, targetRoleThreshold - 1);
    vouchData[mentionedUser.id].positiveReviews = 0;

    fs.writeFileSync(vouchDataFilePath, JSON.stringify(vouchData, null, 2), (err) => {
      if (err) {
        console.error('Error writing file:', err);
      }
    });

    const member = interaction.guild.members.cache.get(mentionedUser.id);
    const userRoles = member.roles.cache;

    // Remove roles above the target role
    const rolesToRemove = Array.from(userRoles.values())
      .filter(role => role.position > targetRoleIndex)
      .map(role => role.id);

    const rolesToSet = [targetRole.id];

    await member.roles.remove(rolesToRemove).catch(console.error);
    await member.roles.add(rolesToSet).catch(console.error);

    await mentionedUser.send({
      embeds: [
        new MessageEmbed()
          .setColor('ORANGE')
          .setTitle('You have been demoted')
          .setDescription(`You have been demoted to ${targetRole.name}.\nReason: ${reason}.`)
          .setFooter(`Demoted by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()
      ]
    }).catch(console.error);

    const panelMessage = new MessageEmbed()
      .setColor('GREEN')
      .setTitle('User Demoted')
      .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
      .setTimestamp()
      .setDescription(`${mentionedUser} has been demoted to ${targetRole.name}.\nReason: ${reason}.`);

    interaction.reply({
      embeds: [panelMessage]
    });
  },
};
