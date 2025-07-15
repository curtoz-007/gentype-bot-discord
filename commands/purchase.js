const { MessageEmbed, Permissions } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const randomstring = require('randomstring');
const { prefix, color } = require('../test_config.json');

const db = new sqlite3.Database('purchase.db');

db.run(`
  CREATE TABLE IF NOT EXISTS purchases (
    purchase_id TEXT PRIMARY KEY,
    user_id TEXT,
    payment_method TEXT,
    date TEXT,
    amount TEXT,
    service TEXT,
    details TEXT
  )
`);

function generatePurchaseId() {
    const parts = [
        randomstring.generate({ length: 4, charset: 'alphabetic', capitalization: 'uppercase' }),
        randomstring.generate({ length: 4, charset: 'numeric' }),
        randomstring.generate({ length: 4, charset: 'numeric' }),
        randomstring.generate({ length: 4, charset: 'numeric' }),
    ];

    return parts.join('-');
}

async function purchaseCommand(interaction) {
    if (!interaction.isCommand() || !interaction.inGuild()) return;

    const user = interaction.options.get('user').user;
    const paymentMethod = interaction.options.getString('payment_method');
    const date = interaction.options.getString('date');
    const amount = interaction.options.getString('amount');
    const service = interaction.options.getString('service');
    const details = interaction.options.getString('details');

    if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        return interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(color.red)
                    .setTitle('Permission Denied')
                    .setDescription('You do not have permission to use this command.')
                    .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            ]
        });
    }

    const purchaseId = generatePurchaseId();

    db.run(
        `
      INSERT INTO purchases (purchase_id, user_id, payment_method, date, amount, service, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
        [purchaseId, user.id, paymentMethod, date, amount, service, details],
        (err) => {
            if (err) {
                console.error(err);
                return;
            }

            user.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(color.green)
                        .setTitle('Purchase Receipt')
                        .addFields(
                            { name: 'Purchase ID', value: `\`${purchaseId}\``, inline: true },
                            { name: 'Payment Method', value: paymentMethod, inline: true },
                            { name: 'Date', value: date, inline: true },
                            { name: 'Amount', value: amount, inline: true },
                            { name: 'Service', value: service, inline: true },
                            { name: 'Details', value: details, inline: true }
                        )
                        .setFooter('Thank you for your purchase!')
                        .setTimestamp()
                ]
            });

            interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(color.green)
                        .setTitle('Purchase Successful')
                        .addFields(
                            { name: 'Purchase ID', value: `\`${purchaseId}\``, inline: true },
                            { name: 'Username', value: user.tag, inline: true },
                            { name: 'Payment Method', value: paymentMethod, inline: true },
                            { name: 'Date', value: date, inline: true },
                            { name: 'Amount', value: amount, inline: true },
                            { name: 'Service', value: service, inline: true },
                            { name: 'Details', value: details, inline: true }
                        )
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }
    );
}

module.exports = {
    name: 'purchase',
    description: 'Generate a purchase receipt!',
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'The user for the purchase.',
            required: true
        },
        {
            name: 'payment_method',
            type: 'STRING',
            description: 'The payment method used for the purchase.',
            required: true
        },
        {
            name: 'date',
            type: 'STRING',
            description: 'The date of the purchase.',
            required: true
        },
        {
            name: 'amount',
            type: 'STRING',
            description: 'The amount of the purchase.',
            required: true
        },
        {
            name: 'service',
            type: 'STRING',
            description: 'The service purchased.',
            required: true
        },
        {
            name: 'details',
            type: 'STRING',
            description: 'Details for the purchase.',
            required: true
        }
    ],
    execute: purchaseCommand,
};
