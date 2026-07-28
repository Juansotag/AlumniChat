# AlumniChat — Orientador de Posgrados Universidad de La Sabana

**AlumniChat** es la herramienta inteligente de orientación profesional para egresados y aspirantes a posgrados de la **Universidad de La Sabana**. Analiza la trayectoria profesional del candidato mediante Inteligencia Artificial a partir de su Hoja de Vida (PDF) y genera un **Ranking Top 5 de Posgrados** (con calificación de 0 a 100, justificaciones y enlaces oficiales) alineado a sus metas laborales a 5 años.

---

## Flujo en 4 Pasos

1. **Subida de Hoja de Vida (PDF)**: El aspirante carga únicamente su Hoja de Vida en PDF.
2. **Extracción Automatizada (IA)**: El backend procesa el PDF y autodiligencia un formulario dinámico compuesto por:
   - **Experiencias Laborales**: Cargo, empresa, fechas inicio/fin, trabajo actual (sí/no), funciones principales y logros.
   - **Formaciones Académicas**: Tipo (*Curso informal, Diplomado, Técnico, Tecnólogo, Pregrado, Posgrado, Doctorado, Estudio post-doctoral*), título, institución y fechas.
3. **Proyección Estratégica**: El aspirante completa sus planes laborales a 5 años y sus expectativas de un posgrado UniSabana.
4. **Ranking Top 5 y Persistencia**:
   - Claude Haiku 4.5 evalúa el perfil frente a los 145 posgrados UniSabana y devuelve el Top 5 con calificación 0-100, impacto laboral/personal y enlaces oficiales.
   - El PDF se almacena en **Supabase Storage** (`hojas-de-vida`) y el registro JSON en **Supabase PostgreSQL** (`postulantes`).

---

## Arquitectura del Proyecto

```
AlumniChat/
├── index.js                     # Cloudflare Worker (Extracción de CV + Ranking Top 5 + Supabase)
├── server.js                    # Servidor Express (Railway) + Proxy local (/api/parse-cv, /api/match)
├── wrangler.toml                # Configuración del Worker (name = "alumni-chat")
├── package.json                 # Dependencias Node.js
├── data/
│   ├── catalog.json             # Catálogo JSON con 145 posgrados UniSabana
│   └── catalog_formatted.js     # Catálogo JS exportado para el prompt de IA
├── scripts/
│   └── build_prompt_catalog.py  # Conversor Python desde Excel
└── public/
    ├── index.html               # Interfaz del aspirante por pasos (PDF.js + Supabase JS)
    ├── dashboard.html           # Panel de administración (Chart.js + Supabase DB)
    └── styles.css               # Sistema de diseño de AlumniChat
```

---

## Ejecución Local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Licencia

Copyright (c) 2026 Universidad de La Sabana — Oficina de Alumni. Todos los derechos reservados.