const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require('../test_config.json');

const allowedRoles = [
  config.Owner,
  config.Coowner,
  config.Admin,
  config.HighCommandStaff,
  config.Mods,
  '1158002679293943828'
];

function loadAccountsData() {
  try {
    const data = fs.readFileSync('./accounts.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

module.exports = {
    name: 'listsub',
    description: 'List the users and their associated services in a panel.',
    options: [
        {
            name: 'service',
            type: 'STRING', 
            description: 'The service to filter by.',
            required: false,
            choices: [
                {
                    name:'Canvas',
                    value:'canva',
                },
                {
                    name:'Crunchyroll',
                    value:'crunchyroll-fa',
                },
                {    
                    name:'Linkvertise',
                    value:'linkvertise-fa',
                },  
                {
                    name:'Microsoft365',
                    value:'microsoft365',
                },
                {
                    name:'Netflix',
                    value:'netflixaccount',
                },
                {

                    name:'Spotify',
                    value:'spotify',
                },
                {
                    name:'Yt premium',
                    value:'yt-premium',
                }
        ],
        },
    ],

  async execute(interaction) {
    const senderRoles = interaction.member.roles.cache;
    const hasAllowedRole = allowedRoles.some(roleId => senderRoles.has(roleId));

    if (!hasAllowedRole) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Permission Error')
          .setDescription('You do not have permission to use this command.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    const accountsData = loadAccountsData();

    if (Object.keys(accountsData).length === 0) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.green)
          .setTitle('No Data Found')
          .setDescription('There is no account data in the database.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    const userServices = [];
    const filterService = interaction.options.getString('service');

    for (const userId in accountsData) {
      const userSubmissions = accountsData[userId];

      if (userSubmissions.length > 0) {
        const member = interaction.guild.members.cache.get(userId);
        const displayName = member ? `**${member.displayName}**` : `<@${userId}>`;

        const filteredSubmissions = userSubmissions.filter(submission => {
          return !filterService || submission.Service.toLowerCase() === filterService;
        });

        if (filteredSubmissions.length > 0) {
          const submissionInfo = filteredSubmissions.map(submission => {
            return `Service: ${submission.Service}\nEmail: ${submission.Email}\nPassword: ${submission.Password}`;
          }).join('\n\n');
          userServices.push({ user: userId, submissionInfo, displayName });
        }
      }
    }

    const userList = userServices.map(({ displayName, submissionInfo }) => {
      return `${displayName}:\n${submissionInfo}`;
    }).join('\n\n');

    const embed = new MessageEmbed()
      .setColor(config.color.green)
      .setTitle(filterService ? `List of ${filterService} Accounts Submissions` : 'List of Accounts Submissions')
      .setDescription(userList)
      .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  },
};
