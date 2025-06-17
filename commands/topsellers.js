const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const  config  = require('../test_config.json');



// const sellerVouchFilePath = path.join(__dirname, '..', 'vouchCounts', 'sellerVouch.json');
const sellerVouchFilePath = path.join('/home/container/vouchCounts', 'sellerVouch.json'); //hosting
module.exports = {
    name: 'topsellers',
    description: 'Display the top 10 sellers with the highest vouches.',
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

      const sellerVouchData = await fs.readFile(sellerVouchFilePath, 'utf-8');
      const sellerUserData = JSON.parse(sellerVouchData);

      const sellerArray = Object.entries(sellerUserData).map(([userId, userData]) => ({
        userId,
        sellerVouchCount: userData.sellerVouchCount,
      }));

      sellerArray.sort((a, b) => b.sellerVouchCount - a.sellerVouchCount);

      const embed = new MessageEmbed()
        .setColor(config.color.default)
        .setTitle('Top 10 Sellers with the Highest Vouches')
        .setDescription('');

      for (let i = 0; i < Math.min(10, sellerArray.length); i++) {
        const sellerEntry = sellerArray[i];
        const seller = interaction.guild.members.cache.get(sellerEntry.userId);

        if (seller) {
          const sellerName = seller.displayName || seller.user.username;
          const sellerVouchCount = sellerEntry.sellerVouchCount;
          embed.description += `**${i + 1}. ${sellerName}:** ${sellerVouchCount} vouches\n`;
        }
      }

      const sellerPosition = sellerArray.findIndex(seller => seller.userId === interaction.user.id) + 1;
      const sellerVouchCount = sellerUserData[interaction.user.id]?.sellerVouchCount || 0;

      embed.setFooter(`${interaction.user.tag} #${sellerPosition} ${sellerVouchCount} vouches`, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }));
      interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error:', err);
      interaction.reply({ content: 'An error occurred while fetching the top sellers.', ephemeral: true });
    }
  },
};
