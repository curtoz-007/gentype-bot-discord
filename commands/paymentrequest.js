const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'paymentrequest',
  description: 'Initiate a purchase request.',
  options: [
    {
      name: 'user',
      type: 'USER',
      description: 'The user to whom the purchase request will be sent.',
      required: true
    },
    {
      name: 'amount',
      type: 'NUMBER',
      description: 'The amount of the purchase.',
      required: true
    },
    {
      name: 'paymentmethod',
      type: 'STRING',
      description: 'The payment method.',
      required: true,
      choices: [
        {
          name: 'LTC',
          value: 'ltc'
        },
        {
          name: 'PayPal',
          value: 'paypal'
        },
        {
          name: 'Esewa',
          value: 'esewa'
        }
      ]
    }
  ],
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getNumber('amount');
    const paymentMethod = interaction.options.getString('paymentmethod');

    let recipientEmail, instructions, currencySymbol, purchaseMethod;

    switch (paymentMethod) {
      case 'ltc':
        recipientEmail = '```LfiZYXJQxc3CsQVQ74p9FZHJYozYFhcj1M```';
        instructions = 'Send ScreenShot in the Ticket after Payment and wait. Otherwise, it won’t be accepted and won’t be refunded.';
        currencySymbol = 'LTC';
        purchaseMethod = 'Litecoin (LTC)';
        break;
      case 'paypal':
        recipientEmail = '```princesah145@gmail.com```';
        instructions = 'Pay through F&F. Do not add any notes. Send ScreenShot in the Ticket After Payment and Wait. Otherwise, it won’t be accepted and won’t be refunded.';
        currencySymbol = '$';
        purchaseMethod = 'PayPal';
        break;
      case 'esewa':
        recipientEmail = '```monster.mk088@gmail.com```';
        instructions = 'Don’t add anything in remarks. Write personal use. Send SS in Ticket after Payment and wait. Otherwise, it won’t be accepted and won’t be refunded.';
        currencySymbol = 'Rs';
        purchaseMethod = 'Esewa';
        break;
      default:
        interaction.reply({
          content: 'Invalid payment method.',
          ephemeral: true
        });
        return;
    }

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Payment Request')
      .setDescription(`Please send ${amount.toFixed(2)} ${currencySymbol} to ${recipientEmail} \nPurchase Method: ${purchaseMethod}\n\n${instructions}`)
      .setFooter('Payment Instructions');

    const replyEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setDescription(`Payment Instructions sent to ${user.tag}. Please proceed with your payment.`);

    interaction.reply({
      embeds: [embed, replyEmbed]
    });

    const dmEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setDescription('Payment Instructions sent. Please proceed with your payment.');

    user.send({
      embeds: [embed, dmEmbed]
    });
  }
};
