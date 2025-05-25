const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const config = require('../test_config.json');

const db = new sqlite3.Database('purchase.db');

async function validCommand(interaction) {
    if (!interaction.isCommand()) return;

    const purchaseId = interaction.options.getString('purchaseid');

    db.get(
        `
            SELECT user_id, purchase_id, payment_method, date, amount, service, details FROM purchases WHERE purchase_id = ?
        `,
        [purchaseId],
        async (err, row) => {
            if (err) {
                console.error(err);
                return;
            }

            if (row) {
                try {
                    const user = await interaction.client.users.fetch(row.user_id);
                    const fields = [
                        { name: 'Purchase ID', value: `\`${row.purchase_id}\`` || 'Not provided', inline: true },
                        { name: 'User', value: `${user.username}#${user.discriminator}`, inline: true },
                        { name: 'Payment Method', value: row.payment_method || 'Not provided', inline: true },
                        { name: 'Date', value: row.date || 'Not provided', inline: true },
                        { name: 'Amount', value: row.amount || 'Not provided', inline: true },
                        { name: 'Service', value: row.service || 'Not provided', inline: true },
                        { name: 'Details', value: row.details || 'Not provided', inline: true }
                    ];

                    const embed = new MessageEmbed()
                        .setColor(config.color.green)
                        .setTitle('Purchase Information')
                        .addFields(fields.filter(field => field.value.trim() !== '')) 
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp();

                    interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error fetching user:', error);
                    interaction.reply({ content: 'Error fetching user information.', ephemeral: true });
                }
            } else {
                interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Purchase ID Not Found')
                            .setDescription(`Purchase ID ${purchaseId} is invalid!`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            }
        }
    );
}

module.exports = {
    name: 'valid',
    description: 'Check a purchase receipt!',
    options: [
        {
            name: 'purchaseid',
            description: 'ID of the purchase',
            type: 'STRING',
            required: true
        }
    ],
    execute: validCommand
};
