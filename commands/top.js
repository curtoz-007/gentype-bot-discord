const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises;
const  config  = require('../test_config.json');

module.exports = {
    name: 'top',
    description: 'Display the top 10 users with the highest vouches.',
  async execute(interaction) {
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
    try {
      const vouchData = await fs.readFile(`${__dirname}/../vouchCounts/vouchData.json`, 'utf-8');
      const userData = JSON.parse(vouchData);

      const userArray = Object.entries(userData).map(([userId, userData]) => ({
        userId,
        vouchCount: userData.vouchCount,
      }));

      userArray.sort((a, b) => b.vouchCount - a.vouchCount);

      const embed = new MessageEmbed()
        .setColor(config.color.default)
        .setTitle('Top 10 Users with the Highest Vouches')
        .setDescription('');

      for (let i = 0; i < Math.min(10, userArray.length); i++) {
        const userEntry = userArray[i];
        const user = interaction.guild.members.cache.get(userEntry.userId);

        if (user) {
          const userName = user.displayName || user.user.username;
          const vouchCount = userEntry.vouchCount;
          embed.description += `**${i + 1}. ${userName}:** ${vouchCount} vouches\n`;
        }
      }

      const userPosition = userArray.findIndex(user => user.userId === interaction.user.id) + 1;
      const userVouchCount = userData[interaction.user.id]?.vouchCount || 0;

      embed.setFooter(`${interaction.user.tag} #${userPosition} ${userVouchCount} vouches`, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }));
      interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error:', err);
      interaction.reply({ content: 'An error occurred while fetching the top users.', ephemeral: true });
    }
  },
};
