// @ts-check
/**
 * Generador de reportes consolidados Casa Propia QA.
 *
 * Qué hace:
 *  1. Toma el reporte HTML de Karate (api-karate/target/karate-reports) y el de
 *     Playwright (ui-playwright-bdd/playwright-report).
 *  2. Convierte cada reporte HTML a PDF usando el Chromium que ya instaló Playwright.
 *  3. Genera un index.html unificado en reports/dist/ que enlaza:
 *       - El HTML navegable de cada suite (pasos Gherkin + evidencia).
 *       - Los PDF generados.
 *       - La evidencia de jornada (evidence/karate).
 *
 * Diseño INCREMENTAL y SIN CONFLICTOS:
 *  - No borra todo dist/. Regenera SOLO la suite que tenga reporte nuevo.
 *  - Puedes regenerar una sola suite tras un debug puntual:
 *        node reports/generar-reportes.mjs --only karate
 *        node reports/generar-reportes.mjs --only playwright
 *    (sin --only procesa ambas si tienen reporte disponible).
 *  - El index refleja la fecha de última actualización de cada suite y conserva la
 *    tarjeta de la suite que no se regeneró esta vez.
 *
 * Requisitos: haber corrido antes las pruebas de Karate y/o Playwright.
 * Uso: node reports/generar-reportes.mjs [--only karate|playwright]
 */
import playwright from '../ui-playwright-bdd/node_modules/@playwright/test/index.js';
const { chromium } = playwright;
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const KARATE_REPORT_DIR = join(ROOT, 'api-karate', 'target', 'karate-reports');
const KARATE_SUMMARY = join(KARATE_REPORT_DIR, 'karate-summary.html');
const PLAYWRIGHT_REPORT_DIR = join(ROOT, 'ui-playwright-bdd', 'playwright-report');
const PLAYWRIGHT_INDEX = join(PLAYWRIGHT_REPORT_DIR, 'index.html');
const EVIDENCE_DIR = join(ROOT, 'evidence');

const DIST = join(__dirname, 'dist');
// Estado persistido entre ejecuciones: permite conservar la tarjeta de la suite
// que no se regeneró esta vez (regeneración incremental sin conflictos).
const ESTADO = join(DIST, '.estado.json');

/** Lee el flag --only del CLI. Devuelve 'karate' | 'playwright' | null. */
function leerSoloSuite() {
  const idx = process.argv.indexOf('--only');
  if (idx === -1) return null;
  const val = (process.argv[idx + 1] ?? '').toLowerCase();
  if (val === 'karate' || val === 'playwright') return val;
  console.warn(`! --only "${val}" no reconocido; se ignora (valores: karate | playwright).`);
  return null;
}

function leerEstado() {
  if (!existsSync(ESTADO)) return {};
  try {
    return JSON.parse(readFileSync(ESTADO, 'utf-8'));
  } catch {
    return {};
  }
}

/** Copia un árbol de reporte dentro de dist/, reemplazando solo esa subcarpeta. */
function copiarReporte(origen, subcarpeta) {
  if (!existsSync(origen)) return false;
  const destino = join(DIST, subcarpeta);
  rmSync(destino, { recursive: true, force: true });
  cpSync(origen, destino, { recursive: true });
  return true;
}

/** Convierte un HTML local a PDF con Chromium. */
async function htmlAPdf(browser, htmlPath, pdfPath) {
  const page = await browser.newPage();
  try {
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(1_000);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
    });
    return true;
  } catch (e) {
    console.warn(`  ! No se pudo generar PDF de ${htmlPath}: ${e instanceof Error ? e.message : e}`);
    return false;
  } finally {
    await page.close();
  }
}

/** Lista archivos de evidencia de jornada (txt) para enlazarlos. */
function listarEvidenciaJornada() {
  const dir = join(EVIDENCE_DIR, 'karate');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.txt'))
    .map((f) => ({ nombre: f, rel: `evidence/karate/${f}` }))
    .sort((a, b) => b.nombre.localeCompare(a.nombre));
}

function fmtFecha(d = new Date()) {
  return d.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
}

/** Fecha de modificación de un archivo, formateada; '' si no existe. */
function fechaMod(path) {
  try {
    return fmtFecha(statSync(path).mtime);
  } catch {
    return '';
  }
}

// --- Agrupación de escenarios por requisito funcional (RFxx) -----------------

/** Título legible de cada RF. */
const RF_TITULOS = {
  rf01: 'RF01 · Registro y consulta',
  rf02: 'RF02 · Evaluación (límite 80%)',
  rf03: 'RF03 · Confirmación',
  rf04: 'RF04 · Atención del asesor (UI)',
  rf05: 'RF05 · Continuidad del proveedor',
  rf06: 'RF06 · Jornada de atención',
};

/** Normaliza un escenario a { nombre, tags[], ok, rfs[] }. */
function escenario(nombre, tags, ok) {
  const t = tags.map((x) => String(x).toLowerCase());
  const rfs = t.filter((x) => /^rf\d{2}$/.test(x)).sort();
  return { nombre, tags: t, ok, rfs };
}

/**
 * Agrupa escenarios por su tag rfNN. Un escenario con varios RF aparece en cada
 * grupo (p. ej. continuidad UI es rf04 y rf05); se marca con `multiRF` para que
 * quede claro por qué se repite. Los escenarios sin RF (estructural/soporte) van
 * a un grupo final "Sin RF", de modo que NINGÚN escenario del reporte nativo queda
 * fuera del index.
 *
 * Devuelve { grupos[], resumen:{ total, pasados, fallidos } } donde `resumen`
 * cuenta cada escenario UNA sola vez (coincide con el reporte nativo), aunque un
 * escenario multi-RF aparezca en dos grupos de la lista.
 */
function agruparPorRF(escenarios) {
  const grupos = new Map();
  const sinRF = [];
  for (const e of escenarios) {
    const marcado = { ...e, multiRF: e.rfs.length > 1 };
    if (e.rfs.length === 0) {
      sinRF.push(marcado);
      continue;
    }
    for (const rf of e.rfs) {
      if (!grupos.has(rf)) grupos.set(rf, []);
      grupos.get(rf).push(marcado);
    }
  }

  const lista = [...grupos.keys()].sort().map((rf) => {
    const items = grupos.get(rf);
    return {
      rf,
      titulo: RF_TITULOS[rf] ?? rf.toUpperCase(),
      escenarios: items,
      total: items.length,
      pasados: items.filter((e) => e.ok).length,
    };
  });

  if (sinRF.length > 0) {
    lista.push({
      rf: 'sin-rf',
      titulo: 'Sin RF · Estructural / soporte',
      escenarios: sinRF,
      total: sinRF.length,
      pasados: sinRF.filter((e) => e.ok).length,
    });
  }

  // Resumen que cuenta cada escenario UNA vez (coincide con el reporte nativo).
  const total = escenarios.length;
  const pasados = escenarios.filter((e) => e.ok).length;
  return { grupos: lista, resumen: { total, pasados, fallidos: total - pasados } };
}

/**
 * Lee los escenarios de Karate desde los *.karate-json.txt (uno por feature).
 * Deduplica por nombre+feature por si quedaron JSON de runners anteriores en la
 * carpeta (varios runners sobrescriben parcialmente karate-reports).
 */
function leerEscenariosKarate() {
  if (!existsSync(KARATE_REPORT_DIR)) return [];
  const vistos = new Set();
  const out = [];
  for (const f of readdirSync(KARATE_REPORT_DIR)) {
    if (!f.endsWith('.karate-json.txt')) continue;
    try {
      const data = JSON.parse(readFileSync(join(KARATE_REPORT_DIR, f), 'utf-8'));
      const feature = data.packageQualifiedName ?? f;
      for (const sr of data.scenarioResults ?? []) {
        const nombre = sr.name ?? '(sin nombre)';
        // Clave estable: feature + nombre + índice de ejemplo (Scenario Outline).
        const clave = `${feature}::${nombre}::${sr.exampleIndex ?? -1}::${sr.refId ?? ''}`;
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        out.push(escenario(nombre, sr.tags ?? [], sr.failed !== true));
      }
    } catch {
      /* feature sin JSON legible: se omite */
    }
  }
  return out;
}

/** Lee los escenarios de Playwright desde playwright-report/resultados.json. */
function leerEscenariosPlaywright() {
  const json = join(PLAYWRIGHT_REPORT_DIR, 'resultados.json');
  if (!existsSync(json)) return [];
  let data;
  try {
    data = JSON.parse(readFileSync(json, 'utf-8'));
  } catch {
    return [];
  }
  const out = [];
  const visitar = (suites) => {
    for (const s of suites ?? []) {
      for (const spec of s.specs ?? []) {
        const ok = spec.ok === true || (spec.tests ?? []).every((t) => t.status === 'expected');
        out.push(escenario(spec.title ?? '(sin título)', spec.tags ?? [], ok));
      }
      if (s.suites) visitar(s.suites);
    }
  };
  visitar(data.suites);
  return out;
}

/** HTML del bloque de agrupación por RF (recibe { grupos, resumen }). */
function htmlGruposRF(agrupado) {
  const grupos = agrupado?.grupos ?? [];
  const resumen = agrupado?.resumen ?? { total: 0, pasados: 0, fallidos: 0 };
  if (grupos.length === 0) {
    return '<p class="rf-vacio">Sin escenarios en el último reporte.</p>';
  }

  // Línea de totales que CUADRA con el reporte nativo (cada escenario contado una vez).
  const resumenHtml = `
        <p class="rf-resumen">
          <strong>${resumen.total}</strong> escenarios ·
          <span class="ok">${resumen.pasados} ✓</span> ·
          <span class="${resumen.fallidos > 0 ? 'fail' : 'ok'}">${resumen.fallidos} ✗</span>
          <span class="rf-nota">(coincide con el total del reporte nativo)</span>
        </p>`;

  const gruposHtml = grupos
    .map((g) => {
      const completo = g.pasados === g.total;
      const badgeCls = completo ? 'ok' : 'fail';
      const items = g.escenarios
        .map((e) => {
          const otros = (e.rfs ?? []).filter((r) => r !== g.rf);
          const tagMulti = e.multiRF
            ? ` <span class="rf-tambien">también ${otros.map((r) => r.toUpperCase()).join(', ')}</span>`
            : '';
          return `<li class="${e.ok ? 'ok' : 'fail'}"><span class="ico">${e.ok ? '✓' : '✗'}</span>${e.nombre}${tagMulti}</li>`;
        })
        .join('\n            ');
      return `
        <details class="rf-grupo"${completo ? '' : ' open'}>
          <summary>${g.titulo} <span class="rf-badge ${badgeCls}">${g.pasados}/${g.total}</span></summary>
          <ul class="rf-lista">
            ${items}
          </ul>
        </details>`;
    })
    .join('\n');

  return resumenHtml + '\n' + gruposHtml;
}

async function main() {
  console.log('== Generando reportes consolidados Casa Propia QA ==');

  const soloSuite = leerSoloSuite();
  mkdirSync(DIST, { recursive: true });
  const estado = leerEstado();

  const karateDisponible = existsSync(KARATE_SUMMARY);
  const playwrightDisponible = existsSync(PLAYWRIGHT_INDEX);

  // ¿Qué procesamos esta corrida? Respeta --only y la disponibilidad del reporte.
  const procesarKarate = karateDisponible && (soloSuite === null || soloSuite === 'karate');
  const procesarPlaywright =
    playwrightDisponible && (soloSuite === null || soloSuite === 'playwright');

  if (!procesarKarate && !procesarPlaywright) {
    const yaHayDist = estado.karate || estado.playwright;
    if (yaHayDist) {
      console.log('No hay reportes nuevos para la selección; se conserva el dist/ existente.');
      return;
    }
    console.error('No se encontró ningún reporte. Ejecuta primero las pruebas (ver README).');
    process.exit(1);
  }

  // 1. Copiar los reportes HTML navegables SOLO de las suites a regenerar,
  //    y calcular la agrupación de escenarios por RF.
  if (procesarKarate) {
    console.log('- Copiando reporte Karate...');
    copiarReporte(KARATE_REPORT_DIR, 'karate');
    estado.karate = {
      actualizado: fechaMod(KARATE_SUMMARY),
      marcaMs: statSync(KARATE_SUMMARY).mtime.getTime(),
      gruposRF: agruparPorRF(leerEscenariosKarate()),
    };
  }
  if (procesarPlaywright) {
    console.log('- Copiando reporte Playwright...');
    copiarReporte(PLAYWRIGHT_REPORT_DIR, 'playwright');
    estado.playwright = {
      actualizado: fechaMod(PLAYWRIGHT_INDEX),
      marcaMs: statSync(PLAYWRIGHT_INDEX).mtime.getTime(),
      gruposRF: agruparPorRF(leerEscenariosPlaywright()),
    };
  }

  // Detecta reportes nativos más nuevos que lo que el index va a mostrar (señal de
  // que esa suite se ejecutó pero no se reprocesó en esta corrida -> datos "viejos").
  const avisos = [];
  if (!procesarKarate && karateDisponible && estado.karate) {
    const nativo = statSync(KARATE_SUMMARY).mtime;
    if (nativo > new Date(estado.karate.marcaMs ?? 0)) {
      avisos.push('Karate tiene un reporte más reciente que el mostrado. Regenera con: node reports/generar-reportes.mjs');
    }
  }
  if (!procesarPlaywright && playwrightDisponible && estado.playwright) {
    const nativo = statSync(PLAYWRIGHT_INDEX).mtime;
    if (nativo > new Date(estado.playwright.marcaMs ?? 0)) {
      avisos.push('Playwright tiene un reporte más reciente que el mostrado. Regenera con: node reports/generar-reportes.mjs');
    }
  }

  // Evidencia de jornada: siempre se refresca (es barata y es solo texto).
  const evidencia = listarEvidenciaJornada();
  if (evidencia.length > 0) {
    rmSync(join(DIST, 'evidence'), { recursive: true, force: true });
    cpSync(join(EVIDENCE_DIR, 'karate'), join(DIST, 'evidence', 'karate'), { recursive: true });
  }

  // 2. PDFs con Chromium, solo de las suites regeneradas.
  console.log('- Lanzando Chromium para PDFs...');
  const browser = await chromium.launch();
  try {
    if (procesarKarate) {
      console.log('  · PDF Karate...');
      estado.karate.pdf = await htmlAPdf(
        browser,
        join(DIST, 'karate', 'karate-summary.html'),
        join(DIST, 'karate-reporte.pdf')
      );
    }
    if (procesarPlaywright) {
      console.log('  · PDF Playwright...');
      estado.playwright.pdf = await htmlAPdf(
        browser,
        join(DIST, 'playwright', 'index.html'),
        join(DIST, 'playwright-reporte.pdf')
      );
    }
  } finally {
    await browser.close();
  }

  // 3. index.html unificado (refleja el estado acumulado de ambas suites).
  console.log('- Escribiendo index.html unificado...');

  const tarjetaKarate = estado.karate
    ? `
      <article class="card">
        <h2>API — Karate 1.4.1</h2>
        <p class="meta">Última actualización: ${estado.karate.actualizado || 'n/d'}</p>
        <p>Reporte navegable con cada escenario Gherkin (Given/When/Then), request y response por paso.</p>
        <div class="links">
          <a class="btn" href="karate/karate-summary.html">Abrir reporte HTML</a>
          ${estado.karate.pdf ? '<a class="btn ghost" href="karate-reporte.pdf">Descargar PDF</a>' : ''}
        </div>
        <div class="rf-bloque">
          <h3>Casos por requisito (RF)</h3>
          ${htmlGruposRF(estado.karate.gruposRF ?? [])}
        </div>
      </article>`
    : '';

  const tarjetaPlaywright = estado.playwright
    ? `
      <article class="card">
        <h2>UI — Playwright + BDD</h2>
        <p class="meta">Última actualización: ${estado.playwright.actualizado || 'n/d'}</p>
        <p>Reporte navegable con el paso a paso de cada recorrido: captura por paso, video y traza (timeline).</p>
        <div class="links">
          <a class="btn" href="playwright/index.html">Abrir reporte HTML</a>
          ${estado.playwright.pdf ? '<a class="btn ghost" href="playwright-reporte.pdf">Descargar PDF</a>' : ''}
        </div>
        <div class="rf-bloque">
          <h3>Casos por requisito (RF)</h3>
          ${htmlGruposRF(estado.playwright.gruposRF ?? [])}
        </div>
      </article>`
    : '';

  const listaEvidencia =
    evidencia.length > 0
      ? `
      <article class="card">
        <h2>Evidencia de jornada (RF06)</h2>
        <p>Salidas de la ejecución concurrente de la jornada (Karate).</p>
        <ul class="evidence">
          ${evidencia.map((e) => `<li><a href="${e.rel}" target="_blank">${e.nombre}</a></li>`).join('\n          ')}
        </ul>
      </article>`
      : '';

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Casa Propia QA — Reportes consolidados</title>
  <style>
    :root { --bg:#0f172a; --card:#1e293b; --fg:#e2e8f0; --muted:#94a3b8; --accent:#38bdf8; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: system-ui, Segoe UI, Roboto, sans-serif; background:var(--bg); color:var(--fg); }
    header { padding:40px 24px 16px; max-width:960px; margin:0 auto; }
    header h1 { margin:0 0 4px; font-size:1.8rem; }
    header p { margin:0; color:var(--muted); }
    main { max-width:960px; margin:0 auto; padding:16px 24px 48px; display:grid; gap:20px; }
    .card { background:var(--card); border:1px solid #334155; border-radius:12px; padding:24px; }
    .card h2 { margin:0 0 4px; font-size:1.2rem; }
    .card p { margin:0 0 16px; color:var(--muted); }
    .card p.meta { margin:0 0 10px; font-size:.8rem; color:#64748b; }
    .links { display:flex; gap:12px; flex-wrap:wrap; }
    .btn { display:inline-block; background:var(--accent); color:#082f49; text-decoration:none; font-weight:600; padding:10px 16px; border-radius:8px; }
    .btn.ghost { background:transparent; color:var(--accent); border:1px solid var(--accent); }
    .evidence { margin:0; padding-left:20px; columns:2; }
    .evidence a { color:var(--accent); }
    .rf-bloque { margin-top:20px; border-top:1px solid #334155; padding-top:16px; }
    .rf-bloque h3 { margin:0 0 12px; font-size:.95rem; color:var(--fg); }
    .rf-vacio { color:var(--muted); font-size:.85rem; }
    .rf-resumen { margin:0 0 12px; font-size:.9rem; color:var(--fg); }
    .rf-resumen .ok { color:#34d399; }
    .rf-resumen .fail { color:#f87171; }
    .rf-resumen .rf-nota { color:#64748b; font-size:.78rem; font-style:italic; }
    .rf-tambien { color:#64748b; font-size:.72rem; font-style:italic; margin-left:6px; white-space:nowrap; }
    .rf-grupo { background:#0b1220; border:1px solid #334155; border-radius:8px; margin-bottom:8px; padding:4px 12px; }
    .rf-grupo summary { cursor:pointer; font-weight:600; padding:8px 0; list-style:none; display:flex; align-items:center; gap:10px; }
    .rf-grupo summary::-webkit-details-marker { display:none; }
    .rf-grupo summary::before { content:'▸'; color:var(--muted); }
    .rf-grupo[open] summary::before { content:'▾'; }
    .rf-badge { margin-left:auto; font-size:.75rem; font-weight:700; padding:2px 8px; border-radius:999px; }
    .rf-badge.ok { background:#064e3b; color:#6ee7b7; }
    .rf-badge.fail { background:#7f1d1d; color:#fca5a5; }
    .rf-lista { list-style:none; margin:0 0 8px; padding:0; }
    .rf-lista li { display:flex; gap:8px; padding:4px 0; font-size:.85rem; color:var(--muted); border-top:1px solid #1e293b; }
    .rf-lista li .ico { font-weight:700; }
    .rf-lista li.ok .ico { color:#34d399; }
    .rf-lista li.fail { color:#fca5a5; }
    .rf-lista li.fail .ico { color:#f87171; }
    footer { max-width:960px; margin:0 auto; padding:0 24px 40px; color:var(--muted); font-size:.85rem; }
    code { background:#0b1220; padding:2px 6px; border-radius:4px; }
    .aviso { max-width:960px; margin:0 auto 8px; padding:12px 16px; background:#78350f; border:1px solid #b45309; border-radius:8px; color:#fde68a; font-size:.85rem; }
    .aviso strong { color:#fef3c7; }
  </style>
</head>
<body>
  <header>
    <h1>Casa Propia QA — Reportes consolidados</h1>
    <p>Index regenerado el ${fmtFecha()}</p>
  </header>
  ${avisos.map((a) => `<div class="aviso"><strong>Atención:</strong> ${a}</div>`).join('\n  ')}
  <main>
    ${tarjetaKarate}
    ${tarjetaPlaywright}
    ${listaEvidencia}
  </main>
  <footer>
    Cada reporte HTML contiene el detalle paso a paso del caso Gherkin. Los PDF son una captura
    estática para archivar o compartir. Regenera todo con
    <code>node reports/generar-reportes.mjs</code> o solo una suite con
    <code>--only karate</code> / <code>--only playwright</code>.
  </footer>
</body>
</html>`;

  writeFileSync(join(DIST, 'index.html'), html, 'utf-8');
  writeFileSync(ESTADO, JSON.stringify(estado, null, 2), 'utf-8');

  console.log('\nListo. Abre:');
  console.log('  ' + join(DIST, 'index.html'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
