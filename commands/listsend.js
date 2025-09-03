const { MessageEmbed } = require('discord.js');
const fs = require('fs/promises'); 
const config = require('../test_config.json');

async function loadSendCountsData() {
  try {
    const data = await fs.readFile('./send.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

module.exports = {
    name: 'listsend',
    description: 'List users and their send counts in descending order.',

  async execute(interaction) {
    const sendCountsData = await loadSendCountsData();

    const allowedRoles = [config.Coowner, 
      config.Owner,
      config.Coowner,
      config.Mods,
      config.Admin,
      config.HighCommandStaff,
      config.Headstaff,
      config.JuniorStaff,
      config.staffcmdChannel,
      config.SeniorStaff,
      config.TrailStaff
    ];
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

    if (Object.keys(sendCountsData).length === 0) {
      const embed = new MessageEmbed()
        .setColor(config.color.red)
        .setTitle('No Send Counts')
        .setDescription('There are no send counts data available.')
        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const userList = [];

    for (const userId in sendCountsData) {
      const user = interaction.guild.members.cache.get(userId);

      if (user) {
        const username = `**${user.user.username}**`;
        const sendCount = sendCountsData[userId];

        userList.push({ username, sendCount });
      }
    }

    userList.sort((a, b) => b.sendCount - a.sendCount);

    const embed = new MessageEmbed()
      .setColor(config.color.green)
      .setTitle('Send Counts - Top 10')
      .setDescription(userList.slice(0, 10).map(({ username, sendCount }, index) => `${index + 1}. ${username}: ${sendCount}`).join('\n'))
      .setFooter(`${interaction.user.tag} #${userList.findIndex(user => user.username.includes(interaction.user.username)) + 1} ${sendCountsData[interaction.user.id]} sends`, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  },
};
