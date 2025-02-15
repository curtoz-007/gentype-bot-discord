const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const config = require('../test_config.json');

const db = new sqlite3.Database('purchase.db');

async function fetchUserPurchase(interaction) {
    if (!interaction.isCommand()) return;

    // Check if the user executing the command is authorized
    if (
        interaction.user.id !== config.Owner &&
        interaction.user.id !== config.Coowner &&
        !interaction.member.permissions.has('ADMINISTRATOR') // Assuming admin has required permission
    ) {
        return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    const userId = interaction.options.getUser('userid');

    db.all(
        `
            SELECT purchase_id, payment_method, date, amount, service, details FROM purchases WHERE user_id = ?
        `,
        [userId.id],
        async (err, rows) => {
            if (err) {
                console.error(err);
                return;
            }

            if (rows && rows.length > 0) {
                const embed = new MessageEmbed()
                    .setColor(config.color.blue)
                    .setTitle(`Purchase Information for ${userId.username}#${userId.discriminator}`)
                    .setDescription('Here are all the purchases made by this user:')
                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp();

                rows.forEach(row => {
                    embed.addField(
                        `Purchase ID: ${row.purchase_id}`,
                        `**Payment Method:** ${row.payment_method || 'Not provided'}\n` +
                        `**Date:** ${row.date || 'Not provided'}\n` +
                        `**Amount:** ${row.amount || 'Not provided'}\n` +
                        `**Service:** ${row.service || 'Not provided'}\n` +
                        `**Details:** ${row.details || 'Not provided'}\n`
                    );
                });

                interaction.reply({ embeds: [embed] });
            } else {
                interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('No Purchases Found')
                            .setDescription(`No purchases found for user ${userId.username}#${userId.discriminator}`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            }
        }
    );
}

module.exports = {
    name: 'fetchuserpurchase',
    description: 'Display all purchase information of a user',
    options: [
        {
            name: 'userid',
            description: 'User to fetch purchases for',
            type: 'USER',
            required: true
        }
    ],
    execute: fetchUserPurchase
};
