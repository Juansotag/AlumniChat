/**
 * Match Profesional MPA — Cloudflare Worker
 * Backend proxy que protege la API key de Anthropic.
 *
 * SECRETS REQUERIDOS EN CLOUDFLARE (Settings → Variables → Secrets):
 *   ANTHROPIC_API_KEY       — sk-ant-...
 *   GOOGLE_SHEET_ID         — ID del Google Sheet (parte de la URL)
 *   GOOGLE_DRIVE_FOLDER_ID  — ID de la carpeta de Google Drive
 *   GOOGLE_SERVICE_ACCOUNT  — JSON completo del service account (stringificado)
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/* ── Contexto oficial del MPA (no se toca desde el cliente) ─────────────── */
const MPA_CONTEXT = `
MAESTRÍA EN ADMINISTRACIÓN PÚBLICA (MPA) — Escuela de Gobierno · Universidad de La Sabana

PERFIL DEL GRADUADO:
El graduado del MPA es un líder, estratega y gerente de lo público: integra liderazgo humanizador
y rigor técnico para tomar decisiones éticas, sostenibles y gobernables, las cuales se traducen en
resultados que crean valor público y mejoran la vida de las personas y comunidades a las que sirven.

TRES COMPETENCIAS DEL GRADUADO:
1. LÍDER — Genera confianza y credibilidad ejerciendo un liderazgo virtuoso, con transparencia y
   orientación al bien común, en entornos institucionales complejos.
2. ESTRATEGA — Toma decisiones responsables en entornos complejos y cambiantes, aplicando
   pensamiento estratégico y comunicándolas con claridad.
3. GERENTE — Crea valor público medible y sostenible, combinando herramientas de gerencia pública
   para administrar organizaciones y recursos con eficiencia.

ONCE RESULTADOS DE APRENDIZAJE:
RA1  – Ejerce liderazgo ético y humanizador en situaciones de tensión institucional, sosteniendo
       decisiones conforme a principios de integridad pública verificables.
RA2  – Concerta con actores diversos y conduce equipos heterogéneos hacia propósitos compartidos,
       gestionando crisis institucionales y sosteniendo decisiones bajo presión en entornos de baja
       confianza y alta conflictividad.
RA3  – Comunica con efectividad sus decisiones, construyendo legitimidad institucional con
       capacidad de interlocución ante ciudadanía, medios, equipos y órganos de control en
       escenarios de alta complejidad.
RA4  – Analiza entornos políticos, jurídicos, económicos y territoriales complejos, identificando
       actores, riesgos y escenarios con rigor metodológico.
RA5  – Interpreta evidencia cuantitativa y cualitativa para evaluar el impacto de políticas
       públicas y argumentar técnicamente sus resultados.
RA6  – Construye coaliciones alrededor de la ruta de mayor valor público, a partir de la
       deliberación sobre alternativas de acción y sus trade-offs éticos, técnicos y de
       gobernabilidad.
RA7  – Toma decisiones estratégicas fundamentadas en evidencia y juicio prudencial, asegurando
       viabilidad jurídica, política, económica y territorial, y gobernabilidad sostenible en el
       tiempo.
RA8  – Diagnostica problemas públicos con rigor analítico e indicadores verificables, identificando
       retos reales de política pública latinoamericana.
RA9  – Diseña políticas y programas públicos basados en evidencia, con indicadores de resultado,
       impacto y sostenibilidad verificables, y viabilidad política, técnica y financiera.
RA10 – Implementa acciones de política territorialmente diferenciadas, operando en sistemas de
       gobernanza multinivel y articulando planeación, coordinación interinstitucional y gestión
       del territorio en contextos de alta complejidad.
RA11 – Evalúa organizaciones, recursos y procesos del ciclo de política pública, monitoreando
       resultados, ajustando con base en evidencia e integrando aprendizajes para asegurar
       rendición de cuentas y valor público.

SEIS LÍNEAS ACADÉMICAS:
L1 – Liderazgo Público Humanizador
     Carácter ético del líder, equipos y negociación, decisión bajo presión, gerencia estratégica
     e implementación en lo público.
L2 – Economía para la Gerencia Pública
     Fundamentos microeconómicos y macroeconómicos, políticas basadas en evidencia (inferencia
     causal, evaluación de impacto), economía aplicada a decisiones de gobierno, gestión fiscal.
L3 – Comunicación Pública
     Estrategias de comunicación política, construcción de narrativas e imagen pública, comunicación
     pública efectiva, vocería en alta complejidad y manejo de crisis.
L4 – Instituciones, Gobernanza y Contexto Global
     Arquitectura institucional y gobernanza, la política de las políticas públicas (jugadores de
     veto, coaliciones, ventanas de oportunidad), gerencia pública en el contexto global.
L5 – Gobernanza Territorial para el Desarrollo
     Gobernanza local e instituciones democráticas, planeación estratégica y desarrollo territorial,
     territorio, seguridad y construcción de paz-convivencia.
L6 – Laboratorios de Soluciones para Problemas Públicos (3 semestres consecutivos)
     Lab 1 (S1): Diagnóstico, framing y diseño → producto: Assessment de Problemas Públicos.
     Lab 2 (S2): Formulación de políticas e instrumentos → producto: Plan de Acción.
     Lab 3 (S3): Ejecución, seguimiento y evaluación → producto: Simulador de Escenarios.
     Los tres laboratorios articulan el ciclo completo de política pública sobre un reto real.

FORMATO DEL PROGRAMA:
Duración: 3 semestres. Modalidad mixta: 50% presencial (priorizada al inicio de cada semestre),
50% virtual. Inicio: agosto 2026. Universidad de La Sabana, Chía (Cundinamarca), Colombia.
`.trim();

const SYSTEM_PROMPT = `Eres el orientador profesional del Match Profesional MPA de la Escuela de Gobierno de la
Universidad de La Sabana. Tu misión es mostrarle a cada aspirante con claridad y calidez cuál es su
OPORTUNIDAD DE CRECIMIENTO dentro del perfil del graduado MPA: si el programa fortalecerá más sus
habilidades como Líder, como Estratega o como Gerente de lo público, y por qué.

PRINCIPIOS IRROMPIBLES:
- Nunca evalúes si alguien "sirve" o "no sirve" para el programa. Nunca uses lenguaje de admisión
  o selección. Habla siempre en clave de orientación y crecimiento.
- El eje central del análisis es la OPORTUNIDAD: ¿dónde puede esta persona crecer más con el MPA?
  ¿En qué competencia o dimensión del perfil del graduado tiene mayor potencial de desarrollo?
- TODO lo que digas sobre el programa debe salir exclusivamente del contexto oficial que tienes.
  No inventes materias, perfiles, metodologías ni cifras que no estén en el contexto.
- Habla en español colombiano: cálido, cercano, profesional. Evita jerga corporativa fría.
  Usa "tú" (tuteo). No uses el saludo "Hola". Empieza directamente con el análisis.
- Sé específico: conecta lo que la persona compartió con elementos CONCRETOS del programa.
  Una respuesta genérica que podría aplicar a cualquier aspirante es un fracaso.

CONTEXTO OFICIAL DEL PROGRAMA:
${MPA_CONTEXT}

FORMATO DE RESPUESTA — responde ÚNICAMENTE con este JSON válido, sin markdown, sin texto adicional:
{
  "perfil_dominante": ["Líder", "Estratega", "Gerente"],
  "conexion": "2-3 párrafos que conecten la trayectoria específica del aspirante con el perfil del MPA. Menciona elementos concretos de lo que compartió.",
  "competencias": "Prosa (sin bullets ni listas numeradas) explicando qué competencias del MPA puede FORTALECER esta persona y por qué el programa es su oportunidad de crecimiento en esa dimensión.",
  "lineas": "2-3 líneas académicas que más le aportarían para desarrollar su oportunidad de crecimiento, con la conexión explícita a su perfil.",
  "proyeccion": "1-2 párrafos sobre su proyección como graduado/a MPA: qué roles, qué impactos, qué conversaciones podría liderar.",
  "frase_potente": "Una frase única, inspiradora y personalizada (máximo 2 líneas) que resuma su oportunidad de crecimiento en el MPA. Debe sentirse escrita solo para esta persona, con potencia y calidez."
}`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function corsHeaders(origin) {
  /* Ajusta los dominios permitidos según tu sitio */
  const allowed = [
    "https://mpaescueladegobierno.com.co",
    "https://www.mpaescueladegobierno.com.co",
    "https://govlab.up.railway.app",
    "http://localhost:8000",
    "https://mpachat-unisabana.up.railway.app"
  ];
  const allowedOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

/* ── Rate limiting simple (por IP, en memoria — resetea con cada instancia) */
const requestLog = new Map();
const RATE_LIMIT = 5;       // máx solicitudes por ventana
const RATE_WINDOW = 60_000; // ventana de 60 segundos

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    requestLog.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  requestLog.set(ip, entry);
  return false;
}

/* ── Validación y construcción del mensaje ───────────────────────────────── */
function buildUserMessage(body) {
  const { cargo, sector, anos, experiencia, motivacion, intereses, formacion, institucion, edad, cvTexto } = body;
  if (!experiencia?.trim() && !motivacion?.trim()) {
    throw new Error("Comparte al menos tu experiencia o tu motivación.");
  }
  return [
    cargo       && `Cargo actual: ${cargo}`,
    sector      && `Sector: ${sector}`,
    anos        && `Años de experiencia: ${anos}`,
    edad        && `Rango de edad: ${edad}`,
    formacion   && `Nivel de formación más alto alcanzado: ${formacion}`,
    institucion && `Institución donde obtuvo ese título: ${institucion}`,
    experiencia && `Experiencia y logros: ${experiencia}`,
    motivacion  && `Motivación para el MPA: ${motivacion}`,
    intereses   && `Temas de interés: ${intereses}`,
    cvTexto     && `Hoja de vida (texto):\n${cvTexto}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ── Google Sheets: registrar metadatos ─────────────────────────────────── */
async function logToSheet(env, body, result) {
  try {
    const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);
    const token = await getGoogleAccessToken(sa);

    const sheetId = env.GOOGLE_SHEET_ID;
    const range = "Registros!A:M";
    const now = new Date().toISOString();

    const row = [
      now,
      body.cargo || "",
      body.sector || "",
      body.anos || "",
      body.edad || "",
      body.formacion || "",
      body.institucion || "",
      body.intereses || "",
      body.experiencia?.substring(0, 300) || "",
      body.motivacion?.substring(0, 300) || "",
      (result.perfil_dominante || []).join(", "),
      result.frase_potente || "",
      body.cvTexto ? "Sí" : "No",
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      }
    );
  } catch (e) {
    console.error("Error logging to sheet:", e.message);
    // No interrumpimos la respuesta al usuario si el log falla
  }
}

/* ── Google Drive: subir hoja de vida en texto ───────────────────────────── */
async function uploadCvToDrive(env, body) {
  if (!body.cvTexto?.trim()) return null;
  try {
    const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);
    const token = await getGoogleAccessToken(sa);
    const folderId = env.GOOGLE_DRIVE_FOLDER_ID;

    const fileName = `CV_${(body.cargo || "aspirante").replace(/\s+/g, "_")}_${Date.now()}.txt`;
    const content = [
      `Cargo: ${body.cargo || ""}`,
      `Sector: ${body.sector || ""}`,
      `Edad: ${body.edad || ""}`,
      `Formación: ${body.formacion || ""} — ${body.institucion || ""}`,
      `Experiencia: ${body.experiencia || ""}`,
      `Motivación: ${body.motivacion || ""}`,
      `--- HOJA DE VIDA ---`,
      body.cvTexto,
    ].join("\n\n");

    const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
    const boundary = "boundary_mpa_cv";
    const multipart = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      metadata,
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      content,
      `--${boundary}--`,
    ].join("\r\n");

    await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    });
  } catch (e) {
    console.error("Error uploading CV to Drive:", e.message);
  }
}

/* ── JWT / OAuth2 para Google APIs ──────────────────────────────────────── */
async function getGoogleAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claim = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const toSign = `${header}.${claim}`;
  const key = await importRsaKey(sa.private_key);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(toSign));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${toSign}.${sigB64}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const { access_token } = await res.json();
  return access_token;
}

async function importRsaKey(pem) {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8", der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );
}

/* ── Handler principal ───────────────────────────────────────────────────── */
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Método no permitido." }, 405, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (isRateLimited(ip)) {
      return jsonResponse({ error: "Demasiadas solicitudes. Espera un momento." }, 429, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Body inválido." }, 400, origin);
    }

    let userMessage;
    try {
      userMessage = buildUserMessage(body);
    } catch (err) {
      return jsonResponse({ error: err.message }, 400, origin);
    }

    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analiza el perfil de este aspirante al MPA:\n\n${userMessage}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      console.error("Anthropic error:", err);
      return jsonResponse(
        { error: "Error al procesar la solicitud. Intenta de nuevo." },
        502,
        origin
      );
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || "";

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error("JSON parse error. Raw text:", text);
      return jsonResponse(
        { error: "Error al interpretar la respuesta. Intenta de nuevo." },
        500,
        origin
      );
    }

    // Guardar en Google Sheets y Drive de forma asíncrona (no bloqueante)
    if (env.GOOGLE_SERVICE_ACCOUNT && env.GOOGLE_SHEET_ID) {
      const ctx = { waitUntil: (p) => p }; // fallback si no hay ctx
      Promise.all([
        logToSheet(env, body, parsed),
        uploadCvToDrive(env, body),
      ]).catch(console.error);
    }

    return jsonResponse({ ok: true, result: parsed }, 200, origin);
  },
};
