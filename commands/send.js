const { MessageAttachment } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../test_config.json')
const sendCommandRoleIds = [ 
  config.Owner,
  config.Coowner,
  config.Admin,
  config.Mods,
  config.Headstaff,
  config.SeniorStaff,
  config.JuniorStaff
];

module.exports = {
  name: 'sendcookie',
  description: 'Send a random cookie text file from the specified service folder to a mentioned user.',
  async execute(interaction) {
    const canUseSendCommand = interaction.member.roles.cache.some(role => sendCommandRoleIds.includes(role.id));
    if (!canUseSendCommand) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: false });
    }

    const mentionedUserOption = interaction.options.get('user');
    if (!mentionedUserOption) {
      return interaction.reply({ content: 'Please mention a user.', ephemeral: true });
    }

    const mentionedUser = mentionedUserOption.user;
    if (!mentionedUser || mentionedUser.id === interaction.user.id) {
      return interaction.reply({ content: 'Cannot send to yourself XD', ephemeral: false });
    }

    const serviceOption = interaction.options.getString('service');
    if (!serviceOption) {
      return interaction.reply({ content: 'Please provide a service.', ephemeral: true });
    }
    
    const service = serviceOption.charAt(0).toUpperCase() + serviceOption.slice(1).toLowerCase();
    const cookieFolder = path.join(__dirname, 'Cookies', service);

    fs.readdir(cookieFolder, async (error, files) => {
      if (error) {
        console.error(error);
        return interaction.reply({ content: `An error occurred while trying to access the ${service} cookie folder.`, ephemeral: false });
      }

      const textFiles = files.filter(file => file.endsWith('.txt'));

      if (textFiles.length === 0) {
        return interaction.reply({ content: `There are no ${service} cookies available to send at the moment.`, ephemeral: false });
      }

      const randomFileName = textFiles[Math.floor(Math.random() * textFiles.length)];
      const filePath = path.join(cookieFolder, randomFileName);

      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const attachment = new MessageAttachment(Buffer.from(fileContent), randomFileName);

        await mentionedUser.send({ content: `Here is a ${service} cookie for you:`, files: [attachment] });
        await interaction.reply({ content: `${service} Cookie sent successfully to <@${mentionedUser.id}>.` });
      } catch (readError) {
        console.error(readError);
        return interaction.reply({ content: 'An error occurred while trying to read the text file.', ephemeral: false });
      }
    });
  },
  options: [
    {
        name: 'user',
        type: 'USER',
        description: 'The user to send the cookie to.',
        required: true,
    },
    {
        name: 'service',
        type: 'STRING',
        description: 'The service for which you want to send a cookie.',
        required: true,
    },
],

};
