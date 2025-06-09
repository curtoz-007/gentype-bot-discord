const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const config = require('../test_config.json');

const db = new sqlite3.Database('purchase.db');

async function removePurchaseCommand(interaction) {
    if (!interaction.isCommand() || !interaction.inGuild()) return;

    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Permission Denied')
                    .setDescription('You do not have permission to use this command.')
                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            ]
        });
    }

    const purchaseId = interaction.options.getString('purchase_id');

    if (!purchaseId) {
        return interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Missing Parameter')
                    .setDescription('Please provide a purchase ID to remove.')
                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            ]
        });
    }

    db.run(
        `
      DELETE FROM purchases WHERE purchase_id = ?
    `,
        [purchaseId],
        function (err) {
            if (err) {
                console.error(err);
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Error')
                            .setDescription('An error occurred while removing data from the database.')
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            }

            if (this.changes === 0) {
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(config.color.orange)
                            .setTitle('Not Found')
                            .setDescription(`No purchase found with ID: \`${purchaseId}\`.`)
                            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    ]
                });
            }

            interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.green)
                        .setTitle('Purchase Removed')
                        .setDescription(`Purchase with ID \`${purchaseId}\` has been successfully removed from the database.`)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }
    );
}

module.exports = {
    name: 'removepurchase',
    description: 'Remove a specific purchase by ID.',
    options: [
        {
            name: 'purchase_id',
            type: 'STRING',
            description: 'The ID of the purchase to remove.',
            required: true
        }
    ],
    execute: removePurchaseCommand,
};
