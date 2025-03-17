const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json')
const vouchableRoleIDs = [
    
    config.Owner,
    config.Coowner,
    config.Admin,
    config.Mods,
    config.Headstaff,
    config.SeniorStaff,
    config.JuniorStaff,
    config.TrailStaff
];

// const vouchDataFilePath = path.join(__dirname, '..', 'vouchCounts', 'vouchData.json');
// const dailyVouchFilePath = path.join(__dirname, '..', 'vouchCounts', 'dailyvouch.json');


const vouchDataFilePath = path.join('/home/container/vouchCounts', 'vouchData.json');   //hosting 
const dailyVouchFilePath = path.join('/home/container/vouchCounts', 'dailyvouch.json');


function loadVouchData(filePath) {
    try {
        const data = require(filePath);
        return data;
    } catch (error) {
        return {};
    }
}

const vouchData = loadVouchData(vouchDataFilePath);
const dailyVouchData = loadVouchData(dailyVouchFilePath);

const vouchCooldown = 900000; 
const vouchedUsers = new Map();

module.exports = {
    name: 'vouch',
    description: 'Vouch for a user.',
    async execute(interaction) {
        const mentionedUser = interaction.options.getMember('user');
        const reviewChange = interaction.options.getInteger('reviewchange');
        const vouchMessage = interaction.options.getString('message');

        if (!mentionedUser) {
            return interaction.reply({ content: 'You need to mention a user to vouch for!', ephemeral: true });
        }

        if (!vouchableRoleIDs.some(roleID => mentionedUser.roles.cache.has(roleID))) {
            return interaction.reply({ content: 'The mentioned user must have one of the vouchable roles to be vouched for!', ephemeral: true });
        }

        if (mentionedUser.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot vouch for yourself!', ephemeral: true });
        }

        if (!Number.isInteger(reviewChange) || (reviewChange !== 1 && reviewChange !== -1)) {
            return interaction.reply({ content: 'You must provide either 1 for a positive review or -1 for a negative review.', ephemeral: true });
        }

        if (interaction.channelId !== config.vouchChannel) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Wrong command usage!')
                        .setDescription(`You can't use vouch command in This channel! Try it in <#${config.vouchChannel}>`)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }

        if (!vouchData[mentionedUser.id]) {
            vouchData[mentionedUser.id] = {
                vouchCount: 0,
                positiveReviews: 0,
                negativeReviews: 0
            };
        }

        if (vouchedUsers.has(interaction.user.id)) {
            const cooldownEnd = vouchedUsers.get(interaction.user.id);
            const currentTime = Date.now();

            if (currentTime < cooldownEnd) {
                const remainingCooldown = Math.ceil((cooldownEnd - currentTime) / 1000 / 60);
                return interaction.reply({ content: `Please wait ${remainingCooldown} minutes before vouching again!`, ephemeral: true });
            }
        }

        const currentTime = new Date().toISOString();

        if (!dailyVouchData[mentionedUser.id]) {
            dailyVouchData[mentionedUser.id] = {
                daily: [],
                '3d': [],
                '1w': [],
            };
        }

        dailyVouchData[mentionedUser.id].daily.push({
            timestamp: currentTime,
            vouches: 1,
        });

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        dailyVouchData[mentionedUser.id]['3d'] = dailyVouchData[mentionedUser.id].daily.filter(vouch => new Date(vouch.timestamp) >= threeDaysAgo);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        dailyVouchData[mentionedUser.id]['1w'] = dailyVouchData[mentionedUser.id].daily.filter(vouch => new Date(vouch.timestamp) >= oneWeekAgo);

        vouchData[mentionedUser.id].vouchCount++;
        if (reviewChange === 1) {
            vouchData[mentionedUser.id].positiveReviews++;
        } else if (reviewChange === -1) {
            vouchData[mentionedUser.id].negativeReviews++;
        }

        fs.writeFileSync(dailyVouchFilePath, JSON.stringify(dailyVouchData, null, 2));
        fs.writeFileSync(vouchDataFilePath, JSON.stringify(vouchData, null, 2));

        const reviewType = reviewChange === 1 ? 'Positive Review' : 'Negative Review';

        const panelMessage = new MessageEmbed()
            .setColor('GREEN')
            .setTitle(`${reviewType} VOUCH`)
            .setFooter(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setDescription(`Thank you ${interaction.user} for providing a ${reviewType} for ${mentionedUser}!`);
            

        if (vouchMessage) {
            panelMessage.addField('Vouch Message', vouchMessage);
        }

        interaction.reply({ embeds: [panelMessage] });

        vouchedUsers.set(interaction.user.id, Date.now() + vouchCooldown);

        setTimeout(() => {
            vouchedUsers.delete(interaction.user.id);
        }, vouchCooldown);
    },
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'The user to vouch for.',
            required: true,
        },
        {
            name: 'reviewchange',
            type: 'INTEGER',
            description: 'The type of review: 1 for positive, -1 for negative.',
            required: true,
        },
        {
            name: 'message',
            type: 'STRING',
            description: 'An optional message to accompany the vouch.',
            required: false,
        },
    ],
};
