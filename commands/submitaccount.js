const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'submitaccount',
    description: 'Submit an email and password for a specific service.',
    options: [
        {
            name: 'service',
            type: 'STRING',
            description: 'The service for which you want to submit the account.',
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
              ],
        },
        {
            name: 'email',
            type: 'STRING',
            description: 'The email for the account.',
            required: true,
        },
        {
            name: 'password',
            type: 'STRING',
            description: 'The password for the account.',
            required: true,
        },
    ],
    async execute(interaction) {
        const { user, options } = interaction;
    
        const submittedService = options.getString('service');
        const email = options.getString('email');
        const password = options.getString('password');
    
        const { MessageEmbed } = require('discord.js');
        const config = require('../test_config.json');
    
        const servicesFolderPath = path.join(__dirname, '..', 'estock');
    
        const availableServices = fs.readdirSync(servicesFolderPath)
            .filter(file => file.endsWith('.txt'))
            .map(file => file.slice(0, -4));
    
        function loadCooldownData() {
            try {
                const data = fs.readFileSync('./cooldownData.json', 'utf-8');
                return JSON.parse(data);
            } catch (error) {
                console.error('Error loading cooldown data:', error);
                return {};
            }
        }
    
        function saveCooldownData(cooldownData) {
            try {
                fs.writeFileSync('./cooldownData.json', JSON.stringify(cooldownData, null, 2), 'utf-8');
            } catch (error) {
                console.error('Error saving cooldown data:', error);
            }
        }
    
        function loadAccountData() {
            try {
                const data = fs.readFileSync('./accounts.json', 'utf-8');
                return JSON.parse(data);
            } catch (error) {
                console.error('Error loading account data:', error);
                return {};
            }
        }
    
        function saveAccountData(accountData) {
            try {
                fs.writeFileSync('./accounts.json', JSON.stringify(accountData, null, 2), 'utf-8');
            } catch (error) {
                console.error('Error saving account data:', error);
            }
        }
    
        const userId = user.id;
        
    
        const cooldownData = loadCooldownData();
    
        if (!availableServices.includes(submittedService)) {
            return interaction.reply('Please provide a valid service to submit an account for.');
        }
    
        if (cooldownData.hasOwnProperty(userId) && cooldownData[userId].generatedService === submittedService) {
            if (cooldownData[userId].cooldownTime > Date.now()) {
                const remainingCooldown = cooldownData[userId].cooldownTime - Date.now();
                const daysRemaining = Math.floor(remainingCooldown / (1000 * 60 * 60 * 24));
                const hoursRemaining = Math.floor((remainingCooldown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutesRemaining = Math.floor((remainingCooldown % (1000 * 60 * 60)) / (1000 * 60));
    
                return interaction.reply(`You can send another account in ${daysRemaining} days, ${hoursRemaining} hours, and ${minutesRemaining} minutes.`);
            }
    
            const targetChannel = interaction.client.channels.cache.get(config.extremepayout);
    
            if (!targetChannel || targetChannel.type !== 'GUILD_TEXT') {
                return interaction.reply('Error: The specified target channel was not found.');
            }
    
            targetChannel.send({
                embeds: [
                  new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle(`New ${submittedService.charAt(0).toUpperCase() + submittedService.slice(1)} Account Submission`)
                    .setDescription(`A new ${submittedService} account submission from ${user} (${user.tag})`)
                    .addField('Email', email)
                    .addField('Password', password)
                    .setFooter('Submitted by Chonk')
                    .setTimestamp()
                ]
              });
              
    
            const cooldownTime = 4 * 24 * 60 * 60 * 1000;
            cooldownData[userId].cooldownTime = Date.now() + cooldownTime;
    
            saveCooldownData(cooldownData);
    
            const userPanel = new MessageEmbed()
            .setColor(config.color.green)
            .setTitle(`Your ${submittedService.charAt(0).toUpperCase() + submittedService.slice(1)} Account Submitted Successfully`)
            .addField('Email', email)
            .addField('Password', password)
            .setDescription('Wait until our bot sends you the account.')
            .setFooter('Submitted by Chock bot')
            .setTimestamp();
        
            user.send({ embeds: [userPanel] })
                .catch(() => {
                    interaction.reply('We were unable to send you a confirmation DM. Please make sure your DMs are enabled.');
                });
    
            const accountData = loadAccountData();
    
            const accountInfo = {
                Service: submittedService.charAt(0).toUpperCase() + submittedService.slice(1),
                User: user.tag,
                Email: email,
                Password: password,
            };
    
            if (!accountData[userId]) {
                accountData[userId] = [];
            }
            accountData[userId].push(accountInfo);
    
            saveAccountData(accountData);
            
        } else {
            return interaction.reply(`You are not authorized to use this command for ${submittedService}. Please use the \`egen ${submittedService}\` command to generate an account first.`);
        }
    },
};    