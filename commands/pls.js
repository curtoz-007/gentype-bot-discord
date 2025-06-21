// Dependencies
const { MessageEmbed } = require('discord.js');
const config = require('../test_config.json');

module.exports = {
  name: 'pls',
  description: 'Request a vouch.',
  execute(interaction, args) {
    const vouchChannelMention = `<#${config.vouchChannel}>`;

    const panelMessage = new MessageEmbed()
      .setColor('#00FFFF')
      .setTitle('Vouch Requested!')
      .setDescription(`Hey there! Your opinion truly matters to us. If you've had an awesome experience with us, consider dropping a review or giving us a shout-out by typing \`/vouch <mention staff who provided u acc> 1 or -1 (positive or negative) <review>\` in ${vouchChannelMention}. Your words could inspire others to discover the same greatness you've found. Let's spread the positivity together!`)
      .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
      .setTimestamp();

    interaction.reply({ embeds: [panelMessage] });
  },
};
