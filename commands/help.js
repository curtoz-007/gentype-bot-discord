const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../test_config.json');

const allowedRoleIDs = [
    config.Owner,
    config.Coowner,
    config.Admin,
    config.Mods,
    config.Headstaff,
    config.HighCommandStaff,
    config.SeniorStaff,
    config.JuniorStaff,
    config.Member
];

module.exports = {
        name: 'help',
        description: 'Display the command list.',

    async execute(interaction) {
        const { client } = interaction;

        const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoleIDs.includes(role.id));

        if (!hasAllowedRole) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const commands = client.commands;
        const commandChunks = chunkArray(Array.from(commands.values()), 8);
        let currentPage = 0;

        const embed = sendEmbed(currentPage, commandChunks, interaction.user);

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle('PRIMARY')
            );

        const reply = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'previous' && currentPage > 0) {
                currentPage--;
                await i.update({ embeds: [sendEmbed(currentPage, commandChunks, interaction.user)], components: [row], ephemeral: true });
            } else if (i.customId === 'next' && currentPage < commandChunks.length - 1) {
                currentPage++;
                await i.update({ embeds: [sendEmbed(currentPage, commandChunks, interaction.user)], components: [row], ephemeral: true });
            }
        });

        collector.on('end', async (collected) => {
            if (reply && !reply.deleted) {
                await reply.delete();
            }
        });
    }
};

function sendEmbed(pageIndex, commandChunks, user) {
    const commandList = commandChunks[pageIndex].map(c => `**\`${config.prefix}${c.name}\`**: ${c.description ? c.description : '*No description provided*'}`).join('\n');
    
    const embed = new MessageEmbed()
        .setColor(config.color.default)
        .setTitle('Command list')
        .setDescription(commandList)
        .setFooter(`Page ${pageIndex + 1}/${commandChunks.length} | ${user.tag}`, user.displayAvatarURL({ dynamic: true, size: 64 }))
        .setTimestamp();

    return embed;
}

function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
