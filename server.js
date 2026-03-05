require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const SCOPES = [
  'user-top-read',
  'user-read-recently-played',
  'user-read-currently-playing'
].join(' ');

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0d0d1a;
    color: #fff;
    font-family: 'Segoe UI', sans-serif;
    min-height: 100vh;
  }
  header {
    text-align: center;
    padding: 40px 20px 20px;
  }
  header h1 {
    font-size: 2.5rem;
    background: linear-gradient(90deg, #b44fff, #00f0ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
  }
  header p { color: #aaa; font-size: 1rem; }
  .login-btn {
    display: inline-block;
    margin-top: 30px;
    padding: 14px 36px;
    background: linear-gradient(90deg, #b44fff, #00f0ff);
    color: #000;
    font-weight: bold;
    font-size: 1rem;
    border-radius: 50px;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .login-btn:hover { opacity: 0.85; }
  .cards {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 40px 20px;
  }
  .card {
    background: #1a1a2e;
    border: 1px solid #2e2e50;
    border-radius: 16px;
    padding: 28px;
    width: 300px;
    box-shadow: 0 0 30px rgba(180,79,255,0.1);
  }
  .card h2 {
    font-size: 1.2rem;
    margin-bottom: 4px;
    color: #b44fff;
  }
  .card .username {
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 20px;
  }
  .card h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #00f0ff;
    margin: 16px 0 8px;
  }
  .track-item, .artist-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .rank {
    font-size: 0.85rem;
    color: #555;
    width: 16px;
    text-align: center;
  }
  .track-img, .artist-img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
  }
  .artist-img { border-radius: 50%; }
  .track-info, .artist-info { flex: 1; overflow: hidden; }
  .track-name, .artist-name {
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track-artist {
    font-size: 0.75rem;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .add-friend {
    text-align: center;
    padding: 20px;
  }
  .add-friend a {
    display: inline-block;
    padding: 10px 24px;
    border: 1px solid #b44fff;
    color: #b44fff;
    border-radius: 50px;
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .add-friend a:hover { background: #b44fff; color: #000; }
`;

// Kullanıcı verilerini hafızada tutuyoruz
const users = {};

app.get('/', (req, res) => {
  const userCards = Object.values(users).map(u => `
    <div class="card">
      <h2>${u.display_name}</h2>
      <div class="username">@${u.id}</div>
      <h3>🎵 Güncel İlk 5 Şarkın</h3>
      ${u.topTracks.map((t, i) => `
        <div class="track-item">
          <span class="rank">${i + 1}</span>
          <img class="track-img" src="${t.album.images[2]?.url || ''}" />
          <div class="track-info">
            <div class="track-name">${t.name}</div>
            <div class="track-artist">${t.artists[0].name}</div>
          </div>
        </div>
      `).join('')}
      <h3>🎤 Güncel İlk 5 Sanatçın</h3>
      ${u.topArtists.map((a, i) => `
        <div class="artist-item">
          <span class="rank">${i + 1}</span>
          <img class="artist-img" src="${a.images[2]?.url || ''}" />
          <div class="artist-info">
            <div class="artist-name">${a.name}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Kim ne dinliyor?</title>
      <style>${CSS}</style>
    </head>
    <body>
      <header>
        <h1>Kim ne dinliyor?</h1>
        <p>Arkadaşlarınla müzik zevkini karşılaştır</p>
      </header>
      <div class="add-friend">
        <a href="/login">+ Hesap Ekle</a>
      </div>
      <div class="cards">
        ${userCards.length > 0 ? userCards : '<p style="color:#888">Henüz kimse eklenmedi. Yukarıdan hesap ekle!</p>'}
      </div>
    </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokenRes = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const accessToken = tokenRes.data.access_token;

    const [profileRes, tracksRes, artistsRes] = await Promise.all([
      axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      axios.get('https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      axios.get('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    const userId = profileRes.data.id;
    users[userId] = {
      id: userId,
      display_name: profileRes.data.display_name,
      topTracks: tracksRes.data.items,
      topArtists: artistsRes.data.items,
    };

    res.redirect('/');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send('Bir hata oluştu.');
  }
});

app.listen(3000, () => {
  console.log('Sunucu çalışıyor: http://127.0.0.1:3000');
});