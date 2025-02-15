const { Permissions, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const config = require('../test_config.json');

async function removeProfileRolesCommand(interaction) {
  if (!interaction.isCommand()) return;

  if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
    return interaction.reply({
      embeds: [
        {
          color: config.color.red,
          title: 'Permission Denied',
          description: 'You do not have permission to use this command.',
          footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
          timestamp: new Date(),
        },
      ],
    });
  }

  const memberToRemoveRolesFrom = interaction.options.getMember('member');

  if (!memberToRemoveRolesFrom) {
    return interaction.reply({
      embeds: [
        {
          color: config.color.red,
          title: 'Invalid Mention',
          description: 'Please mention the member whose roles you want to remove.',
          footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
          timestamp: new Date(),
        },
      ],
    });
  }

  const rolesToKeep = ['1204421799086129223'];
  const rolesToRemove = memberToRemoveRolesFrom.roles.cache.filter(role => !rolesToKeep.includes(role.id));

  const firstConfirmEmbed = new MessageEmbed()
    .setColor(config.color.red)
    .setTitle('Confirm Roles to be Removal??')
    .setDescription(`Are you sure you want to remove roles from ${memberToRemoveRolesFrom.user.tag}?`);

  const secondConfirmEmbed = new MessageEmbed()
    .setColor(config.color.red)
    .setTitle('Final Confirm Role Removal')
    .setDescription(`This is the final confirmation step. Are you absolutely sure you want to remove roles from ${memberToRemoveRolesFrom.user.tag}?`);

  const firstConfirmRow = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('first_confirm')
      .setLabel('✅ Confirm')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('cancel')
      .setLabel('❌ Cancel')
      .setStyle('DANGER')
  );

  const secondConfirmRow = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('second_confirm')
      .setLabel('✅ Yes, remove the roles')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('cancel')
      .setLabel('❌No, cancel')
      .setStyle('DANGER')
  );

  const firstConfirmMessage = await interaction.reply({
    embeds: [firstConfirmEmbed],
    components: [firstConfirmRow],
    fetchReply: true,
  });

  const firstFilter = i => i.user.id === interaction.user.id;
  const firstCollector = firstConfirmMessage.createMessageComponentCollector({ filter: firstFilter, time: 60000 });

  firstCollector.on('collect', async i => {
    if (i.customId === 'first_confirm') {
      await i.update({ embeds: [secondConfirmEmbed], components: [secondConfirmRow] });
      firstCollector.stop();
    } else if (i.customId === 'cancel') {
      await i.update({ content: 'Role removal canceled.', embeds: [], components: [] });
      firstCollector.stop();
    }
  });

  const secondFilter = i => i.user.id === interaction.user.id;
  const secondCollector = firstConfirmMessage.createMessageComponentCollector({ filter: secondFilter, time: 60000 });

  secondCollector.on('collect', async i => {
    if (i.customId === 'second_confirm') {
      try {
        await memberToRemoveRolesFrom.roles.remove(rolesToRemove);
        await interaction.editReply({
          embeds: [
            {
              color: config.color.green,
              title: 'Roles Removed',
              description: `Roles have been successfully removed from ${memberToRemoveRolesFrom.user.tag}.`,
              footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
              timestamp: new Date(),
            },
          ],
          components: [],
        });
      } catch (error) {
        console.error('Failed to remove roles:', error);
        interaction.reply({
          embeds: [
            {
              color: config.color.red,
              title: 'Error',
              description: 'An error occurred while removing roles. Please try again later.',
              footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
              timestamp: new Date(),
            },
          ],
        });
      }
      secondCollector.stop();
    } else if (i.customId === 'cancel') {
      await interaction.editReply({
        embeds: [
            {
              color: config.color.red,
              title: 'Removed Roles has been canceled',
              description: `Removed Roles have been canceled.`,
              footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
              timestamp: new Date(),
            }],
        components: [],
      });
      secondCollector.stop();
    }
  });
}

module.exports = {
    name: 'removeprofileroles',
    description: 'Remove all roles except for one from a member\'s profile.',
    options: [
      {
        name: 'member',
        description: 'The member whose roles you want to remove.',
        type: 'USER',
        required: true,
      },
    ],
  execute: removeProfileRolesCommand,
};
