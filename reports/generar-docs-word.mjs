// @ts-check
/**
 * Generador de los tres documentos Word de Casa Propia QA:
 *   1. Casos-de-prueba.docx     — cada escenario: qué prueba y cómo se valida.
 *   2. Flujo-tecnico.docx        — paso a paso de ejecución (feature → helper → validación).
 *   3. Arquitectura.docx         — cómo está construido cada proyecto y cómo funciona.
 *
 * Uso: node reports/generar-docs-word.mjs
 * Salida: reports/dist-word/
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from './node_modules/docx/build/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'dist-word');

// ---- Helpers de formato ------------------------------------------------------

const COLOR_ACCENT = '1F4E79';
const COLOR_MUTED = '595959';

function titulo(text) {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    spacing: { after: 240 },
    children: [new TextRun({ text, bold: true, color: COLOR_ACCENT, size: 48 })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, color: COLOR_ACCENT, size: 32 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, color: COLOR_MUTED, size: 23 })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, ...opts })],
  });
}

/** Párrafo con partes mixtas: [{text, bold?, italics?, color?}] */
function pMix(parts) {
  return new Paragraph({
    spacing: { after: 120 },
    children: parts.map((x) => new TextRun({ size: 22, ...x })),
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'pasos', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function code(text) {
  const lines = text.split('\n');
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    shading: { type: 'clear', fill: 'F2F2F2' },
    children: lines.flatMap((ln, i) => {
      const run = new TextRun({ text: ln, font: 'Consolas', size: 19 });
      return i < lines.length - 1 ? [run, new TextRun({ break: 1 })] : [run];
    }),
  });
}

function celda(text, { bold = false, fill, width } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: fill ? { type: 'clear', fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20 })],
      }),
    ],
  });
}

/** Tabla simple a partir de encabezados y filas. */
function tabla(headers, rows, anchos) {
  const borde = { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: borde,
      bottom: borde,
      left: borde,
      right: borde,
      insideHorizontal: borde,
      insideVertical: borde,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          celda(h, { bold: true, fill: 'D9E2F3', width: anchos?.[i] })
        ),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) => celda(c, { width: anchos?.[i] })),
          })
      ),
    ],
  });
}

function espacio() {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

/** Construye y escribe un documento. */
async function escribir(nombre, children) {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'pasos',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 420, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [{ properties: {}, children }],
  });
  const buffer = await Packer.toBuffer(doc);
  const ruta = join(OUT, nombre);
  writeFileSync(ruta, buffer);
  console.log('  · ' + ruta);
}

// ============================================================================
// DOCUMENTO 1 — CASOS DE PRUEBA (qué prueba cada escenario y cómo se valida)
// ============================================================================

/** Bloque reutilizable para un caso de prueba. */
function caso({ id, nombre, objetivo, datos, pasos, validacion, resultado, estado }) {
  const bloque = [
    pMix([{ text: `${id} — ${nombre}`, bold: true, color: COLOR_ACCENT }]),
    pMix([{ text: 'Qué verifica: ', bold: true }, { text: objetivo }]),
  ];
  if (datos) bloque.push(pMix([{ text: 'Datos usados: ', bold: true }, { text: datos }]));
  bloque.push(pMix([{ text: 'Cómo se prueba:', bold: true }]));
  for (const paso of pasos) bloque.push(bullet(paso));
  bloque.push(pMix([{ text: 'Cómo se valida: ', bold: true }, { text: validacion }]));
  bloque.push(
    pMix([
      { text: 'Resultado: ', bold: true },
      {
        text: `${estado} — ${resultado}`,
        color: estado.includes('FALL') ? 'C00000' : '2E7D32',
        bold: true,
      },
    ])
  );
  bloque.push(espacio());
  return bloque;
}

function docCasos() {
  const c = [];
  c.push(titulo('Casos de prueba — Casa Propia QA'));
  c.push(
    p(
      'Este documento describe, en lenguaje funcional, cada escenario automatizado: qué comportamiento verifica, con qué datos, cómo se ejecuta y cómo se decide si pasa o falla. Las verificaciones de API están en Karate; los recorridos de pantalla, en Playwright. Entre ambas suites se cubren los requisitos RF01 a RF06.'
    )
  );
  c.push(
    pMix([
      { text: 'Nota sobre fallos: ', bold: true },
      {
        text: 'tres casos fallan a propósito porque exponen defectos reales del producto. No se debilitó la verificación para forzar un resultado verde; el resultado esperado se mantiene según el contrato.',
        italics: true,
      },
    ])
  );

  // ---- KARATE ----
  c.push(h1('Suite Karate (API)'));

  c.push(h2('RF01 · Registro y consulta'));
  c.push(
    ...caso({
      id: 'RF01-01',
      nombre: 'Registrar una solicitud válida y recuperarla por su identificador',
      objetivo:
        'Que una solicitud con datos correctos se registre (estado REGISTRADA) y que al consultarla por su id conserve exactamente la información enviada.',
      datos: 'Cliente sintético QA-AUTO-…, valorVivienda 100.000.000, monto 79.000.000, plazo 120.',
      pasos: [
        'La fábrica de datos genera una solicitud válida y la traduce al payload del contrato.',
        'POST /solicitudes con ese payload.',
        'Se guarda el id devuelto y luego GET /solicitudes/{id}.',
      ],
      validacion:
        'El registro responde 201 y el cuerpo cumple el esquema; la consulta responde 200 y cada campo (cliente, valor, monto, plazo, estado) coincide con lo registrado; documentosPendientes lista los tres requeridos.',
      resultado: '14/14 escenarios de RF01 en verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF01-02',
      nombre: 'Consultar una solicitud inexistente responde no encontrada',
      objetivo: 'Que consultar un id que no existe devuelva un error controlado, no datos.',
      datos: 'Identificador inventado SOL-999999.',
      pasos: ['GET /solicitudes/SOL-999999.'],
      validacion: 'Responde 404 con el código de error SOLICITUD_NO_ENCONTRADA.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF01-03',
      nombre: 'Registrar con cada plazo permitido (120 / 180 / 240)',
      objetivo: 'Que los tres plazos válidos del contrato se acepten.',
      datos: 'Tres variantes de la misma solicitud, una por cada plazo.',
      pasos: [
        'Por cada plazo, la fábrica arma la solicitud y hace POST /solicitudes.',
      ],
      validacion: 'Cada registro responde 201 y el plazo persistido coincide con el enviado.',
      resultado: '3 ejemplos en verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF01-04',
      nombre: 'Rechazos de registro inválido (plazo, cliente, importes, decimales)',
      objetivo:
        'Que datos inválidos no creen solicitud: plazo no permitido, cliente ausente o vacío, importes cero/negativos, importes decimales.',
      datos:
        'Variantes inválidas explícitas de la fábrica (plazo 99, cliente "", valor 0, monto -1, decimales, etc.).',
      pasos: [
        'Por cada variante inválida, POST /solicitudes.',
        'En el caso de entrada inválida, se verifica además que no haya id en la respuesta.',
      ],
      validacion:
        'Cada intento responde 400 con DATOS_INVALIDOS y el detalle señala el campo ofensor; una entrada inválida no produce id consultable.',
      resultado: 'Todos los negativos en verde.',
      estado: 'APROBADO',
    })
  );

  c.push(h2('RF02 · Evaluación (límite 80%)'));
  c.push(
    ...caso({
      id: 'RF02-01',
      nombre: 'Preaprobar un monto inferior al 80%',
      objetivo: 'Que un monto por debajo del límite quede PREAPROBADA sin razón de rechazo.',
      datos: 'valorVivienda 100.000.000, monto 79.000.000 (79%).',
      pasos: ['Registrar la solicitud (helper).', 'POST /solicitudes/{id}/evaluacion.'],
      validacion: 'Responde 200, estado PREAPROBADA y razonRechazo nulo.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF02-02',
      nombre: 'Preaprobar el 80% exacto (límite inclusivo)',
      objetivo:
        'Que el monto que equivale al 80% exacto quede PREAPROBADA, porque el contrato define el límite como inclusivo (monto ≤ 80%).',
      datos: 'valorVivienda 100.000.000, monto 80.000.000 (80% exacto).',
      pasos: ['Registrar.', 'Evaluar.', 'Consultar para comprobar persistencia.'],
      validacion: 'Se espera 200 y PREAPROBADA.',
      resultado:
        'el backend responde RECHAZADA porque usa “menor estricto” en vez de “menor o igual”. Defecto HALL-001.',
      estado: 'FALLIDO POR DEFECTO',
    })
  );
  c.push(
    ...caso({
      id: 'RF02-03',
      nombre: 'Rechazar un monto superior al límite y exponer razón',
      objetivo: 'Que un monto por encima del 80% quede RECHAZADA con una razón general no vacía.',
      datos: 'valorVivienda 100.000.000, monto 80.000.001 (80%+1).',
      pasos: ['Registrar.', 'Evaluar.'],
      validacion: 'Responde 200, estado RECHAZADA y razonRechazo es texto no vacío.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF02-04',
      nombre: 'Persistencia del estado preaprobado y no re-evaluar',
      objetivo:
        'Que el estado PREAPROBADA persista al consultar y que una segunda evaluación no esté permitida.',
      datos: 'Solicitud por debajo del límite.',
      pasos: ['Registrar y evaluar.', 'Consultar nuevamente.', 'Intentar evaluar una segunda vez.'],
      validacion:
        'La consulta devuelve PREAPROBADA con evaluadaEn; la segunda evaluación responde 409 TRANSICION_NO_PERMITIDA.',
      resultado: 'Ambos en verde.',
      estado: 'APROBADO',
    })
  );

  c.push(h2('RF03 · Confirmación'));
  c.push(
    ...caso({
      id: 'RF03-01',
      nombre: 'Confirmar una solicitud preaprobada con documentos completos',
      objetivo: 'Que una solicitud PREAPROBADA con los 3 documentos requeridos pase a CONFIRMADA.',
      datos: 'Solicitud por debajo del límite; documentos CEDULA, CERTIFICADO_INGRESOS, AVALUO_VIVIENDA.',
      pasos: [
        'Registrar, evaluar (queda PREAPROBADA).',
        'Registrar los tres documentos.',
        'POST /solicitudes/{id}/confirmacion.',
        'Consultar para comprobar persistencia.',
      ],
      validacion:
        'Responde 200, estado CONFIRMADA, confirmadaEn presente y documentosPendientes vacío; la consulta posterior confirma el estado.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF03-02',
      nombre: 'Rechazar confirmaciones no permitidas (registrada / rechazada / docs incompletos)',
      objetivo:
        'Que no se pueda confirmar una solicitud apenas registrada, una rechazada, ni una preaprobada con documentos incompletos; y que el intento no cambie nada.',
      datos: 'Tres solicitudes en cada estado de partida.',
      pasos: [
        'Preparar la solicitud en el estado de partida.',
        'Capturar la solicitud “antes”.',
        'Intentar confirmar.',
        'Capturar la solicitud “después” y compararlas.',
      ],
      validacion:
        'Cada intento responde 409 (TRANSICION_NO_PERMITIDA o DOCUMENTOS_INCOMPLETOS) y la comparación antes/después es idéntica (sin cambios de estado ni datos).',
      resultado: 'Los tres en verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF03-03',
      nombre: 'No re-confirmar una solicitud ya confirmada',
      objetivo:
        'Que confirmar por segunda vez una solicitud ya CONFIRMADA no esté permitido y no reescriba datos.',
      datos: 'Solicitud confirmada una vez.',
      pasos: ['Confirmar válidamente.', 'Intentar confirmar de nuevo.'],
      validacion: 'Se espera 409 TRANSICION_NO_PERMITIDA sin cambios.',
      resultado:
        'el backend responde 200 y reescribe confirmadaEn/actualizadaEn. Defecto HALL-002.',
      estado: 'FALLIDO POR DEFECTO',
    })
  );

  c.push(h2('RF05 · Continuidad del proveedor (API)'));
  c.push(
    ...caso({
      id: 'RF05-01',
      nombre: 'Evaluación normal y demorada por cabecera, sin duplicar',
      objetivo:
        'Que la evaluación en modo normal y en modo demora (por cabecera X-Simulacion-Proveedor) termine en 200 PREAPROBADA sin crear solicitudes nuevas.',
      datos: 'Solicitud por debajo del límite; cabecera normal y demora.',
      pasos: [
        'Registrar la solicitud.',
        'Evaluar enviando la cabecera del modo correspondiente.',
      ],
      validacion:
        'Responde 200 y PREAPROBADA; el id devuelto es el mismo de la solicitud (no hay duplicados).',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF05-02',
      nombre: 'Demora configurada globalmente, con restauración garantizada',
      objetivo:
        'Que una demora configurada de forma global (PUT /simulacion/proveedor) permita evaluar con éxito, y que el proveedor se restaure a normal aunque el escenario falle.',
      datos: 'demoraMs = 4000.',
      pasos: [
        'Configurar el proveedor en modo demora global.',
        'Evaluar sin cabecera (toma la config global).',
        'Restaurar el proveedor a normal (teardown garantizado).',
      ],
      validacion:
        'La evaluación responde 200 PREAPROBADA; una verificación por GET confirma que el proveedor quedó en normal.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF05-03',
      nombre: 'Indisponibilidad conserva estado y recuperación permite continuar',
      objetivo:
        'Que ante proveedor no disponible la solicitud no cambie, y que al restaurar se pueda evaluar con éxito.',
      datos: 'Solicitud por debajo del límite; cabecera no-disponible y luego normal.',
      pasos: [
        'Registrar y capturar el estado inicial.',
        'Evaluar con proveedor no disponible.',
        'Comparar la solicitud antes/después.',
        'Restaurar a normal y reintentar la evaluación.',
      ],
      validacion:
        'La indisponibilidad responde 503 PROVEEDOR_NO_DISPONIBLE y la solicitud queda idéntica (sigue REGISTRADA); tras restaurar, la evaluación responde 200 PREAPROBADA.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );

  c.push(h2('RF06 · Jornada de atención'));
  c.push(
    ...caso({
      id: 'RF06-01',
      nombre: 'Jornada concurrente: 5 asesores × 4 consultas = 20',
      objetivo:
        'Que 20 consultas concurrentes a la misma solicitud (con la condición jornada) devuelvan datos correctos y que al menos 19 de 20 respondan en 800 ms o menos.',
      datos: 'Una solicitud creada por la suite; cabecera X-Condicion-Atencion: jornada.',
      pasos: [
        'La suite crea una solicitud y captura su id real.',
        'Un motor Java lanza 20 consultas concurrentes (5 grupos de 4) y mide cada una.',
        'Se escribe un archivo de evidencia con los tiempos antes de evaluar el criterio.',
      ],
      validacion:
        'Se comprueba la estructura (20 resultados, 5 asesores, 4 consultas c/u, campos completos), que las 20 sean funcionalmente correctas y que within800ms sea ≥ 19.',
      resultado:
        'funcional 20/20 correcto, pero temporal 18/20 (dos consultas superan 800 ms). Defecto HALL-RF06-001.',
      estado: 'FALLIDO POR INCUMPLIMIENTO TEMPORAL',
    })
  );

  // ---- PLAYWRIGHT ----
  c.push(h1('Suite Playwright (UI)'));
  c.push(
    p(
      'La capa de interfaz cubre el recorrido del asesor (RF04) y la continuidad vista desde la pantalla (RF05). Cada recorrido ejecuta la aplicación real en Chromium y, cuando aplica, compara lo que muestra la interfaz contra la consulta por API.'
    )
  );

  c.push(h2('RF04 · Atención del asesor'));
  c.push(
    ...caso({
      id: 'RF04-01',
      nombre: 'Confirmar una solicitud válida y comparar interfaz con API',
      objetivo:
        'Que el asesor pueda registrar, evaluar, cargar documentos y confirmar desde la pantalla, y que la información mostrada coincida con la de la API.',
      datos: 'Datos sintéticos válidos preparados por la fábrica.',
      pasos: [
        'Abrir la aplicación y registrar la solicitud desde el formulario.',
        'Capturar el identificador real que muestra la interfaz.',
        'Evaluar; la interfaz debe mostrar PREAPROBADA.',
        'Completar los documentos y confirmar; la interfaz debe mostrar CONFIRMADA.',
        'Consultar la misma solicitud por API.',
      ],
      validacion:
        'Identificador, cliente, plazo y estado final coinciden entre interfaz y API; los documentos están completos según la API.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF04-02',
      nombre: 'Mostrar el rechazo y su razón sin permitir confirmar',
      objetivo:
        'Que una solicitud cuyo monto supera el límite se muestre como RECHAZADA, con una razón general, y que no aparezca la acción de confirmar.',
      datos: 'valorVivienda 100.000.000, monto 80.000.001.',
      pasos: ['Abrir la app y registrar la solicitud.', 'Evaluar desde la interfaz.'],
      validacion:
        'La interfaz muestra RECHAZADA, muestra una razón general y el botón de confirmar no está presente.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );

  c.push(h2('RF05 · Continuidad del proveedor (UI)'));
  c.push(
    ...caso({
      id: 'RF05-UI-01',
      nombre: 'Evaluación demorada muestra avisos y termina preaprobando',
      objetivo:
        'Que ante demora del proveedor el asesor vea los avisos de “evaluando” y de “tardando más de lo habitual”, y que la evaluación finalice en PREAPROBADA sin duplicar.',
      datos: 'Proveedor en modo demora global (4000 ms).',
      pasos: [
        'Abrir la app y registrar una solicitud evaluable.',
        'Configurar el proveedor en modo demora.',
        'Evaluar desde la interfaz.',
        'Restaurar el proveedor a normal (teardown).',
      ],
      validacion:
        'La interfaz muestra el aviso de evaluación en curso y el aviso de demora; termina en preaprobada; la API confirma el estado.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );
  c.push(
    ...caso({
      id: 'RF05-UI-02',
      nombre: 'Indisponibilidad conserva datos y la recuperación permite continuar',
      objetivo:
        'Que ante proveedor no disponible el asesor vea una alerta, la solicitud no cambie, y al restaurar se pueda reintentar con éxito.',
      datos: 'Proveedor en modo no disponible y luego normal.',
      pasos: [
        'Abrir la app y registrar una solicitud evaluable.',
        'Guardar el estado inicial por API.',
        'Configurar el proveedor como no disponible y evaluar.',
        'Verificar la alerta y que los datos no cambiaron.',
        'Restaurar a normal y reintentar la evaluación.',
      ],
      validacion:
        'La interfaz muestra la alerta de proveedor no disponible; la API confirma que el estado y los datos no cambiaron; tras restaurar, la evaluación finaliza en preaprobada.',
      resultado: 'En verde.',
      estado: 'APROBADO',
    })
  );

  c.push(h1('Resumen de resultados'));
  c.push(
    tabla(
      ['Requisito', 'Suite', 'Resultado'],
      [
        ['RF01 Registro y consulta', 'Karate', 'APROBADO (14/14)'],
        ['RF02 Evaluación', 'Karate', 'FALLIDO POR DEFECTO en el 80% exacto (HALL-001)'],
        ['RF03 Confirmación', 'Karate', 'FALLIDO POR DEFECTO en la re-confirmación (HALL-002)'],
        ['RF04 Atención del asesor', 'Playwright', 'APROBADO'],
        ['RF05 Continuidad', 'Karate + Playwright', 'APROBADO'],
        ['RF06 Jornada', 'Karate', 'Funcional OK, temporal FALLIDO 18/20 (HALL-RF06-001)'],
      ],
      [34, 26, 40]
    )
  );
  return c;
}

// ============================================================================
// DOCUMENTO 2 — FLUJO TÉCNICO (paso a paso de ejecución)
// ============================================================================

function docFlujo() {
  const c = [];
  c.push(titulo('Flujo técnico de ejecución — Casa Propia QA'));
  c.push(
    p(
      'Este documento explica, paso a paso, qué ocurre internamente cuando se ejecuta un caso: qué archivo se lee primero, a qué otros archivos llama, qué hace cada uno y cómo se decide el resultado. Se usan ejemplos concretos de cada suite.'
    )
  );

  c.push(h1('Cómo arranca cada suite'));

  c.push(h2('Karate'));
  c.push(numbered('Maven ejecuta los runners *Runner.java (Surefire está configurado para incluirlos).'));
  c.push(numbered('Cada runner invoca Karate.run(...) apuntando a una ruta de features y filtrando por tags.'));
  c.push(
    numbered(
      'Antes de cualquier feature, Karate lee karate-config.js: resuelve API_BASE_URL (propiedad del sistema, variable de entorno o el valor por defecto), arma las rutas del contrato y define los constructores de ruta (rutaSolicitud, rutaEvaluacion, etc.) y los timeouts.'
    )
  );
  c.push(numbered('Karate ejecuta los escenarios del feature uno por uno y produce el reporte HTML/JSON.'));

  c.push(h2('Playwright'));
  c.push(
    numbered(
      'El comando corre primero bddgen: playwright-bdd lee los .feature en español y los steps/fixtures/hooks de TypeScript y genera los archivos de test en .features-gen.'
    )
  );
  c.push(
    numbered(
      'playwright.config.ts define el único navegador (Chromium), los reporteros (línea, HTML, JSON) y la evidencia (screenshot, video y trace en modo on).'
    )
  );
  c.push(
    numbered(
      'Por cada escenario, los fixtures crean un contexto aislado (ctx), un cliente de API (api) y los Page Objects; los hooks adjuntan la evidencia y restauran el proveedor cuando aplica.'
    )
  );

  // Ejemplo detallado Karate
  c.push(h1('Ejemplo detallado — Karate, RF01 primer caso'));
  c.push(
    p(
      'Caso: “Registrar una solicitud válida y recuperarla por su identificador” (registro-consulta.feature). Así se ejecuta de principio a fin:'
    )
  );
  c.push(
    numbered(
      'Karate entra al feature y ejecuta el Background: lee data/solicitudes.js (fábrica de datos), data/schemas.js (esquemas de validación) y data/estados.js (nombres de estados y códigos de error). Quedan disponibles como variables del escenario.'
    )
  );
  c.push(
    numbered(
      'El escenario pide a la fábrica una solicitud “inferior al límite”. La fábrica construye un modelo interno con un cliente sintético único (QA-AUTO-timestamp-random) y luego aPayload() lo traduce a los nombres del contrato (cliente, valorVivienda, monto, plazoMeses).'
    )
  );
  c.push(
    numbered(
      'Se arma la petición: url rutas.solicitudes, request con el payload, method post. El backend responde 201 con la solicitud creada.'
    )
  );
  c.push(
    numbered(
      'Validación del registro: status 201; el cuerpo se compara contra el esquema (match response == schemas.solicitud); se comprueba estado REGISTRADA y que cada campo coincida con lo enviado; documentosPendientes debe listar los tres documentos requeridos.'
    )
  );
  c.push(numbered('Se guarda el id devuelto (def id = response.id).'));
  c.push(
    numbered(
      'Segunda parte: GET a rutaSolicitud(id). Se valida status 200 y que los datos consultados (cliente, valor, monto, plazo, estado) sean idénticos a los registrados. Esto demuestra que la solicitud se puede consultar y conserva su información.'
    )
  );
  c.push(
    pMix([
      { text: 'Qué permite validar: ', bold: true },
      {
        text: 'que el registro acepta datos válidos, responde con la forma correcta y persiste la información para consultas posteriores (el núcleo de RF01).',
      },
    ])
  );
  c.push(h3('Reutilización mediante helpers'));
  c.push(
    p(
      'Los escenarios de evaluación, confirmación y continuidad no repiten el código de registro: llaman a helpers (features marcados @ignore que no se ejecutan solos). Cada helper tiene una responsabilidad única y devuelve datos al llamador.'
    )
  );
  c.push(
    tabla(
      ['Helper', 'Recibe', 'Hace', 'Devuelve'],
      [
        ['crear-solicitud', 'payload', 'POST /solicitudes, valida 201', 'response, id'],
        ['evaluar-solicitud', 'id (+ modo opcional)', 'POST …/evaluacion con cabecera opcional', 'respuesta, status'],
        ['registrar-documentos', 'id, documentos[]', 'POST …/documentos', 'response, status'],
        ['consultar-solicitud', 'id (+ condición opcional)', 'GET …/{id}', 'response, status'],
        ['confirmar-solicitud', 'id', 'POST …/confirmacion', 'response, status'],
        ['configurar/consultar/restaurar-proveedor', 'modo/demoraMs', 'PUT/GET …/simulacion/proveedor', 'config'],
      ],
      [28, 20, 32, 20]
    )
  );
  c.push(
    pMix([
      { text: 'Detalle de diseño: ', bold: true },
      {
        text: 'los helpers de evaluar y consultar envían la cabecera de simulación solo si el llamador la pasa; si es nula, el header se omite por completo (evita un 400 por cabecera vacía). Y no fuerzan un status fijo cuando el escenario necesita comprobar 200/409/503, para no ocultar el código real.',
      },
    ])
  );

  // Ejemplo detallado Playwright
  c.push(h1('Ejemplo detallado — Playwright, RF04 recorrido confirmado'));
  c.push(
    p(
      'Caso: “Confirmar una solicitud válida y comparar la interfaz con la API” (solicitud-confirmada.feature). Así se ejecuta:'
    )
  );
  c.push(
    numbered(
      'bddgen ya tradujo el .feature en español a un test ejecutable. Al correr, los fixtures crean el contexto (ctx), el cliente de API (api) y los Page Objects (solicitud, evaluación, documentos, confirmación).'
    )
  );
  c.push(
    numbered(
      'Antecedentes: se abre la aplicación y la fábrica prepara datos sintéticos válidos, guardados en ctx.'
    )
  );
  c.push(
    numbered(
      'Paso “registro la solicitud desde la interfaz”: el step llama a SolicitudPage.registrar(), que llena cliente, valor y monto, selecciona el plazo por su etiqueta visible (el <select> de Angular usa [ngValue], por eso se elige por “180 meses” y no por el número) y hace clic en Registrar.'
    )
  );
  c.push(
    numbered(
      'Paso “capturo el identificador real”: se lee el id que muestra la pantalla y se guarda en ctx (nunca se inventa un id ni se reutiliza de otra ejecución).'
    )
  );
  c.push(
    numbered(
      'Paso “evalúo…”: EvaluacionPage dispara la evaluación; se espera (web-first, sin esperas fijas) a que la interfaz muestre PREAPROBADA.'
    )
  );
  c.push(
    numbered(
      'Pasos de documentos y confirmación: DocumentosPage marca los tres documentos y los registra; ConfirmacionPage comprueba que el botón de confirmar esté visible y confirma; la interfaz debe mostrar CONFIRMADA.'
    )
  );
  c.push(
    numbered(
      'Comparación UI vs API: el cliente de API hace GET de la misma solicitud y se verifica que identificador, cliente, plazo y estado final coincidan, y que los documentos estén completos según la API.'
    )
  );
  c.push(
    numbered(
      'Al terminar, el hook After adjunta el contexto del escenario (ids, datos, resultados) a la evidencia; screenshot, video y traza quedan registrados por configuración.'
    )
  );
  c.push(
    pMix([
      { text: 'Qué permite validar: ', bold: true },
      {
        text: 'que el flujo completo del asesor funciona desde la pantalla y que lo que ve coincide con la verdad de la API, evitando que una pantalla desincronizada lo lleve a dar información incorrecta.',
      },
    ])
  );

  c.push(h1('Mecanismos transversales'));
  c.push(h3('Datos sintéticos y aislamiento'));
  c.push(
    bullet(
      'Cada suite crea sus propios datos con un cliente único por ejecución; no se depende de ids de corridas anteriores (los datos del backend viven en memoria).'
    )
  );
  c.push(h3('Simulación del proveedor (RF05)'));
  c.push(
    bullet(
      'Por petición: cabecera X-Simulacion-Proveedor (normal / demora / no-disponible), preferida en Karate porque mantiene el escenario aislado.'
    )
  );
  c.push(
    bullet(
      'Global: PUT /simulacion/proveedor, usada cuando el flujo pasa por la UI (que no envía cabecera). Los escenarios que la modifican restauran el proveedor a normal con teardown garantizado.'
    )
  );
  c.push(h3('Jornada (RF06)'));
  c.push(
    bullet(
      'La concurrencia real la provee un helper Java (JornadaConcurrente) con un pool de hilos: lanza las 20 consultas a la vez, mide cada una, agrega métricas y escribe la evidencia antes de evaluar el criterio temporal.'
    )
  );
  c.push(h3('Evidencia'));
  c.push(
    bullet(
      'Karate genera un HTML por feature con cada paso Gherkin y su request/response. Playwright genera reporte HTML con captura por paso, video y traza navegable. El generador de reportes consolida ambos en un index con PDF y agrupación por RF.'
    )
  );
  return c;
}

// ============================================================================
// DOCUMENTO 3 — ARQUITECTURA
// ============================================================================

function docArquitectura() {
  const c = [];
  c.push(titulo('Arquitectura de los proyectos — Casa Propia QA'));
  c.push(
    p(
      'El repositorio separa dos suites de automatización independientes y una capa de reportes consolidados. Karate verifica la API; Playwright verifica la interfaz. Cada una elige la tecnología idónea para su capa.'
    )
  );
  c.push(
    tabla(
      ['Carpeta', 'Propósito'],
      [
        ['api-karate/', 'Pruebas de API con Karate'],
        ['ui-playwright-bdd/', 'Recorridos de interfaz con Playwright + playwright-bdd'],
        ['reports/', 'Generador de reportes consolidados (index, PDF, Word) y agrupación por RF'],
        ['docs/', 'Estrategia, trazabilidad, hallazgos, decisiones'],
        ['evidence/', 'Evidencia de jornada y artefactos'],
      ],
      [34, 66]
    )
  );

  // Karate
  c.push(h1('Proyecto Karate (API)'));
  c.push(h2('Stack y versiones'));
  c.push(bullet('Karate 1.4.1 (última línea estable compatible con Java 11; ≥1.5 exige JDK 17+).'));
  c.push(bullet('Java 11, Maven, JUnit 5 (jupiter 5.10.2), Surefire 3.2.5.'));
  c.push(bullet('Codificación UTF-8 forzada (el sistema reporta Cp1252).'));
  c.push(h2('Organización de carpetas'));
  c.push(
    tabla(
      ['Carpeta', 'Contenido'],
      [
        ['karate-config.js', 'Config central: base URL, rutas del contrato, timeouts, documentos requeridos'],
        ['runners/', 'StructuralTestRunner, ApiTestRunner, SmokeTestRunner, WorkloadTestRunner'],
        ['structural/', 'Prueba estructural que no usa red'],
        ['features/', 'RF01 registro, RF02 evaluación, RF03 confirmación, RF05 continuidad, RF06 jornada'],
        ['helpers/', 'Features @ignore reutilizables (crear, evaluar, documentos, consultar, confirmar, proveedor)'],
        ['jornada/', 'JornadaConcurrente.java (concurrencia real de RF06)'],
        ['data/', 'solicitudes.js (fábrica + adapter), estados.js, schemas.js'],
        ['utils/', 'normalizer.js (comparación de negocio antes/después)'],
      ],
      [26, 74]
    )
  );
  c.push(h2('Cómo funciona'));
  c.push(
    p(
      'Los runners son el punto de entrada de Maven. Cada uno llama a Karate filtrando por tags (por ejemplo, regresión excluye @pendienteContrato). Karate lee la configuración central una vez y luego ejecuta los features. Los features describen el comportamiento en Gherkin y delegan las acciones repetitivas en los helpers.'
    )
  );
  c.push(h3('Decisiones clave'));
  c.push(
    bullet(
      'Idioma de Gherkin: Karate no interpreta keywords localizados, así que las palabras estructurales van en inglés y la narrativa, datos y nombres en español.'
    )
  );
  c.push(
    bullet(
      'Adapter de datos: la fábrica trabaja con un modelo interno (clientName/propertyValue/…) y traduce al contrato (cliente/valorVivienda/…) en aPayload(), aislando las pruebas de los nombres exactos del contrato.'
    )
  );
  c.push(
    bullet(
      'Rutas centralizadas: las URL se construyen en la config, no en los features; cambiar la base afecta a toda la suite en un solo punto.'
    )
  );
  c.push(
    bullet(
      'Concurrencia de la jornada en Java: Karate orquesta y valida, pero las 20 peticiones concurrentes las ejecuta un helper Java con ExecutorService, que mide cada petición y agrega métricas.'
    )
  );
  c.push(
    bullet(
      'Validación diferida: la prueba estructural no abre red; las URL se exigen solo cuando una prueba funcional las necesita.'
    )
  );

  // Playwright
  c.push(h1('Proyecto Playwright (UI)'));
  c.push(h2('Stack y versiones'));
  c.push(bullet('Playwright Test 1.48.2 con playwright-bdd 7.5.0; TypeScript estricto 5.5.'));
  c.push(bullet('Node 20+/22. Único navegador: Chromium.'));
  c.push(bullet('Features en español con # language: es (el parser de playwright-bdd sí los soporta).'));
  c.push(h2('Organización de carpetas'));
  c.push(
    tabla(
      ['Carpeta', 'Contenido'],
      [
        ['features/', 'estructura, solicitud-confirmada, solicitud-rechazada, continuidad-proveedor'],
        ['src/steps/', 'Definiciones de pasos (comunes, evaluación, documentos, confirmación, continuidad)'],
        ['src/pages/', 'Page Objects (base, solicitud, evaluación, documentos, confirmación)'],
        ['src/api/', 'Cliente de API (incluye configuración del proveedor para RF05)'],
        ['src/adapters/', 'Traducción entre modelo interno, contrato de API y lectura de la UI'],
        ['src/models/', 'Tipos de solicitud, respuesta, contexto de prueba, jornada'],
        ['src/data/', 'Fábrica de solicitudes sintéticas'],
        ['src/support/', 'fixtures (ctx/api/pages), hooks (evidencia + restaurar proveedor), environment'],
        ['src/utils/', 'money, comparisons, evidence'],
      ],
      [24, 76]
    )
  );
  c.push(h2('Cómo funciona'));
  c.push(
    p(
      'playwright-bdd actúa de puente: lee los features en español y los steps en TypeScript y genera, en .features-gen, los tests que Playwright ejecuta. Los fixtures inyectan en cada escenario un contexto aislado, un cliente de API y los Page Objects. Los steps traducen cada frase Gherkin en acciones sobre los Page Objects o llamadas al cliente de API. Los hooks adjuntan evidencia y, en los escenarios de configuración global, restauran el proveedor.'
    )
  );
  c.push(h3('Decisiones clave'));
  c.push(
    bullet(
      'Page Object Model: los localizadores y acciones de pantalla viven en las pages; los steps quedan legibles y centrados en el negocio.'
    )
  );
  c.push(
    bullet(
      'Localizadores robustos: se prefieren getByRole/getByLabel y se usan solo los data-testid que ya existen en el frontend; sin XPath, sin nth(), sin esperas fijas (assertions web-first).'
    )
  );
  c.push(
    bullet(
      'Comparación UI vs API: en el recorrido confirmado se contrasta lo que muestra la interfaz contra la consulta por API usando campos no afectados por defectos de presentación.'
    )
  );
  c.push(
    bullet(
      'Simulación por configuración global: como la UI no envía cabeceras de simulación, la demora e indisponibilidad se activan con PUT /simulacion/proveedor y se restauran en el hook After.'
    )
  );
  c.push(
    bullet(
      'Evidencia completa: screenshot, video y traza en modo on para todas las pruebas; además se adjunta el contexto del escenario.'
    )
  );

  // Reportes
  c.push(h1('Capa de reportes consolidados'));
  c.push(
    p(
      'El proyecto reports/ toma los reportes nativos de ambas suites y produce una vista unificada. Reutiliza el Chromium de Playwright para convertir los HTML a PDF, construye un index que enlaza todo y agrupa los escenarios por requisito (RF) leyendo los tags de cada reporte. También genera estos documentos Word.'
    )
  );
  c.push(h3('Cómo se mantiene al día'));
  c.push(
    bullet(
      'Un hook de fin de ejecución regenera el index automáticamente; el proceso es incremental: regenera solo la suite con reporte nuevo y conserva la otra.'
    )
  );
  c.push(
    bullet(
      'El index muestra, por suite, un total que coincide con el reporte nativo, los grupos por RF (incluido un grupo “Sin RF” para la estructural) y marca los escenarios que pertenecen a varios RF.'
    )
  );

  c.push(h1('Cómo encajan ambas suites'));
  c.push(
    p(
      'El reparto no es casual: las reglas de negocio e invariantes se verifican por API (rápido y determinista) y el recorrido del asesor por interfaz. RF05 se cubre en ambas capas porque el requisito pide tanto que el estado no cambie (API) como qué ve el asesor (UI). Entre las dos suites se cubre RF01 a RF06.'
    )
  );
  c.push(
    tabla(
      ['Requisito', 'Karate (API)', 'Playwright (UI)'],
      [
        ['RF01 Registro', 'Sí', '—'],
        ['RF02 Evaluación', 'Sí', '—'],
        ['RF03 Confirmación', 'Sí', '—'],
        ['RF04 Atención del asesor', '—', 'Sí'],
        ['RF05 Continuidad', 'Sí', 'Sí'],
        ['RF06 Jornada', 'Sí', '—'],
      ],
      [40, 30, 30]
    )
  );
  return c;
}

// ---- main --------------------------------------------------------------------

async function main() {
  console.log('== Generando documentos Word ==');
  mkdirSync(OUT, { recursive: true });
  await escribir('Casos-de-prueba.docx', docCasos());
  await escribir('Flujo-tecnico.docx', docFlujo());
  await escribir('Arquitectura.docx', docArquitectura());
  console.log('Listo. Carpeta: ' + OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
