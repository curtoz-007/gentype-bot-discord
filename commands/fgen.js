// Dependencies
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');

// Functions
const log = new CatLoggr();
const generated = new Map();
const usedCodes = new Set();
let cooldowns = {};

function loadCooldowns() {
    try {
        const data = fs.readFileSync('./freecooldown.json', 'utf-8');
        cooldowns = JSON.parse(data);
    } catch (error) {
        cooldowns = {};
    }
}

function saveCooldowns() {
    fs.writeFileSync('./freecooldown.json', JSON.stringify(cooldowns, null, 2), 'utf-8');
}

function isCodeUsed(code) {
    return usedCodes.has(code);
}

loadCooldowns();

module.exports = {
    name: 'fgen',
    description: 'Generate a specified service if stocked (Extreme).',
    options: [
        {
            name: 'service',
            type: 'STRING',
            description: 'The service to generate.',
            required: true,
            choices: [
                {
                    name: 'Spotify',
                    value: 'spotify'
                },
                {
                    name: 'Netflix',
                    value: 'netflix'
                }
            ]
        }
    ],
    async execute(interaction) {
        try {
            const fgenChannel = interaction.client.channels.cache.get(config.fgenChannel);
            if (!fgenChannel) {
                throw new Error('Invalid gen channel specified!');
            }
        } catch (error) {
            log.error(error);

            if (config.command.error_message === true) {
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Error occurred!')
                            .setDescription('Not a valid gen channel specified!')
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            } else {
                return;
            }
        }

        if (interaction.channelId !== config.fgenChannel) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Wrong command usage!')
                        .setDescription(`You cannot use the \`gen\` command in this channel! Try it in <#${config.fgenChannel}>!`)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        if (cooldowns.hasOwnProperty(interaction.user.id)) {
            const cooldownExpirationTime = cooldowns[interaction.user.id];
            const remainingTime = cooldownExpirationTime - Date.now();

            if (remainingTime > 0) {
                const hoursRemaining = Math.floor(remainingTime / (60 * 60 * 1000));
                const minutesRemaining = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

                const cooldownMessage = `Please wait ${hoursRemaining} hour(s) and ${minutesRemaining} minute(s) before executing that command again!`;

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Cooldown!')
                            .setDescription(cooldownMessage)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            } else {
                delete cooldowns[interaction.user.id];
                saveCooldowns();
            }
        }

        const service = interaction.options.getString('service');

        if (!service) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Missing parameters!')
                        .setDescription('You need to provide a service name!')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        const filePath = `${__dirname}/../fstock/${service}.txt`;

        fs.readFile(filePath, 'utf-8', function (error, data) {
            if (!error) {
                data = data.toString();
                const position = data.toString().indexOf('\n');
                const firstLine = data.split('\n')[0];

                let instructions = '';

                if (service === 'spotify') {
                    instructions = `Step 1: Download [Cookie Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) From [here](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)\n\n` +
                        `Step 2: Open Spotify in your Browser, then open the cookie editor. Delete the cookies.\n\n` +
                        `Step 3: Click the import button and copy-paste the cookie provided by staff.\n\n` +
                        `Step 4: Refresh the page and enjoy your Music.`;
                } else {
                    instructions = `Step 1: Download [Cookie Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) From [here](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)\n\n` +
                        `Step 2: Open Netflix in your Browser, then open the cookie editor. Delete the cookies.\n\n` +
                        `Step 3: Click the import button and copy-paste the cookie provided by staff.\n\n` +
                        `Step 4: Refresh the page and enjoy NETFLIX and Chill.`;
                }

                let selectedCode = '';

                if (position !== -1) {
                    selectedCode = firstLine;
                    while (isCodeUsed(selectedCode)) {
                        selectedCode = data.split('\n')[Math.floor(Math.random() * data.split('\n').length)];
                    }
                }

                if (position !== -1) {
                    interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(config.color.green)
                                .setTitle('Account generated successfully!')
                                .setDescription(`Check your private messages for the generated account information!`)
                                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp()
                        ]
                    });

                    interaction.user.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(config.color.green)
                                .setTitle('CODE GENERATED')
                                .addField('Code generated for', `\`${service[0].toUpperCase()}${service.slice(1).toLowerCase()}\``, true)
                                .addField('Copy this code', '```\n' + selectedCode + '\n```', true)
                                .addField(
                                    'Verification Instructions',
                                    'Please click the link provided below, wait for a few seconds, then open the form and keep your Discord username there.'
                                )
                                .addField('Instructions', instructions)
                                .addField(
                                    '**Link:**',
                                    '[Verification Link](https://kajilinks.com/verify)' 
                                )
                                .setDescription('Provide the code to the staff by creating a ticket to redeem the service.')
                                .setFooter('Generated by Chonk G3N')
                                .setTimestamp()
                        ]
                    });

                    const generatedData = {
                        service: service,
                        code: selectedCode,
                        timestamp: Date.now()
                    };
                    generated.set(interaction.user.id, generatedData);
                    usedCodes.add(selectedCode);

                    const cooldownTime = 2 * 60 * 60 * 1000;
                    cooldowns[interaction.user.id] = Date.now() + cooldownTime;
                    saveCooldowns();
                } else {
                    interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(config.color.red)
                                .setTitle('Generator error!')
                                .setDescription(`The \`${service}\` service is out of stock!`)
                                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp()
                        ]
                    });
                }
            } else {
                interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Generator error!')
                            .setDescription(`Service \`${service}\` does not exist!`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            }
        });
    }
};
