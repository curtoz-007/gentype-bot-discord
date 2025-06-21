const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const express = require('express');
const { json, urlencoded } = require('body-parser');
const mysql = require('mysql2/promise');
const config = require('../test_config.json');

const PORT = 30009;
const app = express();
const pool = mysql.createPool({
  host: '116.202.80.93',
  user: 'u174_PRjH7sKHQE',
  password: 'nM4ruUMZD2PXJ61p4.w=CCA0',
  database: 's174_headstaff',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createUsersTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL
    );
  `;
  const [rows] = await pool.query(createTableQuery);
}

createUsersTable();

app.get('/getAllUsernames', async (req, res) => {
  try {
    const [rows, fields] = await pool.query('SELECT username FROM users');
    const usernames = rows.map(row => row.username);
    res.json({ usernames });
  } catch (error) {
    console.error('Error fetching usernames:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use(json());
app.use(urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/src/index.html');
});

app.post('/addUser', async (req, res) => {
  try {
    const { username, token } = req.body;
    const lowercaseu = username.toLowerCase();

    // Validate the Turnstile token
    const turnstileResponse = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      secret: '0x4AAAAAAASusopK1WNXlM7qbK-Zj7sQT6s', // Replace with your actual Turnstile secret key
      response: token,
      remoteip: req.headers['cf-connecting-ip'] // Cloudflare header for client IP
    });

    if (!turnstileResponse.data.success) {
      return res.status(400).send('Invalid Turnstile token');
    }

    // Check if the username already exists
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [lowercaseu]);
    if (rows.length > 0) {
      return res.send('User already registered');
    }

    // Insert the new user into the database
    await pool.query('INSERT INTO users (username) VALUES (?)', [username]);

    res.send('User added successfully');
  } catch (error) {
    console.error('Error adding user:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/verify/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const isUserRegistered = rows.length > 0;

    if (isUserRegistered) {
      await pool.query('DELETE FROM users WHERE username = ?', [username]);
    }

    res.json({ isUserRegistered });
  } catch (error) {
    console.error('Error verifying user:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function execute(interaction) {
  const allowedRoleIDs = [
    config.Owner,
    config.Coowner,
    config.Admin,
    config.Mods,
    config.Headstaff,
    config.SeniorStaff,
    config.JuniorStaff,
    config.TrailStaff,
    '1180825450327572501'
  ];

  const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoleIDs.includes(role.id));

  if (!hasAllowedRole) {
    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Permission Denied')
          .setDescription('You do not have permission to use this command.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()
      ],
      ephemeral: true
    });
  }

  const mention = interaction.options.getUser('user');
  if (!mention) {
    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Missing User')
          .setDescription('Please mention a user to check their verification status.')
          .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()
      ],
      ephemeral: true
    });
  }

  try {
    const user = await interaction.client.users.fetch(mention.id);
    const response = await axios.get(`http://localhost:30009/verify/${user.username}`);
    const { isUserRegistered } = response.data;

    if (isUserRegistered) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.green)
            .setTitle('Verified User')
            .setDescription(`${user.username} is a verified user.`)
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    } else {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Not Verified')
            .setDescription(`${user.username} is not a verified user.`)
            .setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching user from Discord:', error.message);
    return interaction.reply('Error fetching user from Discord');
  }
}

module.exports = {
  name: 'check',
  description: 'Check if a user is verified.',
  options: [
    {
      name: 'user',
      type: 'USER',
      description: "View a user's vouch count and reviews",
      required: true,
    }
  ],
  execute,
};
