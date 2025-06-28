const { MessageEmbed, MessageAttachment } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json');
const CatLoggr = require('cat-loggr');


const log = new CatLoggr();
let cooldowns = new Map();

function loadCooldowns() {
    try {
        const data = fs.readFileSync('./ncooldown.json', 'utf-8');
        cooldowns = new Map(JSON.parse(data));
    } catch (error) {
        cooldowns = new Map();
    }
}

function saveCooldowns() {
    fs.writeFileSync('./ncooldown.json', JSON.stringify([...cooldowns]), 'utf-8');
}

function loadStockCount(service) {
    try {
        const data = fs.readFileSync(`./cstock/${service}.txt`, 'utf-8');
        return data.trim().split('\n');
    } catch (error) {
        return [];
    }
}

function saveStockCount(service, codes) {
    fs.writeFileSync(`./cstock/${service}.txt`, codes.join('\n'), 'utf-8');
}

module.exports = {
    name: 'cgen',
    description: 'Generate a specified service if stocked (Advanced).',
    options: [
      {
          name: 'service',
          type: 'STRING',
          description: 'The service to generate.',
          required: true,
          choices: [
              {
                  name: 'Minecraft',
                  value: 'Minecraft'
              },
              {
                  name: 'Spotify',
                  value: 'Spotify'
              },
              {
                  name: 'Netflix',
                  value: 'Netflix'
              },
              {
                  name: 'Prime',
                  value: 'Prime'
              }
          ]
      }
  ],
  
    async execute(interaction) {
        loadCooldowns();

        if (interaction.channelId !== config.cgenChannel) {
            if (config.command.error_message === true) {
                return interaction.reply({
                    embeds: [new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Error occurred!')
                        .setDescription('Not a valid gen channel specified!')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()]
                });
            } else return;
        }

        const userRoles = interaction.member.roles.cache;
        const exemptRoles = [
            config.Owner,
            config.Coowner,
            config.Admin,
            config.Mods,
        ];

        const hasExemptRole = exemptRoles.some(roleId => userRoles.has(roleId));

        if (cooldowns.has(interaction.user.id) && !hasExemptRole) {
            const cooldownExpirationTime = cooldowns.get(interaction.user.id);
            const remainingTime = cooldownExpirationTime - Date.now();

            if (remainingTime > 0) {
                const hours = Math.floor(remainingTime / (60 * 60 * 1000));
                const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

                let cooldownMessage = `Please wait`;

                if (hours > 0) {
                    cooldownMessage += ` **${hours} hour${hours !== 1 ? 's' : ''}**`;
                }

                if (minutes > 0) {
                    cooldownMessage += ` **${minutes} minute${minutes !== 1 ? 's' : ''}**`;
                }

                cooldownMessage += ` before executing that command again!`;

                return interaction.reply({
                    embeds: [new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Cooldown!')
                        .setDescription(cooldownMessage)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()]
                });
            } else {
                cooldowns.delete(interaction.user.id);
                saveCooldowns();
            }
        }

        const service = interaction.options.getString('service');

        if (!service) {
            return interaction.reply({
                embeds: [new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Missing parameters!')
                    .setDescription('You need to give a service name!')
                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()]
            });
        }

        let codes = loadStockCount(service);

        if (codes.length > 0) {
            const serviceFolderPath = path.join(__dirname, 'Cookies', service);

            fs.readdir(serviceFolderPath, async (err, files) => {
                if (err) {
                    log.error(err);
                    return interaction.reply({
                        embeds: [new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Generator error!')
                            .setDescription(`An error occurred while reading the '${service}' folder.`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()]
                    });
                }

                const txtFiles = files.filter(file => file.endsWith('.txt'));

                if (txtFiles.length === 0) {
                    return interaction.reply({
                        embeds: [new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Generator error!')
                            .setDescription(`There are no cookies in the '${service}' folder.`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()]
                    });
                }

                const randomTxtFile = txtFiles[Math.floor(Math.random() * txtFiles.length)];
                const filePath = path.join(serviceFolderPath, randomTxtFile);

                fs.readFile(filePath, 'utf-8', async (readErr, data) => {
                    if (readErr) {
                        log.error(readErr);
                        return interaction.reply({
                            embeds: [new MessageEmbed()
                                .setColor(config.color.red)
                                .setTitle('Generator error!')
                                .setDescription(`An error occurred while reading the text file.`)
                                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp()]
                        });
                    }

                    const codesInFile = data.trim().split('\n');

                    if (codesInFile.length === 0) {
                        return interaction.reply({
                            embeds: [new MessageEmbed()
                                .setColor(config.color.red)
                                .setTitle('Generator error!')
                                .setDescription(`There are no available stock for ${service}.`)
                                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp()]
                        });
                    }

                    const usedCode = codesInFile.shift();
                    const remainingCodes = codesInFile.join('\n');

                    fs.writeFile(filePath, remainingCodes, 'utf-8', async (writeErr) => {
                        if (writeErr) {
                            log.error(writeErr);
                            return interaction.reply({
                                embeds: [new MessageEmbed()
                                    .setColor(config.color.red)
                                    .setTitle('Generator error!')
                                    .setDescription(`An error occurred while writing to the text file.`)
                                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                                    .setTimestamp()]
                            });
                        }

                        codes = codes.slice(1);
                        saveStockCount(service, codes);

                        const fileAttachment = new MessageAttachment(filePath);
                        await interaction.user.send({
                            embeds: [new MessageEmbed()
                                .setColor(config.color.green)
                                .setTitle('Account Information')
                                .setDescription(`Here is your Cookie for ${service}:\nPlease remove the last ===== lines of the cookie before using it.`)
                                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp()],
                            files: [fileAttachment]
                        });

                        if (!hasExemptRole) {
                            const cooldownTime = 2 * 60 * 60 * 1000;
                            cooldowns.set(interaction.user.id, Date.now() + cooldownTime);
                            saveCooldowns();
                        }

                        await interaction.reply({
                            embeds: [new MessageEmbed()
                                .setColor(config.color.green)
                                .setTitle('Account generated successfully!')
                                .setDescription(`Check your private messages for the generated ${service} Cookie!`)
                                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp()]
                        });
                    });
                });
            });
        } else {
            interaction.reply({
                embeds: [new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Out of Stock!')
                    .setDescription(`The stock is empty for ${service}. Please try again later.`)
                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()]
            });
        }
    },
};
