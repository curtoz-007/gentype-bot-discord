const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'inactivestrike',
    description: 'View inactive strikes.',
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'The user to view inactive strikes for.',
            required: false
        }
    ],
    async execute(interaction) {
        let userId = interaction.user.id;
        const specifiedUser = interaction.options.getUser('user');
        if (specifiedUser) userId = specifiedUser.id;

        const strikeFilePath = path.join(__dirname, '..', 'inactivestrike.json');

        fs.readFile(strikeFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return interaction.reply({
                    content: 'An error occurred while fetching inactive strike data.',
                    ephemeral: true
                });
            }

            let strikeList = [];
            if (data) {
                strikeList = JSON.parse(data);
            }

            const userStrikes = strikeList.find(entry => entry.userId === userId);

            if (!userStrikes) {
                return interaction.reply({
                    content: `No inactive strikes found for ${specifiedUser ? specifiedUser.tag : interaction.user.tag}.`,
                    ephemeral: true
                });
            }

            const strikeCount = userStrikes.count;
            const strikeLimit = 3; // Define the strike limit

            let strikeDescription = `Inactive strike counts for ${specifiedUser ? specifiedUser.tag : interaction.user.tag}: ${strikeCount}`;
            if (strikeCount >= strikeLimit) {
                strikeDescription += "\n**User has reached the strike limit and will be demoted.**";
            }

            const strikeEmbed = new MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Inactive Strikes')
                .setDescription(strikeDescription)
                .setFooter('Strike Data')
                .setTimestamp();

            interaction.reply({ embeds: [strikeEmbed] });
        });
    }
};
