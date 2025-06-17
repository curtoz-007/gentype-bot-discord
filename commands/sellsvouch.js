const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises;
const config = require('../test_config.json');
const path = require('path');

const allowedRoleIds = [config.MarketPlaceSeller]; 
// const sellerVouchFilePath = path.join(__dirname, '..', 'vouchCounts', 'sellerVouch.json');
const sellerVouchFilePath = path.join('/home/container/vouchCounts', 'sellerVouch.json'); //hosting 
async function loadSellerVouchData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

module.exports = {
  name: 'sellsprofile',
  description: "View a seller's vouch count and reviews.",
  options: [
    {
      name: 'user',
      type: 'USER',
      description: "View a user's vouch count and reviews",
      required: false,
    },
  ],
  async execute(interaction) {
    const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

    if (!hasAllowedRole) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Insufficient permissions!')
          .setDescription('You do not have permission to use this command.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    const mentionedUser = interaction.options.get('user')?.user || interaction.user;
    const sellerVouchData = await loadSellerVouchData(sellerVouchFilePath);
    const userId = mentionedUser.id;

    if (sellerVouchData[userId]) {
      const sellerVouchUserData = sellerVouchData[userId];
      const sellerVouchCount = sellerVouchUserData.sellerVouchCount || 0;
      const positiveReviews = sellerVouchUserData.positiveReviews || 0;
      const negativeReviews = sellerVouchUserData.negativeReviews || 0;

      // Ensure that all field values are non-empty strings
      const panel = new MessageEmbed()
        .setColor('#3498db')
        .setTitle(`Seller Profile: ${mentionedUser.username}`)
        .setDescription('**Vouch and Review Statistics**')
        .addFields(
          { name: 'Total Seller Vouches', value: sellerVouchCount.toString(), inline: true },
          { name: 'Positive Reviews', value: positiveReviews.toString(), inline: true },
          { name: 'Negative Reviews', value: negativeReviews.toString(), inline: true },
        )
        .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ dynamic: true, size: 32 }))
        .setTimestamp()
        .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true, size: 32 }));

      return interaction.reply({ embeds: [panel] });
    } else {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Seller Not Found!')
          .setDescription('No vouch data found for the mentioned seller.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }
  },
};
