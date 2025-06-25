const { Client, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./test_config.json');
const express = require('express');
const app = express();

// Define a simple logging system
const log = {
    init: (message) => console.log('[INIT]', message),
    debug: (message) => console.log('[DEBUG]', message),
    warn: (message) => console.warn('[WARN]', message),
    error: (message) => console.error('[ERROR]', message),
    info: (message) => console.info('[INFO]', message)
};

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING
    ],
});

client.commands = new Map();

if (config.debug === true) client.on('debug', stream => log.debug(stream));
client.on('warn', message => log.warn(message));
client.on('error', error => log.error(error));

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    log.init(`Loaded command ${file.split('.')[0] === command.name ? file.split('.')[0] : `${file.split('.')[0]} as ${command.name}`}`);
    client.commands.set(command.name, command);
}

const vouchDataFilePath = path.join(__dirname, 'vouchCounts', 'vouchData.json');

const roleThresholds = [
    { roleID: config.JuniorStaff, threshold: 30 }, 
    { roleID: config.SeniorStaff, threshold: 80 }, 
    { roleID: config.Headstaff, threshold: 150 }, 
    { roleID: config.HighCommandStaff, threshold: 270 },
    { roleID: config.Mods, threshold: 350 },
];

const requirementRoleID = config.TrailStaff;

function loadVouchData(filePath) {
    try {
        const data = require(filePath);
        return data;
    } catch (error) {
        return {};
    }
}

function assignRolesFromVouchData() {
    const vouchData = loadVouchData(vouchDataFilePath);

    client.guilds.cache.forEach(guild => {
        guild.members.cache.forEach(member => {
            const memberRoles = member.roles.cache.map(role => role.id);
            if (memberRoles.includes(requirementRoleID)) {
                const memberVouchCount = vouchData[member.id] ? vouchData[member.id].vouchCount : 0;

                for (const roleThreshold of roleThresholds) {
                    if (memberVouchCount >= roleThreshold.threshold) {
                        const roleToAdd = member.guild.roles.cache.find(role => role.id === roleThreshold.roleID);

                        if (roleToAdd && !member.roles.cache.has(roleToAdd.id)) {
                            member.roles.add(roleToAdd)
                                .then(() => {
                                    const congratsChannel = guild.channels.cache.get(config.PromotionChannel);
                                    if (congratsChannel) {
                                        congratsChannel.send(`Congratulations <@${member.id}>! You have reached **${roleToAdd.name}** 🎉.`);
                                    }
                                })
                                .catch(error => console.error('Error adding role:', error));
                        }
                    }
                }
            }
        });
    });
}

fs.watchFile(vouchDataFilePath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        assignRolesFromVouchData();
    }
});

client.once('ready', async () => {
    log.info(`I am logged in as ${client.user.tag} to Discord!`);
    client.user.setActivity(`${config.prefix}help │ ${config.servername}`, { type: "WATCHING" });

    try {
        await client.guilds.fetch();
    } catch (error) {
        log.error(`Error fetching guilds: ${error}`);
    }

    assignRolesFromVouchData();
    setInterval(assignRolesFromVouchData, 5000);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('ready', async () => {
    const guildCommands = [
        client.commands.get('vouch'),
        client.commands.get('sendcookie'),
        client.commands.get('bgen'),
        client.commands.get('inactive'),
        client.commands.get('inactivestrike'),
        client.commands.get('fgen'),
        client.commands.get('active'),
        client.commands.get('pls'),
        client.commands.get('redeem'),
        client.commands.get('egen'),
        client.commands.get('profile'),
        client.commands.get('addvouch'),
        client.commands.get('stock'),
        client.commands.get('bstock'),
        client.commands.get('cstock'),
        client.commands.get('estock'),
        client.commands.get('fstock'),
        client.commands.get('pstock'),
        client.commands.get('add'),
        client.commands.get('verify'),
        client.commands.get('pgen'),
        client.commands.get('cgen'),
        client.commands.get('check'),
        client.commands.get('listcookie'),
        client.commands.get('listsend'),
        client.commands.get('sendaccount'),
        client.commands.get('startdrop'),
        client.commands.get('stopdrop'),
        client.commands.get('reaction'),
        client.commands.get('resetdrop'),
        client.commands.get('listinactive'),
        client.commands.get('here'),
        client.commands.get('clearvouch'),
        client.commands.get('lessvouch'),
        client.commands.get('totalvouches'),
        client.commands.get('copyprofilerole'),
        client.commands.get('removeprofileroles'),
        client.commands.get('demote'),
        client.commands.get('listsub'),
        client.commands.get('mprules'),
        client.commands.get('purchasedata'),
        client.commands.get('sellsprofile'),
        client.commands.get('rep'),
        client.commands.get('help'),
        client.commands.get('top'),
        client.commands.get('topsellers'),
        client.commands.get('addsellvouch'),
        client.commands.get('remove'),
        client.commands.get('valid'),
        client.commands.get('purchase'),
        client.commands.get('removepurchase'),
        client.commands.get('token'),
        client.commands.get('fetchuserpurchase'),
        client.commands.get('paymentrequest')
    ];

    const dmCommands = [
        client.commands.get('submitaccount'),
    ];

    if (!guildCommands.every(cmd => cmd) || !dmCommands.every(cmd => cmd)) {
        console.error('One or more commands not found.');
        return;
    }

    try {
        // Register guild commands
        await client.guilds.cache.forEach(async guild => {
            await guild.commands.set(guildCommands);
        });

        // Register DM commands
        await client.application?.commands.set(dmCommands); 
        console.log('Slash commands registered.');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const user = newState.member.user;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (!oldChannel && newChannel) {
        const embed = new MessageEmbed()
            .setColor('#0099ff') // Blue color
            .setTitle('Joined Voice Chat')
            .setDescription(`User: ${user}\nVoice chat: ${newChannel}`)
            .addField('User ID', user.id)
            .addField('Channel ID', newChannel.id)
            .setTimestamp();

        client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
    } else if (oldChannel && !newChannel) {
        const embed = new MessageEmbed()
            .setColor('#ff0000') // Red color
            .setTitle('Left Voice Chat')
            .setDescription(`User: ${user}\nVoice chat: ${oldChannel}`)
            .addField('User ID', user.id)
            .addField('Channel ID', oldChannel.id)
            .setTimestamp();

        client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
    } else if (oldChannel !== newChannel) {
        const embed = new MessageEmbed()
            .setColor('#ffa500') // Orange color
            .setTitle('Moved Voice Chat')
            .setDescription(`User: ${user}\nMoved by: ${newState.member}\nFrom: ${oldChannel} To: ${newChannel}`)
            .addField('User ID', user.id)
            .addField('Old Channel ID', oldChannel.id)
            .addField('New Channel ID', newChannel.id)
            .setTimestamp();

        client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
    }
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.content !== newMessage.content) {
        const embed = new MessageEmbed()
            .setColor('#ffff00') // Yellow color
            .setTitle('Message Edited')
            .addFields(
                { name: 'Before', value: oldMessage.content },
                { name: 'After', value: newMessage.content }
            )
            .addField('User', `${newMessage.author} (${newMessage.author.tag})`, true)
            .addField('Message ID', newMessage.id, true)
            .addField('Channel', `<#${newMessage.channel.id}>`, true)
            .setTimestamp();

        client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
    }
});

client.on('messageDelete', (deletedMessage) => {
    const embed = new MessageEmbed()
        .setColor('#ff0000') // Red color
        .setTitle('Message Deleted')
        .addField('Message', deletedMessage.content) // Message content at the top
        .addField('User', `${deletedMessage.author} (${deletedMessage.author.tag})`, true)
        .addField('Message ID', deletedMessage.id, true)
        .addField('Channel', `<#${deletedMessage.channel.id}>`, true)
        .setTimestamp();

    client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
});


client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size > 0) {
        const auditLogs = await newMember.guild.fetchAuditLogs({ type: 'MEMBER_ROLE_UPDATE', limit: 1 });
        const logEntry = auditLogs.entries.first();

        const executor = logEntry ? logEntry.executor : 'Auto';

        const embed = new MessageEmbed()
            .setColor('#00ff00') // Green color
            .setTitle('Role Added')
            .addField('User', `${newMember} (${newMember.user.tag})`, true)
            .addField('Role(s)', addedRoles.map(role => role).join(', '), true)
            .addField('Given By', `${executor}`, true)
            .setTimestamp();

        client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
    }

    if (removedRoles.size > 0) {
        const auditLogs = await newMember.guild.fetchAuditLogs({ type: 'MEMBER_ROLE_UPDATE', limit: 1 });
        const logEntry = auditLogs.entries.first();

        const executor = logEntry ? logEntry.executor : 'Auto';

        const embed = new MessageEmbed()
            .setColor('#ff0000') // Red color
            .setTitle('Role Removed')
            .addField('User', `${newMember} (${newMember.user.tag})`, true)
            .addField('Role(s)', removedRoles.map(role => role).join(', '), true)
            .addField('Removed By', `${executor}`, true)
            .setTimestamp();

        client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
    }
});


client.on('guildBanAdd', (guild, user) => {
    const embed = new MessageEmbed()
        .setColor('#ff0000') // Red color
        .setTitle('User Banned')
        .setDescription(`${user.tag} has been banned from the server.`)
        .addField('User ID', user.id)
        .setTimestamp();

    client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
});

client.on('guildBanRemove', (guild, user) => {
    const embed = new MessageEmbed()
        .setColor('#00ff00') // Green color
        .setTitle('User Unbanned')
        .setDescription(`${user.tag} has been unbanned from the server.`)
        .addField('User ID', user.id)
        .setTimestamp();

    client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
});

client.on('guildMemberAdd', (member) => {
    const joinDate = member.user.createdAt;
    const now = new Date();

    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    let days = now.getDate() - joinDate.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
        years--;
    }

    if (months < 0) {
        months += 12;
    }

    if (days < 0) {
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }

    const accountAge = `${years} years, ${months} months, ${days} days`;

    const embed = new MessageEmbed()
        .setColor('#00ff00') // Green color
        .setTitle('User Joined')
        .addField('User', `${member} (${member.user.tag})`, true)
        .addField('Member Count', member.guild.memberCount.toString(), true)
        .addField('Account Age', accountAge, true)
        .setTimestamp();

    client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
});

client.on('guildMemberRemove', (member) => {
    const accountCreationDate = member.user.createdAt;
    const currentDate = new Date();
    
    const years = currentDate.getFullYear() - accountCreationDate.getFullYear();
    const months = currentDate.getMonth() - accountCreationDate.getMonth();
    const days = currentDate.getDate() - accountCreationDate.getDate();
    
    // Adjust negative values
    if (months < 0 || (months === 0 && days < 0)) {
        years--;
        months += 12;
        if (days < 0) {
            months--;
            days += new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        }
    }
    
    const embed = new MessageEmbed()
        .setColor('#ff0000') // Red color
        .setTitle('User Left')
        .addField('User', member.toString(), true)
        .addField('Member Count', member.guild.memberCount.toString(), true)
        .addField('Account Age', `${years} years, ${months} months, ${days} days`, true)
        .setTimestamp();

    client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
});

client.on('guildMemberRemove', (member) => {
    const embed = new MessageEmbed()
        .setColor('#ff0000') // Red color
        .setTitle('User Kicked')
        .setDescription(`${member.user.tag} has been kicked from the server.`)
        .addField('User ID', member.user.id)
        .addField('Member Count', member.guild.memberCount.toString())
        .setTimestamp();

    client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (oldMember.nickname !== newMember.nickname) {
        const embed = new MessageEmbed()
            .setColor('#ffa500') // Orange color
            .setTitle('Nickname Changed')
            .setDescription(`${newMember.user.tag}'s nickname has been changed.`)
            .addField('Old Nickname', oldMember.nickname || 'None', true)
            .addField('New Nickname', newMember.nickname || 'None', true)
            .addField('User ID', newMember.id, true)
            .setTimestamp();

        client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
    }
});

client.on('guildCreate', (guild) => {
    const embed = new MessageEmbed()
        .setColor('#00ff00') // Green color
        .setTitle('Bot Added to Server')
        .setDescription(`The bot has been added to the server: ${guild.name}`)
        .addField('Server ID', guild.id)
        .setTimestamp();

    client.channels.cache.get(config.logChannel).send({ embeds: [embed] });
});


client.login(config.token);
