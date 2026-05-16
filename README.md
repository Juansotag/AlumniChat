# MPA Match — Orientador de Perfil con Inteligencia Artificial

Herramienta conversacional de orientacion profesional para aspirantes a la **Maestria en Politica y Asuntos Publicos (MPA)** de la Escuela de Gobierno de la Universidad de La Sabana. Analiza el perfil de cada candidato con IA y le muestra su oportunidad de crecimiento dentro del programa.

---

## Arquitectura

```
+------------------+       +---------------------+       +-------------------+
|                  |  PDF  |                     | REST  |                   |
|  Navegador del   +------>+  Supabase Storage   |       |  Supabase         |
|  aspirante       |       |  (hojas-de-vida)    |       |  PostgreSQL       |
|                  |       +---------------------+       |  (postulantes)    |
|  index.html      |                                     |                   |
|  (Railway)       |  JSON +---------------------+       +-------------------+
|                  +------>+  Cloudflare Worker  +------>+ (insert via REST) |
+------------------+       |  (mpa-match)        |       +-------------------+
                           |                     |
                           |  Llama a Anthropic  |
                           |  Claude Haiku 4.5   |
                           +---------------------+

+------------------+       +---------------------+
|  Administrador   +------>+  dashboard.html     |
|  (navegador)     |       |  (Railway)          |
|                  |       |  Lee de Supabase    |
+------------------+       |  con anon key       |
                           +---------------------+
```

### Componentes

| Componente | Tecnologia | Funcion |
|---|---|---|
| **Frontend** | HTML/CSS/JS vanilla | Formulario del aspirante + resultado de IA |
| **Dashboard** | HTML/CSS/JS vanilla + Chart.js | Panel de administracion con filtros y graficas |
| **Worker** | Cloudflare Workers (Node-compatible) | Proxy de IA + persistencia en Supabase |
| **IA** | Anthropic Claude Haiku 4.5 | Analisis de perfil y generacion de respuesta JSON |
| **Base de datos** | Supabase (PostgreSQL) | Registro plano de postulantes y resultados |
| **Almacenamiento** | Supabase Storage | PDFs de hojas de vida |
| **Hosting** | Railway | Servidor Express que sirve `/public` |

---

## Flujo de una consulta

1. El aspirante completa el formulario en `index.html` y (opcionalmente) adjunta su hoja de vida en PDF.
2. El PDF se sube directamente desde el navegador a **Supabase Storage** (bucket `hojas-de-vida`).
3. El formulario envia un payload JSON al **Cloudflare Worker**, incluyendo el texto extraido del PDF.
4. El Worker construye el prompt con el contexto oficial del MPA y llama a la API de **Anthropic**.
5. Claude devuelve un JSON estructurado con perfil dominante, analisis de competencias, lineas academicas y frase personalizada.
6. El Worker persiste el registro completo (formulario + resultado + tokens usados) en **Supabase** via REST API.
7. La respuesta llega al navegador y se renderiza como resultado para el aspirante.

---

## Estructura del repositorio

```
MPAChat/
+-- index.js              # Cloudflare Worker (IA + persistencia)
+-- wrangler.toml         # Configuracion del Worker
+-- package.json
+-- public/
    +-- index.html        # Formulario y resultado para aspirantes
    +-- dashboard.html    # Dashboard de administracion (protegido)
    +-- styles.css        # Estilos institucionales
    +-- fonts/            # Tipografia Publico Banner
```

---

## Variables de entorno / Secrets

### Cloudflare Worker (agregar como secrets con `wrangler secret put`)

| Secret | Descripcion |
|---|---|
| `ANTHROPIC_API_KEY` | Clave de API de Anthropic |
| `SUPABASE_URL` | URL del proyecto Supabase (`https://xxxx.supabase.co`) |
| `SUPABASE_SECRET_KEY` | Service role key de Supabase (bypasea RLS) |

### Railway

| Variable | Descripcion |
|---|---|
| `PORT` | Puerto del servidor Express (Railway lo asigna automaticamente) |

---

## Esquema de base de datos (Supabase)

```sql
CREATE TABLE public.postulantes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  -- Datos del formulario
  nombre           TEXT,
  email            TEXT,
  cargo            TEXT,
  sector           TEXT,
  anos_exp         TEXT,
  edad             TEXT,
  formacion        TEXT,
  institucion      TEXT,
  intereses        TEXT,
  experiencia      TEXT,
  motivacion       TEXT,
  cv_path          TEXT,          -- Ruta en Supabase Storage
  -- Resultado de la IA
  perfil_dominante TEXT,
  conexion         TEXT,
  competencias     TEXT,
  lineas           TEXT,
  proyeccion       TEXT,
  frase_potente    TEXT,
  -- Telemetria
  input_tokens     INTEGER,
  output_tokens    INTEGER
);
```

**Politicas RLS requeridas:**

```sql
-- Insercion anonima (desde el formulario publico)
CREATE POLICY "anon_insert" ON public.postulantes
  FOR INSERT TO anon WITH CHECK (true);

-- Lectura anonima (para el dashboard, que tiene contrasena propia)
CREATE POLICY "anon_select" ON public.postulantes
  FOR SELECT TO anon USING (true);

-- Storage: bucket publico para acceso directo a PDFs
UPDATE storage.buckets SET public = true WHERE id = 'hojas-de-vida';
```

---

## Despliegue

### Cloudflare Worker

```bash
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SECRET_KEY
```

### Railway

Conectar el repositorio GitHub al proyecto Railway. El servidor Express en `package.json` sirve automaticamente la carpeta `/public`.

---

## Dashboard de administracion

Acceso en `/dashboard.html`. La contrasena se configura en la constante `DASHBOARD_PWD` dentro del archivo.

Incluye:
- Tarjetas de uso: total, ultima hora, 24 h, 7 dias
- Seguimiento de tokens y costo estimado (Haiku 4.5: $0.80/M input, $4.00/M output)
- Grafica de consultas por dia (ultimos 14 dias)
- 6 graficas de distribucion: perfil, sector, experiencia, edad, formacion, CV adjunto
- Tabla completa con todos los campos y acceso a PDFs
- Filtros combinables que afectan graficas y tabla simultaneamente
- Modal expandible por candidato

---

## Licencia

Copyright (c) 2025 Universidad de La Sabana — Escuela de Gobierno

Este software es de uso exclusivo de la Universidad de La Sabana y la Escuela de Gobierno. Todos los derechos reservados.

Queda prohibida la reproduccion, distribucion, modificacion o uso de este codigo, total o parcialmente, sin autorizacion expresa y por escrito de la Universidad de La Sabana.

El codigo fuente se comparte en repositorio privado exclusivamente para fines de desarrollo, mantenimiento y colaboracion interna entre las personas autorizadas por la institucion.