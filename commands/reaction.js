const { Permissions } = require('discord.js');
const config = require('../test_config.json');

let gameInProgress = false;

module.exports = {
  name: 'reaction',
  description: 'Start a reaction game by adding emojis.',
  async execute(interaction) {
    const allowedRoles = [
      config.Owner,
      config.Coowner,
      config.Mods, 
      config.HighCommandStaff,
      config.Headstaff, 
      config.SeniorStaff, 
      config.JuniorStaff,
    ];

    const allowedChannels = [config.dropChannel, config.ownerandcoownerChannel]; 

    const memberRoles = interaction.member.roles.cache.map((r) => r.id);
    const hasAllowedRole = allowedRoles.some((role) => memberRoles.includes(role));
    const inAllowedChannel = allowedChannels.includes(interaction.channelId);

    if (!hasAllowedRole || !inAllowedChannel) {
      return interaction.reply({ content: 'You are not authorized to use this command in this channel.', ephemeral: true });
    }

    if (gameInProgress) {
      return interaction.reply({ content: 'A reaction game is already in progress. Please wait for it to finish.', ephemeral: true });
    }

    gameInProgress = true;

    const emojis = ['😀', '🎉', '🔥', '🌟', '❤️', '⚡', '🍀', '🎸', '🍕', '🚀', '🦄', '🍔', '💎', '🌈', '🌺', '🎶', '🍭', '🏆', '🍩', '🎳'];
    const randomEmojis = emojis.sort(() => 0.5 - Math.random()).slice(0, 20);

    await interaction.reply({ content: '**Reaction game in 5 seconds...**' });
    const promptMsg = await interaction.fetchReply();
    promptMsg.react('🚫');

    const countdown = 4;
    setTimeout(startReactionGame, countdown * 1000);

    async function startReactionGame() {
      await promptMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions:', error));

      const selectedEmojis = randomEmojis.slice(0, 5);

      try {
        for (const emoji of selectedEmojis) {
          await promptMsg.react(emoji);
        }
      } catch (error) {
        console.error('Failed to react with emojis:', error);
      }

      const winningEmoji = selectedEmojis[Math.floor(Math.random() * 5)];

      const startReactionTime = Date.now();

      promptMsg.edit(`**First one to click** ${winningEmoji} **wins...**`);
      const filter = (reaction, user) => reaction.emoji.name === winningEmoji && !user.bot;

      promptMsg.awaitReactions({ filter, max: 1, time: 10000 })
        .then(collected => {
          const user = collected.first()?.users.cache.filter(u => !u.bot).first();
          if (user) {
            const endReactionTime = Date.now();
            const reactionSpeed = (endReactionTime - startReactionTime).toFixed(1);
            interaction.channel.send(`${user} won with a reaction speed of ${reactionSpeed}ms!`);
          } else {
            interaction.channel.send('No valid reactions in time. Try again!');
          }
        })
        .catch(err => {
          console.error('Error waiting for reactions:', err);
        })
        .finally(() => {
          promptMsg.delete().catch(console.error);
          gameInProgress = false;
        });
    }
  }
};
