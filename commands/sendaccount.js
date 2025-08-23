const { CommandInteraction, MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require('../test_config.json');

function loadAccountsData() {
    try {
        const data = fs.readFileSync('./accounts.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveAccountsData(accountsData) {
    fs.writeFileSync('./accounts.json', JSON.stringify(accountsData, null, 2), 'utf-8');
}

const allowedRoles = [
    config.Owner,
    config.Coowner,
    config.Admin,
    config.Mods,
    config.Headstaff,
    config.SeniorStaff,
    config.JuniorStaff,
    config.TrailStaff
];

function loadSendCountsData() {
    try {
        const data = fs.readFileSync('./send.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveSendCountsData(sendCountsData) {
    fs.writeFileSync('./send.json', JSON.stringify(sendCountsData, null, 2), 'utf-8');
}

module.exports = {
        name: 'sendaccount',
        description: 'Send an email and password to another user in a panel format.',
        options: [
            {
                name: 'user',
                type: 'USER',
                description: 'The user to send the account information to.',
                required: true,
            },
            {
                name: 'service',
                type: 'STRING',
                description: 'The name of the service.',
                
                
                required: true,
                choices: [
                  {
                    name: 'Canvas',
                    value: 'canva'
                  },
                  {
                    name: 'Crunchyroll',
                    value: 'crunchyroll-fa'
                  },
                  {
                    name: 'Linkvertise-fa',
                    value: 'linkvertise-fa'
                  },
                  {
                    name: 'Microsoft365',
                    value: 'microsoft365'
                  },
                  {
                    name: 'Netflix',
                    value: 'netflixaccount'
                  },
                  {
                    name: 'spotify',
                    value: 'spotify'
                  },
                  {
                    name:'Yt premium',
                    value:'yt-premium'
                  }
                ]
            },
            {
              name: 'email',
              type: 'STRING',
              description: 'Enter Email',
              required: true,
            },
            {
              name: 'password',
              type: 'STRING',
              description: 'Enter Password',
              required: true,
            },            
            {
              name: 'message',
              type: 'STRING',
              description: 'An optional message to include with the account information.',
              required: true,
          },
      ],
      async execute(interaction) {
        const senderRoles = interaction.member.roles.cache;
        const hasAllowedRole = allowedRoles.some(roleId => senderRoles.has(roleId));

        if (!hasAllowedRole) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Permission Error')
                        .setDescription('You do not have permission to use this command.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        const targetUser = interaction.options.getMember('user');
        const service = interaction.options.getString('service');
        const email = interaction.options.getString('email');
        const password = interaction.options.getString('password');        
        const Message = interaction.options.getString('message');

        if (!targetUser || !service || !email || !password) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Incomplete Usage')
                        .setDescription('Please provide all required arguments: `.sendaccount @user serviceName email:pass [Message]`.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        let accountsData = loadAccountsData();
        const targetUserId = targetUser.id;
        const senderUserId = interaction.user.id;

        if (accountsData[targetUserId]) {
            const userAccountData = accountsData[targetUserId];
            const accountToSend = userAccountData.find(account => account.Service.toLowerCase() === service.toLowerCase());

            if (accountToSend) {
                const dmMessage = new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle('Account Information')
                    .addField('Service', accountToSend.Service)
                    .addField('Email', email)
                    .addField('Password', password)
                    .addField('Instructions', 'Use this information to access the service.')
                    .addField('Message', Message || '\u200B')
                    .setFooter(`Sent by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp();

                await targetUser.send({ embeds: [dmMessage] });

                let sendCountsData = loadSendCountsData();

                if (!sendCountsData[senderUserId]) {
                    sendCountsData[senderUserId] = 1;
                } else {
                    sendCountsData[senderUserId]++;
                }

                saveSendCountsData(sendCountsData);

                const updatedAccountsData = userAccountData.filter(account => account.Service.toLowerCase() !== service.toLowerCase());

                if (updatedAccountsData.length === 0) {
                    delete accountsData[targetUserId];
                } else {
                    accountsData[targetUserId] = updatedAccountsData;
                }

                saveAccountsData(accountsData);

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.green)
                            .setTitle('Account Sent')
                            .setDescription(`The account information for ${service} has been sent to ${targetUser.tag}'s DM, and the data has been deleted.`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            } else {
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Account Not Found')
                            .setDescription(`${targetUser.tag} does not have any account data for ${service} in the database.`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            }
        } else {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Account Not Found')
                        .setDescription(`${targetUser.tag} does not have any account data in the database.`)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }
    },
};
