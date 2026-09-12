#!/usr/bin/env node
/**
 * Recorta Bootstrap a lo que el sitio usa de verdad.
 *
 * Bootstrap trae 2031 clases y las paginas nombran 75. El resto son 190 KB que
 * el navegador descarga, analiza y guarda en memoria en cada visita para no
 * pintar nada. Esto lee `bootstrap.min.css` (que se queda en el repo como
 * fuente, fuera del despliegue) y escribe `bootstrap.recorte.css`, que es el
 * que cargan las paginas.
 *
 * La regla es deliberadamente prudente: se conserva un selector si NO nombra
 * ninguna clase —todo el reboot, que se aplica a etiquetas— o si TODAS las
 * clases que nombra estan en la lista de usadas. Ante la duda, se queda.
 *
 * Correlo despues de tocar el HTML si has anadido alguna clase de Bootstrap:
 *     node herramientas/podar-bootstrap.js
 * y luego `node herramientas/construir.js`, como siempre: el recorte viaja
 * dentro de los estilos de cada pagina.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const FUENTE = path.join(RAIZ, 'vendor/bootstrap/bootstrap.min.css');
const DESTINO = path.join(RAIZ, 'vendor/bootstrap/bootstrap.recorte.css');

/* Clases que Bootstrap se pone a si mismo desde su JS y que por eso no
   aparecen escritas en ningun HTML. Si faltan, el acordeon no se abre, el
   carrusel no pasa de foto y el modal se queda a medias. */
const DE_SU_JS = [
  'collapse', 'collapsing', 'collapsed', 'show', 'showing', 'hiding', 'fade',
  'modal', 'modal-open', 'modal-backdrop', 'modal-static', 'modal-dialog',
  'modal-dialog-centered', 'modal-dialog-scrollable', 'modal-content',
  'modal-body', 'modal-header', 'modal-footer', 'modal-title',
  'modal-sm', 'modal-lg', 'modal-xl', 'btn-close',
  'carousel', 'carousel-inner', 'carousel-item', 'carousel-fade',
  'carousel-item-start', 'carousel-item-end', 'carousel-item-next',
  'carousel-item-prev', 'carousel-control-prev', 'carousel-control-next',
  'carousel-control-prev-icon', 'carousel-control-next-icon',
  'carousel-indicators', 'carousel-caption',
  'accordion', 'accordion-item', 'accordion-header', 'accordion-button',
  'accordion-body', 'accordion-collapse', 'accordion-flush',
  'active', 'disabled', 'visually-hidden', 'visually-hidden-focusable'
];

function archivos(carpeta, filtro) {
  const salida = [];
  (function andar(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!/^(\.git|node_modules|\.vercel)$/.test(e.name)) andar(p);
      } else if (filtro.test(e.name)) {
        salida.push(p);
      }
    }
  })(carpeta);
  return salida;
}

/* ---- 1. que nombra el sitio ------------------------------------------- */

const usadas = new Set(DE_SU_JS);

for (const f of archivos(RAIZ, /\.html$/)) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/class\s*=\s*"([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) usadas.add(c);
  }
}

/* El CSS propio del sitio puede colgarse de una clase de Bootstrap para
   afinarla (`.navbar .btn`, `.accordion-button::after`...). */
for (const f of archivos(path.join(RAIZ, 'estilos'), /\.css$/)) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) usadas.add(m[1]);
}

/* Y el JS propio puede anadir o quitar clases por su cuenta. */
for (const f of archivos(path.join(RAIZ, 'scripts'), /\.js$/)) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/["'`]([^"'`\n]{1,120})["'`]/g)) {
    for (const tok of m[1].split(/[^A-Za-z0-9_-]+/)) if (tok) usadas.add(tok);
  }
}

/* ---- 2. trocear y podar ------------------------------------------------ */

function bloques(t) {
  const salida = [];
  let i = 0, ini = 0;
  while (i < t.length) {
    if (t[i] === '{') {
      const cabeza = t.slice(ini, i).trim();
      let j = i + 1, prof = 1;
      while (j < t.length && prof) {
        if (t[j] === '{') prof++;
        else if (t[j] === '}') prof--;
        j++;
      }
      salida.push([cabeza, t.slice(i + 1, j - 1)]);
      i = j;
      ini = i;
      continue;
    }
    i++;
  }
  return salida;
}

function partirPorComas(sel) {
  const salida = [];
  let prof = 0, act = '';
  for (const c of sel) {
    if (c === '(' || c === '[') prof++;
    else if (c === ')' || c === ']') prof--;
    if (c === ',' && prof === 0) { salida.push(act); act = ''; }
    else act += c;
  }
  if (act.trim()) salida.push(act);
  return salida.map(function (s) { return s.trim(); }).filter(Boolean);
}

function seQueda(sel) {
  const cs = [...sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(function (m) { return m[1]; });
  if (!cs.length) return true;                    // reboot: va por etiqueta
  return cs.every(function (c) { return usadas.has(c); });
}

function podar(css) {
  const fuera = [];
  for (const [cabeza, cuerpo] of bloques(css)) {
    if (cabeza.startsWith('@')) {
      const nom = cabeza.split(/\s/)[0];
      if (nom === '@media' || nom === '@supports') {
        const dentro = podar(cuerpo);
        if (dentro.trim()) fuera.push(cabeza + '{' + dentro + '}');
      } else {
        fuera.push(cabeza + '{' + cuerpo + '}');
      }
      continue;
    }
    const vivos = partirPorComas(cabeza).filter(seQueda);
    if (vivos.length) fuera.push(vivos.join(',') + '{' + cuerpo + '}');
  }
  return fuera.join('');
}

const original = fs.readFileSync(FUENTE, 'utf8');
let salida = podar(original);

/* Los keyframes que ya no invoca nadie se van detras de sus reglas. */
const invocados = new Set();
for (const m of salida.matchAll(/animation(?:-name)?\s*:([^;}]*)/g)) {
  for (const tok of m[1].split(/[\s,]+/)) if (tok) invocados.add(tok);
}
salida = bloques(salida).filter(function (b) {
  const cab = b[0];
  if (!/^@(-webkit-)?keyframes/.test(cab)) return true;
  return invocados.has(cab.split(/\s+/).pop());
}).map(function (b) { return b[0] + '{' + b[1] + '}'; }).join('');

const cabecera = '@charset "UTF-8";\n'
  + '/*! Bootstrap 5.3.3 recortado para Smilers Dental Clinique.\n'
  + ' * Generado por scripts/podar-bootstrap.js a partir de bootstrap.min.css.\n'
  + ' * NO editar a mano: el proximo recorte se lo lleva por delante.\n'
  + ' * Licencia MIT — https://github.com/twbs/bootstrap/blob/main/LICENSE */\n';

fs.writeFileSync(DESTINO, cabecera + salida, 'utf8');

const antes = Buffer.byteLength(original, 'utf8') / 1024;
const ahora = Buffer.byteLength(cabecera + salida, 'utf8') / 1024;
console.log('Bootstrap podado: ' + antes.toFixed(1) + ' KB -> ' + ahora.toFixed(1)
  + ' KB (' + (100 - 100 * ahora / antes).toFixed(0) + '% menos)');
