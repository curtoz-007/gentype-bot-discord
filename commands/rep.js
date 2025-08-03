// Dependencies
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json')

const vouchableRoleID = config.MarketPlaceSeller;

const sellerVouchFilePath = path.join('/home/container/vouchCounts', 'sellerVouch.json'); // hosting site 

// const sellerVouchFilePath = path.join(__dirname, '..', 'vouchCounts', 'sellerVouch.json');
function loadSellerVouchData(filePath) {
  try {
    const data = require(filePath);
    return data;
  } catch (error) {
    return {};
  }
}

const sellerVouchData = loadSellerVouchData(sellerVouchFilePath);

const vouchCooldown = 900000;

const vouchedUsers = new Map();

module.exports = {
  name: 'rep',
  description: 'Give positive or negative reputation to a user.',
  options: [
    {
      name: 'user',
      type: 'USER',
      description: 'The user to provide reputation for.',
      required: true,
    },
    {
      name: 'reviewchange',
      type: 'INTEGER',
      description: 'The change in reputation (+1 for positive, -1 for negative).',
      required: true,
    },
    {
      name: 'message',
      type: 'STRING',
      description: 'An optional message to accompany the reputation change.',
      required: false,
    },
  ],
  execute(interaction) {
    const { member, options, guild } = interaction;
    const mentionedUser = options.get('user').user;
    const reviewChange = options.get('reviewchange').value;
    const vouchMessage = options.get('message')?.value;

    if (interaction.channelId !== config.MarketPlaceSellerChannel) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor('RED')
          .setTitle('Wrong command usage!')
          .setDescription('You cannot use the `rep` command in this channel!')
          .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    if (vouchedUsers.has(member.id)) {
      const cooldownEnd = vouchedUsers.get(member.id);
      const currentTime = Date.now();

      if (currentTime < cooldownEnd) {
        const remainingCooldown = (cooldownEnd - currentTime) / 1000;
        const remainingMinutes = Math.ceil(remainingCooldown / 60);
        return interaction.reply({
          embeds: [new MessageEmbed()
            .setColor('RED')
            .setTitle('Cooldown!')
            .setDescription(`Please wait ${remainingMinutes} minutes before providing rep again!`)
            .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()]
        });
      }
    }

    if (!mentionedUser) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor('RED')
          .setTitle('Missing parameters!')
          .setDescription('You need to mention a user to provide rep for!')
          .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    if (mentionedUser.id === member.id) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor('RED')
          .setTitle('Invalid action!')
          .setDescription('You cannot provide rep for yourself!')
          .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    const mentionedMember = guild.members.cache.get(mentionedUser.id);
    const hasVouchableRole = mentionedMember.roles.cache.some(role => role.id === vouchableRoleID);

    if (!hasVouchableRole) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor('RED')
          .setTitle('Invalid role!')
          .setDescription('The mentioned user must have the vouchable role to be vouched for!')
          .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    if (isNaN(reviewChange) || (reviewChange !== 1 && reviewChange !== -1)) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor('RED')
          .setTitle('Invalid review change value!')
          .setDescription('You must provide either +1 for a positive review or -1 for a negative review.')
          .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    if (!sellerVouchData[mentionedUser.id]) {
      sellerVouchData[mentionedUser.id] = {
        sellerVouchCount: 0,
        positiveReviews: 0,
        negativeReviews: 0
      };
    }

    if (reviewChange === 1) {
      sellerVouchData[mentionedUser.id].sellerVouchCount++;
      sellerVouchData[mentionedUser.id].positiveReviews++;
    } else if (reviewChange === -1) {
      sellerVouchData[mentionedUser.id].sellerVouchCount++;
      sellerVouchData[mentionedUser.id].negativeReviews++;
    }

    vouchedUsers.set(member.id, Date.now() + vouchCooldown);

    setTimeout(() => {
      vouchedUsers.delete(member.id);
    }, vouchCooldown);

    fs.writeFileSync(sellerVouchFilePath, JSON.stringify(sellerVouchData, null, 2));

    const reviewType = reviewChange === 1 ? 'Positive Review' : 'Negative Review';

    const panelMessage = new MessageEmbed()
      .setColor('GREEN')
      .setTitle(`${reviewType} REP`)
      .setDescription(`Thank you ${member} for providing a ${reviewType} for ${mentionedUser}!`)
      .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 64 }))
      .setTimestamp();

    if (vouchMessage) {
      panelMessage.addField('Vouch Message', vouchMessage);
    }

    interaction.reply({ embeds: [panelMessage] });
  },
};
