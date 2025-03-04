const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');

const log = new CatLoggr();

module.exports = {
    name: 'redeem',
    description: 'Redeem a code for a specific service.',
    options: [
        {
            name: 'code',
            type: 'STRING',
            description: 'Redeem a code for a specific service.',
            required: true,
        },
    ],
    
    async execute(interaction) {
        const allowedRoleIDs = [
            config.Owner,
            config.Coowner,
            config.Admin,
            config.Mods,
            config.Headstaff,
            config.SeniorStaff,
            config.JuniorStaff,
            config.TrailStaff
        ];

        const member = interaction.member;
        const hasAllowedRole = member.roles.cache.some(role => allowedRoleIDs.includes(role.id));

        if (!hasAllowedRole) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Permission Denied')
                        .setDescription('You do not have permission to use this command.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        const code = interaction.options.getString('code');

        if (!code) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Missing parameters!')
                        .setDescription('You need to give a code to redeem!')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        const stockDirectories = ['Free', 'Basic', 'Premium', 'Extreme'];
        const directoryMapping = {
            'Free': 'fstock',
            'Basic': 'bstock',
            'Premium': 'pstock',
            'Extreme': 'estock'
        };
        let codeFound = false;
        let serviceName = '';

        for (const stockDir of stockDirectories) {
            const dirPath = path.join(__dirname, '..', directoryMapping[stockDir]);

            try {
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    const filePath = path.join(dirPath, file);

                    const data = fs.readFileSync(filePath, 'utf8');
                    const codes = data.trim().split('\n').map(code => code.trim()); 

                    if (codes.includes(code)) {

                        const updatedCodes = codes.filter(existingCode => existingCode !== code);
                        fs.writeFileSync(filePath, updatedCodes.join('\n'));

                        serviceName = `${file.slice(0, -4)}`;

                        const embedMessage = new MessageEmbed()
                            .setColor(config.color.green)
                            .setTitle('Code Redeemed')
                            .setDescription(`Code has been redeemed for **${serviceName}**.`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp();

                        interaction.reply({ embeds: [embedMessage] });

                        // Change channel name
                        const channel = interaction.channel;
                        const newChannelName = `ticket-${serviceName.toLowerCase().replace(/\s+/g, '-')}`;
                        await channel.setName(newChannelName);

                        codeFound = true;
                        break;
                    }
                }

                if (codeFound) {
                    break;
                }
            } catch (error) {
                console.error('Error:', error); 
                continue;
            }
        }

        if (!codeFound) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Redeem error!')
                        .setDescription(`The specified code \`${code}\` was not found in any stock directory!`)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ],
                ephemeral: false
            });
        }
    },
};
