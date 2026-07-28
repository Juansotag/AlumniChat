const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Sirve la carpeta /public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint Proxy 1: Parsear Hoja de Vida (PDF)
app.post('/api/parse-cv', async (req, res) => {
  try {
    const workerRes = await fetch('https://alumni-chat.unisabana-alumni.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'parse_cv', ...req.body })
    });
    const data = await workerRes.json();
    res.status(workerRes.status).json(data);
  } catch (err) {
    console.error('[Express Parse CV Error]:', err.message);
    res.status(500).json({ error: 'Error en el proxy local: ' + err.message });
  }
});

// Endpoint Proxy 2: Generar Top 5 Ranking de Posgrados UniSabana
app.post('/api/match', async (req, res) => {
  try {
    const workerRes = await fetch('https://alumni-chat.unisabana-alumni.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'match_top5', ...req.body })
    });
    const data = await workerRes.json();
    res.status(workerRes.status).json(data);
  } catch (err) {
    console.error('[Express Proxy Error]:', err.message);
    res.status(500).json({ error: 'Error en el proxy local: ' + err.message });
  }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`AlumniChat corriendo en http://localhost:${port}`);
});
