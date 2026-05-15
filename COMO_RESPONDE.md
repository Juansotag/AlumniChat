# Cómo responde el Match Profesional MPA

> Este documento explica, en términos sencillos, qué pasa "por dentro" cada vez que alguien llena el formulario y presiona **"Analizar mi perfil"**.

---

## La idea central: un intermediario inteligente

El widget no habla directamente con la inteligencia artificial. En cambio, existe un **intermediario** (llamado "Worker") que vive en los servidores de Cloudflare y que actúa como un mensajero seguro entre el usuario y Claude (el modelo de IA de Anthropic).

```
Usuario llena el formulario
        ↓
  Widget (página web)
        ↓  envía los datos
  Worker de Cloudflare   ←── guarda la llave secreta de la IA
        ↓  pregunta a la IA
  Claude (Anthropic)
        ↓  responde
  Worker de Cloudflare
        ↓  entrega el resultado
  Widget (página web)
        ↓
Usuario ve su análisis
```

Por qué este diseño: si el widget hablara directamente con la IA, cualquier persona curiosa podría robar la llave secreta (API Key) abriendo el código de la página. Al poner el Worker en el medio, la llave nunca sale de los servidores de Cloudflare.

---

## Paso a paso: qué ocurre en cada segundo

### 1. El usuario llena el formulario y presiona el botón

La página recoge seis datos:
- Cargo o rol actual
- Sector en el que trabaja
- Años de experiencia
- Temas de interés
- Descripción de su experiencia y logros
- Motivación para estudiar el MPA

### 2. La página verifica que haya contenido mínimo

Antes de enviar cualquier cosa, el widget comprueba que el usuario haya escrito al menos su experiencia **o** su motivación. Si ambos campos están vacíos, muestra un aviso y no continúa.

### 3. Los datos viajan al Worker

La página envía los seis campos al Worker de Cloudflare mediante una solicitud segura (HTTPS). Nadie más puede leer esa solicitud en tránsito.

### 4. El Worker verifica quién está pidiendo

El Worker comprueba que la solicitud venga de un sitio conocido y autorizado (por ejemplo, `govlab.up.railway.app` o `mpaescueladegobierno.com.co`). Si la solicitud viene de un sitio desconocido, la rechaza. Esto evita que otras páginas "aprovechen" el servicio sin permiso.

### 5. El Worker aplica un límite de uso

Para evitar abusos, el Worker permite máximo **5 consultas por minuto** desde la misma conexión. Si alguien intenta enviar más, recibe un mensaje de espera.

### 6. El Worker construye el mensaje para la IA

Aquí está el trabajo más importante. El Worker no le envía a Claude solo lo que escribió el usuario — le envía tres cosas juntas:

**A) Las instrucciones de rol (System Prompt)**
Le dice a Claude quién es y cómo debe comportarse:
> *"Eres el orientador profesional del Match Profesional MPA... Nunca evalúes si alguien 'sirve' o 'no sirve' para el programa. Habla siempre en clave de orientación y crecimiento. Sé específico..."*

**B) El contexto oficial del programa**
Un documento completo con la información real del MPA: las tres competencias del graduado (Líder, Estratega, Gerente), los once resultados de aprendizaje, las seis líneas académicas con sus contenidos, y el formato del programa. Claude **solo puede hablar de lo que está en este documento** — no puede inventar nada.

**C) El perfil del usuario**
Los seis campos que llenó el formulario, organizados como un texto claro para que Claude los entienda.

### 7. Claude lee todo y genera el análisis

Claude procesa las instrucciones + el contexto del programa + el perfil del usuario, y produce una respuesta en un formato muy específico. Se le pide que responda **únicamente** con un bloque de datos estructurado (JSON) que contiene seis partes:

| Campo | Qué contiene |
|---|---|
| `perfil_dominante` | Cuál(es) de las tres competencias MPA mejor describe al aspirante: Líder, Estratega o Gerente |
| `conexion` | 2-3 párrafos conectando la trayectoria real del aspirante con el perfil del MPA |
| `competencias` | Qué competencias específicas del MPA puede fortalecer y por qué |
| `lineas` | Qué líneas académicas le aportarían más, vinculadas a su perfil |
| `proyeccion` | Cómo se vería su carrera después de graduarse del MPA |
| `ficha_interna` | Un resumen ejecutivo pensado para el equipo de la Escuela de Gobierno |

### 8. El Worker valida y entrega la respuesta

Antes de enviar el resultado al usuario, el Worker verifica que la respuesta de Claude tenga el formato correcto. Si algo salió mal (Claude respondió en texto libre en vez de datos estructurados), el Worker lo detecta y muestra un mensaje de error amigable.

Si todo está bien, el resultado viaja de vuelta a la página web.

### 9. El widget muestra el análisis

La página recibe los seis campos y los presenta visualmente:
- Los badges de perfil (Líder / Estratega / Gerente) aparecen como etiquetas
- Los cuatro bloques de análisis se muestran en una cuadrícula
- La ficha interna aparece en un recuadro aparte, pensada para uso del equipo

---

## Lo que la IA NO puede hacer

El diseño del sistema impone límites deliberados:

- **No puede inventar información del programa.** Solo habla de lo que está en el contexto oficial que el Worker le entrega.
- **No puede decir si alguien "pasa" o "no pasa".** Las instrucciones lo prohíben explícitamente.
- **No recuerda conversaciones anteriores.** Cada consulta es completamente independiente; la IA no sabe quién consultó antes.
- **No guarda los datos del usuario.** Ni el Worker ni la IA almacenan nada. Los datos existen solo durante los segundos que tarda en generarse la respuesta.

---

## Cuánto cuesta cada análisis

Cada vez que alguien presiona "Analizar mi perfil", se generan dos tipos de costos: el de la inteligencia artificial (Anthropic) y el del intermediario (Cloudflare). Son costos separados e independientes.

---

### Costo de la inteligencia artificial (Anthropic · Claude Haiku 4.5)

Claude cobra por la cantidad de texto que procesa y genera, medido en **tokens** (unidades de texto, aproximadamente 1 token = ¾ de palabra).

#### Qué se le envía a Claude en cada análisis

| Componente | Descripción | Tokens aprox. |
|---|---|---|
| Instrucciones de rol | Cómo debe comportarse, qué puede y no puede decir | ~250 |
| Contexto oficial del MPA | El documento completo del programa (competencias, líneas, etc.) | ~900 |
| Perfil del usuario | Lo que llenó el formulario | ~200–400 |
| **Total enviado (input)** | | **~1.350–1.550 tokens** |

#### Qué devuelve Claude

| Componente | Descripción | Tokens aprox. |
|---|---|---|
| Análisis completo | Los 6 campos: conexión, competencias, líneas, proyección, perfil, ficha | ~700–1.000 |
| **Total recibido (output)** | | **~850 tokens (promedio)** |

#### Precio por análisis

Los precios de Claude Haiku 4.5 son **$1,00 por millón de tokens de entrada** y **$5,00 por millón de tokens de salida** (precios en dólares estadounidenses, vigentes a mayo de 2026).

| Concepto | Cálculo | Costo |
|---|---|---|
| Tokens de entrada (~1.450) | 1.450 ÷ 1.000.000 × $1,00 | ~$0,00145 |
| Tokens de salida (~850) | 850 ÷ 1.000.000 × $5,00 | ~$0,00425 |
| **Costo por análisis** | | **~$0,006 USD** |

En pesos colombianos (a $4.200 por dólar) eso equivale a aproximadamente **$25 COP por análisis** — menos que una llamada telefónica de un minuto.

#### Tabla de volúmenes

| Número de análisis | Costo estimado (USD) | Costo estimado (COP) |
|---|---|---|
| 10 | $0,06 | ~$250 |
| 100 | $0,57 | ~$2.400 |
| 500 | $2,85 | ~$12.000 |
| 1.000 | $5,70 | ~$24.000 |
| 5.000 | $28,50 | ~$120.000 |

> **Nota:** Estos son valores estimados. El costo real varía según la extensión de lo que escriba cada usuario en el formulario. Un usuario que escribe muy poco pagará menos; uno que escribe mucho, un poco más. La variación no es significativa.

---

### Costo del intermediario (Cloudflare Workers)

Cloudflare es el servicio que recibe las solicitudes del widget y las retransmite a Claude. Tiene un **plan gratuito** muy generoso.

#### Plan gratuito de Cloudflare Workers

| Límite | Valor |
|---|---|
| Solicitudes por día | **100.000** |
| Solicitudes por mes (estimado) | ~3.000.000 |
| Costo | **$0 — completamente gratis** |
| Cuándo se renueva el cupo | Cada medianoche (hora UTC) |

#### ¿Cuándo empezaría a cobrar Cloudflare?

Cloudflare solo comienza a cobrar si se supera el límite de 100.000 solicitudes en un mismo día. Para esta herramienta, eso significaría tener **100.000 personas analizando su perfil en menos de 24 horas** — un escenario que, en contexto de admisiones del MPA, es prácticamente imposible.

Si algún día se llegara a ese volumen, el plan de pago de Cloudflare Workers cuesta **$5 USD al mes** e incluye 10 millones de solicitudes adicionales.

#### En resumen: Cloudflare no va a cobrar nada en el corto plazo.

---

### Costo total del sistema

| Escenario | Anthropic (IA) | Cloudflare | Total mensual |
|---|---|---|---|
| 50 análisis/mes (uso normal admisiones) | ~$0,29 USD | $0 | **~$0,29 USD** |
| 200 análisis/mes (campaña activa) | ~$1,14 USD | $0 | **~$1,14 USD** |
| 1.000 análisis/mes (uso intensivo) | ~$5,70 USD | $0 | **~$5,70 USD** |

El único costo real a considerar es el de Anthropic, y es pequeño incluso en volúmenes altos.

---

## En resumen

El formulario es la entrada. El Worker es el guardián que protege la llave secreta y le da a la IA el contexto correcto. Claude es el analista que conecta la trayectoria real del aspirante con las posibilidades concretas del programa. Y el widget es la ventana donde aparece el resultado.

Todo el ciclo tarda, en condiciones normales, entre **5 y 15 segundos**.
