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
  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 20px;
  }
  .btn {
    display: inline-block;
    padding: 10px 24px;
    border-radius: 50px;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
    cursor: pointer;
  }
  .btn-primary {
    border: 1px solid #b44fff;
    color: #b44fff;
    background: none;
  }
  .btn-primary:hover { background: #b44fff; color: #000; }
  .btn-secondary {
    border: 1px solid #00f0ff;
    color: #00f0ff;
    background: none;
  }
  .btn-secondary:hover { background: #00f0ff; color: #000; }
  .time-tabs {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 0 20px 20px;
  }
  .time-tab {
    padding: 6px 16px;
    border-radius: 50px;
    border: 1px solid #2e2e50;
    color: #aaa;
    text-decoration: none;
    font-size: 0.8rem;
    transition: all 0.2s;
  }
  .time-tab.active {
    border-color: #b44fff;
    color: #b44fff;
    background: rgba(180,79,255,0.1);
  }
  .time-tab:hover { border-color: #b44fff; color: #b44fff; }
  .cards {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 20px 20px 40px;
  }
  .card {
    position: relative;
    background: #1a1a2e;
    border: 1px solid #2e2e50;
    border-radius: 16px;
    padding: 28px;
    width: 300px;
    box-shadow: 0 0 30px rgba(180,79,255,0.1);
  }
  .remove-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    color: #555;
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
    text-decoration: none;
  }
  .remove-btn:hover { color: #ff4444; }
  .profile {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .profile-img {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #b44fff;
  }
  .profile-placeholder {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #2e2e50;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    border: 2px solid #b44fff;
  }
  .profile-info h2 {
    font-size: 1.1rem;
    color: #b44fff;
    margin-bottom: 2px;
  }
  .profile-info .username {
    font-size: 0.8rem;
    color: #888;
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
    flex-shrink: 0;
  }
  .track-img, .artist-img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
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
  .spotify-link {
    color: inherit;
    text-decoration: none;
    display: block;
  }
  .spotify-link:hover .track-name,
  .spotify-link:hover .artist-name { color: #1db954; }
  .common-section {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 20px 40px;
  }
  .common-section h2 {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #00f0ff;
    margin-bottom: 16px;
    text-align: center;
  }
  .common-grid {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .common-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #1a1a2e;
    border: 1px solid #2e2e50;
    border-radius: 12px;
    padding: 10px 14px;
    text-decoration: none;
    color: #fff;
    transition: border-color 0.2s;
  }
  .common-item:hover { border-color: #1db954; }
  .common-item img {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    object-fit: cover;
  }
  .common-item span { font-size: 0.85rem; font-weight: 600; }
  .empty { color: #888; text-align: center; padding: 40px; }
  @media (max-width: 768px) {
    header h1 { font-size: 1.8rem; }
    .card { width: 100%; max-width: 400px; }
    .cards { padding: 20px 16px; }
  }
`;

const users = {};

async function fetchUserData(accessToken, timeRange) {
  const [tracksRes, artistsRes] = await Promise.all([
    axios.get(`https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=${timeRange}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    axios.get(`https://api.spotify.com/v1/me/top/artists?limit=5&time_range=${timeRange}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  ]);
  return {
    topTracks: tracksRes.data.items,
    topArtists: artistsRes.data.items,
  };
}

function getCommonItems(userList, key, idKey) {
  if (userList.length < 2) return [];
  const sets = userList.map(u => new Set(u[key].map(i => i[idKey])));
  const allItems = userList.flatMap(u => u[key]);
  const commonIds = [...sets[0]].filter(id => sets.every(s => s.has(id)));
  const seen = new Set();
  return commonIds.map(id => allItems.find(i => i[idKey] === id)).filter(i => {
    if (seen.has(i[idKey])) return false;
    seen.add(i[idKey]);
    return true;
  });
}

app.get('/', async (req, res) => {
  const timeRange = req.query.time || 'short_term';
  const userList = Object.values(users);

  const updatedUsers = await Promise.all(userList.map(async u => {
    if (u.dataByRange && u.dataByRange[timeRange]) {
      return { ...u, ...u.dataByRange[timeRange] };
    }
    try {
      const data = await fetchUserData(u.accessToken, timeRange);
      if (!u.dataByRange) u.dataByRange = {};
      u.dataByRange[timeRange] = data;
      return { ...u, ...data };
    } catch {
      return u;
    }
  }));

  const commonTracks = getCommonItems(updatedUsers, 'topTracks', 'id');
  const commonArtists = getCommonItems(updatedUsers, 'topArtists', 'id');

  const userCards = updatedUsers.map(u => `
    <div class="card">
      <a class="remove-btn" href="/remove/${u.id}" title="Kaldır">✕</a>
      <div class="profile">
        ${u.avatar
          ? `<img class="profile-img" src="${u.avatar}" />`
          : `<div class="profile-placeholder">🎵</div>`}
        <div class="profile-info">
          <h2>${u.display_name}</h2>
          <div class="username">@${u.id}</div>
        </div>
      </div>
      <h3>🎵 İlk 5 Şarkın</h3>
      ${(u.topTracks || []).map((t, i) => `
        <a class="spotify-link" href="${t.external_urls.spotify}" target="_blank">
          <div class="track-item">
            <span class="rank">${i + 1}</span>
            <img class="track-img" src="${t.album.images[2]?.url || ''}" />
            <div class="track-info">
              <div class="track-name">${t.name}</div>
              <div class="track-artist">${t.artists[0].name}</div>
            </div>
          </div>
        </a>
      `).join('')}
      <h3>🎤 İlk 5 Sanatçın</h3>
      ${(u.topArtists || []).map((a, i) => `
        <a class="spotify-link" href="${a.external_urls.spotify}" target="_blank">
          <div class="artist-item">
            <span class="rank">${i + 1}</span>
            <img class="artist-img" src="${a.images[2]?.url || ''}" />
            <div class="artist-info">
              <div class="artist-name">${a.name}</div>
            </div>
          </div>
        </a>
      `).join('')}
      <a class="btn btn-secondary" href="/refresh/${u.id}?time=${timeRange}" style="display:block;text-align:center;margin-top:16px;font-size:0.8rem;">🔄 Yenile</a>
    </div>
  `).join('');

  const commonTracksHTML = commonTracks.length > 0
    ? commonTracks.map(t => `
        <a class="common-item" href="${t.external_urls.spotify}" target="_blank">
          <img src="${t.album.images[2]?.url || ''}" />
          <span>${t.name}</span>
        </a>
      `).join('')
    : '<p class="empty">Henüz ortak şarkı yok</p>';

  const commonArtistsHTML = commonArtists.length > 0
    ? commonArtists.map(a => `
        <a class="common-item" href="${a.external_urls.spotify}" target="_blank">
          <img src="${a.images[2]?.url || ''}" style="border-radius:50%" />
          <span>${a.name}</span>
        </a>
      `).join('')
    : '<p class="empty">Henüz ortak sanatçı yok</p>';

  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kim ne dinliyor?</title>
      <style>${CSS}</style>
    </head>
    <body>
      <header>
        <h1>Kim ne dinliyor?</h1>
        <p>Arkadaşlarınla müzik zevkini karşılaştır</p>
      </header>
      <div class="actions">
        <a class="btn btn-primary" href="/login">+ Hesap Ekle</a>
      </div>
      <div class="time-tabs">
        <a class="time-tab ${timeRange === 'short_term' ? 'active' : ''}" href="/?time=short_term">Son 4 Hafta</a>
        <a class="time-tab ${timeRange === 'medium_term' ? 'active' : ''}" href="/?time=medium_term">Son 6 Ay</a>
        <a class="time-tab ${timeRange === 'long_term' ? 'active' : ''}" href="/?time=long_term">Tüm Zamanlar</a>
      </div>
      <div class="cards">
        ${userCards.length > 0 ? userCards : '<p class="empty">Henüz kimse eklenmedi. Yukarıdan hesap ekle!</p>'}
      </div>
      ${updatedUsers.length >= 2 ? `
        <div class="common-section">
          <h2>🤝 Ortak Şarkılar</h2>
          <div class="common-grid">${commonTracksHTML}</div>
          <h2 style="margin-top:32px">🤝 Ortak Sanatçılar</h2>
          <div class="common-grid">${commonArtistsHTML}</div>
        </div>
      ` : ''}
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

    const [profileRes, data] = await Promise.all([
      axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      fetchUserData(accessToken, 'short_term')
    ]);

    const userId = profileRes.data.id;
    users[userId] = {
      id: userId,
      display_name: profileRes.data.display_name,
      avatar: profileRes.data.images?.[0]?.url || null,
      accessToken,
      dataByRange: { short_term: data },
      ...data
    };

    res.redirect('/');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send('Bir hata oluştu.');
  }
});

app.get('/refresh/:userId', async (req, res) => {
  const timeRange = req.query.time || 'short_term';
  const user = users[req.params.userId];
  if (!user) return res.redirect('/');
  try {
    const data = await fetchUserData(user.accessToken, timeRange);
    if (!user.dataByRange) user.dataByRange = {};
    user.dataByRange[timeRange] = data;
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
  res.redirect(`/?time=${timeRange}`);
});

app.get('/remove/:userId', (req, res) => {
  delete users[req.params.userId];
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: port ${PORT}`);
});
