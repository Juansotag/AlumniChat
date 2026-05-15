# Match Profesional MPA — Guía de despliegue

Herramienta de orientación profesional para aspirantes al MPA de la Escuela de Gobierno,
Universidad de La Sabana. Usa Claude Haiku como motor de análisis.

---

## Estructura del proyecto

```
mpa-match/
├── worker/
│   ├── index.js        ← Cloudflare Worker (backend, protege la API key)
│   └── wrangler.toml   ← Configuración del Worker
└── frontend/
    └── widget.html     ← Página HTML autocontenida para el sitio
```

---

## Paso 1 — Desplegar el Cloudflare Worker

### Opción A: desde el dashboard (sin instalar nada)

1. Ve a https://dash.cloudflare.com/ e inicia sesión (o crea cuenta gratis).
2. En el menú izquierdo: **Workers & Pages → Create → Create Worker**.
3. Dale un nombre, por ejemplo `mpa-match`.
4. Haz clic en **Edit code** y pega todo el contenido de `worker/index.js`.
5. Haz clic en **Deploy**.
6. Ve a **Settings → Variables → Secrets** y agrega:
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: tu clave de Anthropic (empieza con `sk-ant-...`)
   - Haz clic en **Encrypt & Save**.
7. Anota la URL del Worker, se ve así:
   `https://mpa-match.TU-USUARIO.workers.dev`

### Opción B: desde la terminal con Wrangler (para devs)

```bash
npm install -g wrangler
wrangler login
cd worker/
wrangler deploy
wrangler secret put ANTHROPIC_API_KEY
# → pega tu clave cuando la pida
```

---

## Paso 2 — Configurar los dominios permitidos (CORS)

En `worker/index.js`, busca esta sección y ajusta los dominios:

```js
const allowed = [
  "https://mpaescueladegobierno.com.co",
  "https://www.mpaescueladegobierno.com.co",
];
```

Agrega cualquier otro dominio desde donde se vaya a usar la herramienta
(p. ej. un dominio de staging). Luego vuelve a desplegar el Worker.

---

## Paso 3 — Conectar el frontend al Worker

En `frontend/widget.html`, busca esta línea cerca del final:

```js
const WORKER_URL = "https://mpa-match.TU-USUARIO.workers.dev";
```

Reemplaza la URL por la que obtuviste en el Paso 1.

---

## Paso 4 — Publicar en el sitio

### Si el sitio es WordPress / página estática

Sube `widget.html` al servidor y publícala en la ruta que prefieras,
por ejemplo: `https://mpaescueladegobierno.com.co/match`

### Si quieres incrustarlo como sección dentro de una página existente

Extrae el contenido entre `<body>` y `</body>` del `widget.html` e incórporalo
en la plantilla del sitio. Los estilos están dentro del `<head>` del archivo —
cópialos también (o pásalos al CSS del tema).

### Si quieres incrustarlo con un iframe (más simple, sin tocar el tema)

En la página de destino, agrega:
```html
<iframe
  src="https://mpaescueladegobierno.com.co/match/widget.html"
  style="width:100%; border:none; min-height:700px;"
  title="Match Profesional MPA">
</iframe>
```

---

## Costo estimado

| Componente       | Costo estimado                                      |
|------------------|-----------------------------------------------------|
| Cloudflare Worker| Gratis hasta 100.000 solicitudes/día               |
| Claude Haiku     | ~$0.008 por análisis completo (3.000–5.000 tokens) |
| 300 aspirantes   | ~$2.40 USD total de API                             |

---

## Rate limiting incluido

El Worker bloquea automáticamente más de **5 solicitudes por IP en 60 segundos**
para evitar abusos. Si necesitas ajustar estos valores, edita estas líneas en
`worker/index.js`:

```js
const RATE_LIMIT  = 5;        // máx solicitudes por ventana
const RATE_WINDOW = 60_000;   // ventana en milisegundos (60s)
```

---

## Personalización del contenido

El System Prompt y el contexto del MPA están en `worker/index.js`, variables
`MPA_CONTEXT` y `SYSTEM_PROMPT`. Si el programa actualiza sus líneas, competencias
o resultados de aprendizaje, edita esas variables y vuelve a desplegar el Worker.
El frontend no necesita cambios.

---

## Soporte

Desarrollado por GovLab para la Escuela de Gobierno de la Universidad de La Sabana.
