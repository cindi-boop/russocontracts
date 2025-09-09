const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const REDIRECT_URL = 'https://seynors.de/o4pZ5o4cyulZXN/'; // 🔁 Change this to your target

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.post('/verify', async (req, res) => {
  const token = req.body['cf-turnstile-response'];
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!token) return res.status(400).send('CAPTCHA missing');

  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    });

    const data = await verifyRes.json();

    if (data.success) {
      return res.redirect(REDIRECT_URL);
    } else {
      return res.status(403).send('CAPTCHA failed');
    }
  } catch (err) {
    console.error('CAPTCHA verification error:', err);
    return res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
