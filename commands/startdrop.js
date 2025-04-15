const { MessageEmbed } = require('discord.js');
const config = require('../test_config.json');
const fs = require('fs');
const dropState = require('./dropState');

let dailyUsageCounter = 0;
const maxDailyUsage = 5;

function loadData() {
    try {
        const filePath = __dirname + '/dropcooldown.json';
        console.log('Reading data from:', filePath);
        const data = fs.readFileSync(filePath, 'utf8');
        console.log('Data read:', data);


        if (!data.trim()) {
            console.log('Data is empty.');
            return { dropInProgress: false, dropCooldown: 0, dailyUsageCounter: 0 };
        }

        const parsedData = JSON.parse(data);
        console.log('Parsed data:', parsedData);
        dropState.updateDropStateAndCooldown(parsedData.dropInProgress, parsedData.dropCooldown || 0);
        dailyUsageCounter = parsedData.dailyUsageCounter || 0;
        return parsedData;
    } catch (err) {
        console.error('Error loading data:', err);
        return { dropInProgress: false, dropCooldown: 0, dailyUsageCounter: 0 };
    }
}

function saveData() {
    const dataToSave = {
        dropInProgress: dropState.getDropInProgress(),
        dropCooldown: dropState.getDropCooldown(),
        dailyUsageCounter,
    };
    fs.writeFileSync(__dirname + '/dropcooldown.json', JSON.stringify(dataToSave, null, 2), 'utf8');
}

function resetDailyLimit() {
    dailyUsageCounter = 0;
    saveData();
}

function scheduleDailyLimitReset() {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeUntilReset = nextDay - now;

    setTimeout(() => {
        resetDailyLimit();
        scheduleDailyLimitReset();
    }, timeUntilReset);
}

scheduleDailyLimitReset();

module.exports = {
    name: 'startdrop',
    description: 'Start a code drop and mention a specific role in the server.',
    async execute(interaction) {
        loadData();
    
        const allowedRoles = [config.JuniorStaff];
        const allowedChannelId = config.dropChannel;
    
        const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));
        const isAllowedChannel = interaction.channel.id === allowedChannelId;
    
        if (!hasAllowedRole || !isAllowedChannel) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Permission Denied!')
                        .setDescription('You do not have the required roles or the command is not allowed in this channel.')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }
    
        if (dropState.getDropInProgress()) {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Drop In Progress!!')
                        .setDescription('There is already an ongoing drop!!')
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }
    
        if (dropState.getDropCooldown() > Date.now()) {
            const remainingTime = Math.ceil((dropState.getDropCooldown() - Date.now()) / (60 * 1000));
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Cooldown!')
                        .setDescription(`Please wait ${Math.floor(remainingTime / 60)} hours ${remainingTime % 60} minutes to start another drop.`)
                        .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                ]
            });
        }
    
        const panelMessage = `A new drop has started! Hurry up and get the drops!!`;
        const dropStartedEmbed = new MessageEmbed()
            .setColor(config.color.blue)
            .setTitle('Drop Started!')
            .setDescription(panelMessage)
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL())
            .setTimestamp();
    
        await interaction.reply({
            embeds: [dropStartedEmbed]
        });
    
        dropState.startDrop();
        dropState.setDropCooldown(Date.now() + 1 * 60 * 60 * 1000);
    
        dailyUsageCounter++;
        saveData(); 
    
        if (dailyUsageCounter >= maxDailyUsage) {
            await interaction.followUp('Daily usage limit reached. Try again tomorrow.');
        }
    
        // Mention the config.Member role outside the panel
        const memberRole = interaction.guild.roles.cache.find(role => role.id === config.Member);
        if (memberRole) {
            await interaction.channel.send(`<@&${memberRole.id}>`);
        }
    },
};
