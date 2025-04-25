const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');

module.exports = {
  name: 'listinactive',
  description: 'Show inactive',
  async execute(interaction) {
    const filePath = path.join(__dirname, '..', 'inactive.json');
    try {
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

      const data = fs.readFileSync(filePath, 'utf8');
      let inactiveList = JSON.parse(data);
      
      if (inactiveList.length === 0) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(config.color.blue)
              .setTitle('No Inactive Users!')
              .setDescription('There are no users marked as inactive.')
              .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          ]
        });
      }

      const formattedInactiveUsers = inactiveList.map(user => {
        const guildMember = interaction.guild.members.cache.get(user.userId);
        const username = guildMember ? guildMember.toString() : 'Unknown User';
        const reason = user.reason;
        const formattedTime = user.inactiveTimeFormatted;
        const dateInactive = user.dateInactive;

        return `${username}: ${reason} | ${formattedTime}\nInactive from: ${dateInactive}`;
      });

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.green)
            .setTitle('Inactive Users')
            .setDescription(formattedInactiveUsers.join('\n\n'))
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  },
};
