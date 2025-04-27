const { Permissions, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../test_config.json');

async function copyProfileCommand(interaction) {
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

  const oldMember = interaction.options.getMember('old_member');
  const newMember = interaction.options.getMember('new_member');

  if (!oldMember || !newMember) {
    return interaction.reply({
      embeds: [
        {
          color: config.color.red,
          title: 'Invalid Mention',
          description: 'Please mention both the old and new accounts.',
          footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
          timestamp: new Date(),
        },
      ],
    });
  }

  const rolesToAdd = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

  const confirmRow = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('confirm')
      .setLabel('✅ Confirm')
      .setStyle('SUCCESS'),
    new MessageButton()
      .setCustomId('cancel')
      .setLabel('❌Cancel')
      .setStyle('DANGER')
  );

  const confirmMessage = await interaction.reply({
    embeds: [
      {
        color: config.color.default,
        title: 'Confirm Role Copy',
        description: `You are about to copy roles to ${newMember.user.tag}.`,
        footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
        timestamp: new Date(),
      },
    ],
    components: [confirmRow],
    fetchReply: true,
  });

  const filter = i => i.user.id === interaction.user.id;
  const collector = confirmMessage.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async i => {
    if (i.customId === 'confirm') {
      await newMember.roles.add(rolesToAdd);
  
      const rolesToCopy = rolesToAdd.map(role => role.name).join(', ');
  
      await interaction.editReply({
        embeds: [
          {
            color: config.color.green,
            title: 'Roles Copy Successful',
            description: `Roles copied from ${oldMember.user.tag} to ${newMember.user.tag}. Copied roles: \`${rolesToCopy}\`.`,
            footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
            timestamp: new Date(),
          },
        ],
        components: [],
      });
    } else if (i.customId === 'cancel') {
      await interaction.editReply({
        embeds: [
          {
            color: config.color.red,
            title: 'Action Canceled',
            description: 'Role copy operation has been canceled.',
            footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) },
            timestamp: new Date(),
          },
        ],
        components: [],
      });
    }
    collector.stop();
  });

  collector.on('end', () => {
    confirmMessage.components.forEach(component => {
      component.setDisabled(true);
    });
    confirmMessage.edit({ components: confirmMessage.components });
  });
}

module.exports = {
    name: 'copyprofilerole',
    description: 'Copy roles from old account to new account.',
    options: [
      {
        name: 'old_member',
        description: 'The old member whose roles you want to copy.',
        type: 'USER',
        required: true,
      },
      {
        name: 'new_member',
        description: 'The new member to whom you want to copy the roles.',
        type: 'USER',
        required: true,
      },
    ],
  execute: copyProfileCommand,
};
