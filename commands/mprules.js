const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'mprules',
    description: 'Sends the marketplace rules embed.',
    execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply('This command can only be used in a server.');
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);

        if (!member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const rulesEmbed = new MessageEmbed()
            .setColor('#00ffff')
            .setTitle('<:shop:1198615713586368542> Marketplace Rules')
            .setDescription(`
- You can't use @everyone ping.
- You can't sell your slot.
- You can't share your slot.
- You can't be marked on SA.
- You can't advertise your server in your slot.
- You can't advertise your server in DM.
- You can't use more than the daily ping. (Central European Time)
- You can't use your slot for something other than buying and selling.
- You can't refuse to use me as MM.
- You can't refuse to refund your customer if you can't replace it.
- You can't ignore DMs of your customers more than 72 hours.
- You can't scam.
- You need to provide TOS in your slot.
- **Respect the rules. If you break any rule, your slot will be revoked without refund**.`)
            .setFooter('If you want to buy your slot, then DM crazylad');

        interaction.reply({ embeds: [rulesEmbed] });
    },
};
