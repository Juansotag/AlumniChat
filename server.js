const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Sirve todo lo que esté en /public como archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta raíz explícita por si acaso
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`MPA Match corriendo en http://localhost:${port}`);
});
