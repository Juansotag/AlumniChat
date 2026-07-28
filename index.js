/**
 * AlumniChat — Cloudflare Worker Backend
 * Motor de IA para extracción de Hojas de Vida y Ranking Top 5 de Posgrados UniSabana.
 */

import { UNISABANA_CATALOG_TEXT } from './data/catalog_formatted.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/* ── PROMPTS ─────────────────────────────────────────────────────────────── */

const PARSE_CV_SYSTEM_PROMPT = `Eres un extractor experto de Hojas de Vida (CV) para la Universidad de La Sabana. Tu misión es analizar el texto extraído de un documento PDF de hoja de vida y devolver un JSON estructurado con la información del aspirante.

REGLAS DE EXTRACCIÓN:
1. Extrae únicamente datos reales presentes o deducibles con alta certeza de la hoja de vida. Si algún campo no aparece, usa "".
2. Clasifica cada ítem educativo en una de estas categorías exactas en "tipo":
   - "Curso informal"
   - "Diplomado"
   - "Técnico"
   - "Tecnólogo"
   - "Pregrado"
   - "Posgrado"
   - "Doctorado"
   - "Estudio post-doctoral"
3. Para cada experiencia laboral, indica la fecha de inicio, fecha de fin (o "Actualidad"), si trabaja allí actualmente (true/false), funciones principales y logros destacados.

FORMATO DE RESPUESTA — responde ÚNICAMENTE con este JSON válido, sin markdown:
{
  "nombre": "Nombre completo",
  "email": "correo@ejemplo.com",
  "telefono": "+57 300 000 0000",
  "experiencias": [
    {
      "cargo": "Nombre del cargo",
      "empresa": "Nombre de la empresa o institución",
      "fecha_inicio": "Año o Mes/Año",
      "fecha_fin": "Año o Mes/Año o Actualidad",
      "actualmente": true,
      "funciones": "Descripción de funciones principales",
      "logros": "Principales logros o impacto obtenido"
    }
  ],
  "formaciones": [
    {
      "tipo": "Pregrado",
      "programa": "Nombre del título o carrera",
      "institucion": "Nombre de la universidad o institución",
      "fecha_inicio": "Año o Mes/Año",
      "fecha_fin": "Año o Mes/Año"
    }
  ]
}`;

const MATCH_TOP5_SYSTEM_PROMPT = `Eres el Orientador Profesional de Posgrados de AlumniChat (Universidad de La Sabana). Tu misión es analizar el perfil estructurado completo de un aspirante (experiencia laboral, formación académica previa, sus planes laborales a 5 años y sus expectativas de posgrado) y evaluar frente a la oferta oficial de maestrías y posgrados de la Universidad de La Sabana para seleccionar el **TOP 5 DE POSGRADOS** ideales para su trayectoria.

PRINCIPIOS IRROMPIBLES:
1. Selecciona EXACTAMENTE CINCO (5) programas del catálogo oficial proporcionado abajo, ordenados del ranking 1 al 5 según afinidad.
2. Asigna a cada programa un puntaje numérico de match ("puntaje_match") entre 0 y 100 basado en el grado de alineación de su perfil previo y sus metas a 5 años.
3. Para cada programa argumenta:
   - Justificación detallada del match.
   - Impacto directo en sus planes laborales a 5 años y desarrollo personal.
   - Competencias clave a potenciar.
   - URL oficial tal cual aparece en el catálogo.
4. Habla en español colombiano: cálido, cercano, profesional y motivador. Usa "tú" (tuteo). No uses el saludo "Hola". Empieza directamente con la síntesis del perfil.
5. No utilices "-", "*", ni caracteres markdown dentro de las cadenas JSON.

CATÁLOGO OFICIAL DE POSGRADOS UNISABANA:
${UNISABANA_CATALOG_TEXT}

FORMATO DE RESPUESTA — responde ÚNICAMENTE con este JSON válido, sin markdown:
{
  "sintesis_perfil": "Un párrafo analítico y motivador reconociendo el recorrido del aspirante y su potencial.",
  "top_5": [
    {
      "ranking": 1,
      "nombre_programa": "Nombre exacto del programa",
      "puntaje_match": 95,
      "facultad": "Facultad o Escuela",
      "modalidad": "Modalidad",
      "justificacion": "Explicación detallada de por qué este programa se ajusta a su perfil laboral previo.",
      "impacto_laboral_y_personal": "Cómo contribuirá directamente a sus planes laborales a 5 años y crecimiento personal.",
      "competencias_clave": "Competencias principales que adquirirá.",
      "url": "https://..."
    },
    {
      "ranking": 2,
      "nombre_programa": "...",
      "puntaje_match": 88,
      "facultad": "...",
      "modalidad": "...",
      "justificacion": "...",
      "impacto_laboral_y_personal": "...",
      "competencias_clave": "...",
      "url": "..."
    },
    {
      "ranking": 3,
      "nombre_programa": "...",
      "puntaje_match": 82,
      "facultad": "...",
      "modalidad": "...",
      "justificacion": "...",
      "impacto_laboral_y_personal": "...",
      "competencias_clave": "...",
      "url": "..."
    },
    {
      "ranking": 4,
      "nombre_programa": "...",
      "puntaje_match": 78,
      "facultad": "...",
      "modalidad": "...",
      "justificacion": "...",
      "impacto_laboral_y_personal": "...",
      "competencias_clave": "...",
      "url": "..."
    },
    {
      "ranking": 5,
      "nombre_programa": "...",
      "puntaje_match": 72,
      "facultad": "...",
      "modalidad": "...",
      "justificacion": "...",
      "impacto_laboral_y_personal": "...",
      "competencias_clave": "...",
      "url": "..."
    }
  ],
  "frase_inspiracional": "Frase potente sobre el futuro profesional del candidato en la Universidad de La Sabana."
}`;

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": "*",
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

/* ── Supabase Logging ────────────────────────────────────────────────────── */
async function logToSupabase(env, body, result, usage) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    console.warn("[Supabase] Faltan secrets de configuración.");
    return;
  }
  try {
    const top5 = Array.isArray(result.top_5) ? result.top_5 : [];
    const progsStr = top5.map(r => `#${r.ranking} ${r.nombre_programa} (${r.puntaje_match} pts)`).join("\n");
    const compsStr = top5.map(r => `${r.nombre_programa}: ${r.competencias_clave}`).join("\n\n");
    const proyStr = top5.map(r => `${r.nombre_programa}: ${r.impacto_laboral_y_personal}`).join("\n\n");

    const row = {
      nombre: body.nombre || null,
      email: body.email || null,
      telefono: body.telefono || null,
      cargo: body.experiencias?.[0]?.cargo || null,
      sector: body.experiencias?.[0]?.empresa || null,
      anos_exp: `${body.experiencias?.length || 0} experiencia(s)`,
      edad: body.edad || null,
      formacion: body.formaciones?.[0]?.tipo || null,
      institucion: body.formaciones?.[0]?.institucion || null,
      intereses: body.planes_5_anos || null,
      experiencia: JSON.stringify(body.experiencias || []),
      motivacion: body.expectativas_posgrado || null,
      cv_path: body.cvPath || null,
      perfil_dominante: top5.map(r => `${r.nombre_programa} (${r.puntaje_match}%)`).join(" | ") || result.sintesis_perfil || null,
      conexion: result.sintesis_perfil || null,
      competencias: compsStr || null,
      lineas: progsStr || null,
      proyeccion: proyStr || null,
      frase_potente: result.frase_inspiracional || null,
      input_tokens: usage?.input_tokens || null,
      output_tokens: usage?.output_tokens || null,
    };

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/postulantes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": env.SUPABASE_SECRET_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SECRET_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(row),
      }
    );

    if (!res.ok) {
      console.error("[Supabase] Error HTTP:", res.status, await res.text());
    } else {
      console.log("[Supabase] Registro guardado correctamente.");
    }
  } catch (e) {
    console.error("[Supabase] Excepción:", e.message);
  }
}

/* ── HANDLER PRINCIPAL ───────────────────────────────────────────────────── */
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Método no permitido." }, 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Body JSON inválido." }, 400, origin);
    }

    const action = body.action || "match_top5";

    /* ── ACCIÓN 1: Extraer CV (parse_cv) ─────────────────────────────────── */
    if (action === "parse_cv") {
      const { cvTexto } = body;
      if (!cvTexto?.trim()) {
        return jsonResponse({ error: "Texto de CV no proporcionado." }, 400, origin);
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
          max_tokens: 2500,
          system: PARSE_CV_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Extrae la información estructurada de esta hoja de vida:\n\n${cvTexto}`,
            },
          ],
        }),
      });

      if (!anthropicRes.ok) {
        return jsonResponse({ error: "Error al procesar la lectura del CV." }, 502, origin);
      }

      const data = await anthropicRes.json();
      const text = data.content?.[0]?.text || "";

      try {
        let clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        return jsonResponse({ ok: true, data: parsed }, 200, origin);
      } catch (e) {
        return jsonResponse({ error: "Error parseando estructura de CV." }, 500, origin);
      }
    }

    /* ── ACCIÓN 2: Ranking Top 5 (match_top5) ────────────────────────────── */
    const userPrompt = `
PERFIL DEL ASPIRANTE:
Nombre: ${body.nombre || "No especificado"}
Email: ${body.email || "No especificado"}
Teléfono: ${body.telefono || "No especificado"}
Edad: ${body.edad || "No especificado"}

EXPERIENCIAS LABORALES:
${JSON.stringify(body.experiencias || [], null, 2)}

FORMACIONES ACADÉMICAS:
${JSON.stringify(body.formaciones || [], null, 2)}

PLANES LABORALES A 5 AÑOS:
${body.planes_5_anos || "No especificados"}

EXPECTATIVAS DE UN POSGRADO UNISABANA:
${body.expectativas_posgrado || "No especificadas"}
`.trim();

    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3500,
        system: MATCH_TOP5_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Evalúa este aspirante y genera su Top 5 de Posgrados UniSabana:\n\n${userPrompt}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      return jsonResponse({ error: "Error al generar el ranking de posgrados." }, 502, origin);
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || "";

    let parsed;
    try {
      let clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return jsonResponse({ error: "Error al interpretar la respuesta de la IA." }, 500, origin);
    }

    const usage = data.usage || {};
    ctx.waitUntil(logToSupabase(env, body, parsed, usage));

    return jsonResponse({ ok: true, result: parsed }, 200, origin);
  },
};
