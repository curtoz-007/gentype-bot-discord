const { MessageEmbed } = require('discord.js');
const config = require('../test_config.json');

module.exports = {
  name: 'verify',
  description: 'Request verification.',
  async execute(interaction) {
    const allowedRoles = [
      config.Owner,
      config.Coowner,
      config.Admin,
      config.Mods,
      config.Headstaff,
      config.SeniorStaff,
      config.JuniorStaff,
      config.TrailStaff
    ];

    const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasAllowedRole) {
      return interaction.reply({
        embeds: [new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Permission Denied!')
          .setDescription('You do not have the necessary role to use this command.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()]
      });
    }

    const panelMessage = new MessageEmbed()
      .setColor('#00FFFF') // Aqua color
      .setTitle('\<a:checkmark:1183494539189698612> **How to Verify**\<a:checkmark:1183494539189698612>')
      .setDescription(
        `\<a:verified:1184413148745318400> **Step 1:** Click on the link below at the end of the message\n` +
        `\<a:verified:1184413148745318400> **Step 2:** Do some simple steps shown in web\n` +
        `\<a:verified:1184413148745318400> **Step 3:** You will be redirected to a Google Form page; there, write your Discord handle (some people call it a username).\n` +
        `**Note:** *Please use your Discord handle (username); if you use your Discord display name, the bot will not count your verification.*\n` +
        `\<a:verified:1184413148745318400> **Step 4:** Submit the form\n` +
        `\<a:checkmark:1183494539189698612> **Congratulations, you are verified now!** \<a:BD_verified:1158003689215250472>\n`
      )
      .addField('**Verification Link**', 'https://kajilinks.com/verify')
      .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
      .setTimestamp();

    await interaction.reply({ embeds: [panelMessage] });

    const tutorialVideoLink1 = 'https://cdn.discordapp.com/attachments/1171888654503911556/1184179262304030760/1701182007599976.mov?ex=658b07e1&is=657892e1&hm=e9784cd4d319b409dd042bd65303f8d43cb9b43edde369d6e2f69e72cf6b2f60&';
    const tutorialVideoLink2 = 'https://cdn.discordapp.com/attachments/1171893253981872198/1179074236405518356/Verification_link_tutorial.mp4?ex=65787574&is=65660074&hm=55f42c33d302bb39015f55ab8b201b30211fc97edb4b72d338233ed4e929e685&';
    await interaction.followUp(`${tutorialVideoLink1}`);
    await interaction.followUp(`${tutorialVideoLink2}`);
  }
};
