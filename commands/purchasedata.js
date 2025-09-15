const { MessageAttachment, MessageEmbed } = require('discord.js');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const config = require('../test_config.json');

const db = new sqlite3.Database('purchase.db');

function exportDataCommand(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
            embeds: [new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()]
        });
    }

    db.all(
        `
        SELECT * FROM purchases
        `,
        (err, rows) => {
            if (err) {
                console.error(err);
                return interaction.reply({
                    embeds: [new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Error')
                        .setDescription('An error occurred while fetching data from the database.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()]
                });
            }

            if (rows.length === 0) {
                return interaction.reply({
                    embeds: [new MessageEmbed()
                        .setColor(config.color.orange)
                        .setTitle('No Data')
                        .setDescription('There is no purchase data available.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()]
                });
            }

            const dataText = rows.map((row, index) => {
                return `------------------------\n${index + 1} data\n-----------------------\nPurchase ID: ${row.purchase_id}\nUser ID: ${row.user_id}\npayment_method: ${row.payment_method}\nDate: ${row.date}\nAmount: ${row.amount}\nService: ${row.service}\nDetails: ${row.details}\n`;
            }).join('\n');

            const filePath = 'purchase_data.txt';

            fs.writeFile(filePath, dataText, (writeErr) => {
                if (writeErr) {
                    console.error(writeErr);
                    return interaction.reply({
                        embeds: [new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Write Error')
                            .setDescription('An error occurred while writing data to the file.')
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()]
                    });
                }

                const fileAttachment = new MessageAttachment(filePath);

                interaction.reply({
                    content: "Here is the current purchase data!",
                    files: [fileAttachment]
                });
            });
        }
    );
}

module.exports = {
    name: 'purchasedata',
    description: 'Export purchase data to a text file.',
    execute: exportDataCommand,
};
