#!/usr/bin/env node
/*
 * Prepara el sitio para publicar. Una sola orden, siempre, antes de commitear
 * cualquier cambio en estilos/, scripts/, imagenes/, fuentes/ o video-hero/:
 *
 *     node herramientas/construir.js
 *
 * Y para comprobar sin escribir nada (sale con 1 si algo esta desactualizado):
 *
 *     node herramientas/construir.js --verificar
 *
 * Lo que hace en cada pagina:
 *
 *  1. Estilos. Junta en orden las hojas que lista `<style data-hojas="…">`, las
 *     minifica y las escribe dentro de esa misma etiqueta. La pagina no pide ni
 *     una hoja aparte, asi que ninguna peticion bloquea el primer pintado. El
 *     orden de la lista es el orden de la cascada, igual que antes lo era el de
 *     las <link>.
 *  2. Tipografias. Rellena `<script data-fuentes>`: en Windows y Linux cambia la
 *     serie de fuentes/ por la de fuentes/hinting/, que es la que Google Fonts
 *     manda a esas plataformas. Ver estilos/00-fuentes.css.
 *  3. Guiones. Junta en orden los que lista `data-guiones`, los minifica y
 *     escribe el paquete que esa etiqueta pide con `defer` (paquetes/*.js).
 *  4. Sello. Pone `?v=<hash del contenido>` a cada recurso local que pide la
 *     pagina: `href`, `src`, `srcset`, `data-*` y las `url()` de los estilos.
 *     Es lo que permite cachear todo un ano sin congelar nada (ver CACHE.md).
 *
 * La minificacion es a proposito conservadora: quita comentarios y espacios
 * que no significan nada y no toca un solo nombre, numero ni color. En los
 * guiones, ademas, comprueba que la secuencia de piezas que ve el interprete
 * es identica antes y despues, y que ningun salto de linea desaparece.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');
const SOLO_VERIFICAR = process.argv.includes('--verificar');

const PAGINAS = ['index.html', 'nosotros.html', 'tratamientos.html', 'galeria.html', 'faq.html'];
const PAQUETES = 'paquetes';

const SELLABLES = /\.(css|js|mjs|webp|avif|png|jpe?g|gif|svg|ico|mp4|webm|woff2?)$/i;
const TEXTO = /\.(css|js|mjs|svg)$/i;

/* Lo que .vercelignore deja fuera del despliegue. Una pagina no puede pedir
   nada de aqui: en local se veria y publicado daria 404. */
const NO_PUBLICADO = /^(estilos|scripts|herramientas|vendor)\//;

const pendientes = new Map();
const cacheSellos = new Map();
const faltantes = [];
const prohibidos = [];
const desactualizados = [];
const informe = [];

/* ---- archivos y sellos --------------------------------------------------- */

function leerTexto(rel) {
  return fs.readFileSync(path.join(RAIZ, rel), 'utf8').replace(/^\ufeff/, '').split('\r\n').join('\n');
}

function existe(rel) {
  return pendientes.has(rel) || fs.existsSync(path.join(RAIZ, rel));
}

function sello(rel) {
  if (cacheSellos.has(rel)) return cacheSellos.get(rel);
  let datos;
  if (pendientes.has(rel)) datos = Buffer.from(pendientes.get(rel), 'utf8');
  else if (TEXTO.test(rel)) datos = Buffer.from(leerTexto(rel), 'utf8');
  else datos = fs.readFileSync(path.join(RAIZ, rel));
  const valor = crypto.createHash('sha1').update(datos).digest('hex').slice(0, 10);
  cacheSellos.set(rel, valor);
  return valor;
}

function sellarUrl(url, quien) {
  const limpia = url.trim();
  if (!limpia || /^(https?:|\/\/|data:|blob:|#|mailto:|tel:)/i.test(limpia)) return url;
  const ruta = limpia.split('?')[0];
  if (!SELLABLES.test(ruta)) return url;
  const rel = path.posix.normalize(ruta.replace(/^\//, ''));
  if (!existe(rel)) {
    faltantes.push(quien + ' -> ' + ruta);
    return url;
  }
  if (NO_PUBLICADO.test(rel)) prohibidos.push(quien + ' -> ' + ruta);
  return ruta + '?v=' + sello(rel);
}

const ATRIBUTO_SIMPLE = /\b(href|src|data-src-escritorio|data-src-movil|data-antes|data-despues)="([^"]*)"/g;
const ATRIBUTO_LISTA = /\b(srcset|imagesrcset|data-fotos)="([^"]*)"/g;

function sellarHtml(html, pagina) {
  function sellarTexto(texto) {
    return texto
      .replace(ATRIBUTO_SIMPLE, function (_t, atributo, valor) {
        return atributo + '="' + sellarUrl(valor, pagina) + '"';
      })
      .replace(ATRIBUTO_LISTA, function (_t, atributo, valor) {
        const entradas = valor.split(',').map(function (entrada) {
          const trozos = entrada.trim().split(/\s+/);
          if (!trozos[0]) return entrada.trim();
          trozos[0] = sellarUrl(trozos[0], pagina);
          return trozos.join(' ');
        });
        return atributo + '="' + entradas.join(', ') + '"';
      });
  }
  return html.split(/(<!--[\s\S]*?-->)/).map(function (tramo) {
    return tramo.startsWith('<!--') ? tramo : sellarTexto(tramo);
  }).join('');
}

/* Las url() de una hoja son relativas a la hoja; dentro del HTML pasan a ser
   relativas a la pagina, que esta en la raiz. */
function reescribirUrls(css, relHoja, pagina) {
  const carpeta = path.posix.dirname(relHoja);
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, function (todo, comilla, url) {
    if (/^(data:|https?:|\/\/|#|%23)/i.test(url)) return todo;
    const ruta = url.split('?')[0];
    if (!SELLABLES.test(ruta)) return todo;
    const rel = path.posix.normalize(path.posix.join(carpeta, ruta));
    return 'url(' + comilla + sellarUrl(rel, pagina + ' (' + relHoja + ')') + comilla + ')';
  });
}

/* ---- minificar CSS ------------------------------------------------------- */

/* Quita comentarios y espacios. Un espacio se va solo si toca `{ } ; ,`, si
   va detras de `(` o de `:`, o delante de `)` o de `!`: en ninguno de esos
   sitios significa nada. Nunca se toca el espacio alrededor de `+ - > ~`
   (en calc() es obligatorio), ni el de delante de `:` (en un selector es el
   combinador de descendiente) o de `(` (`and (` en una media query). Las
   cadenas y las url() pasan tal cual. Los comentarios `/*!` (licencias) se
   quedan. */
function minificarCSS(css) {
  let salida = '';
  let espacio = false;
  const PEGA = '{};,';
  const n = css.length;

  function poner(pieza) {
    if (espacio && salida.length) {
      const a = salida[salida.length - 1];
      const b = pieza[0];
      const sobra = PEGA.includes(a) || PEGA.includes(b) || a === '(' || a === ':' || b === ')' || b === '!';
      if (!sobra) salida += ' ';
    }
    espacio = false;
    if (pieza === '}' && salida[salida.length - 1] === ';') salida = salida.slice(0, -1);
    salida += pieza;
  }

  let i = 0;
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const fin = css.indexOf('*/', i + 2);
      const j = fin < 0 ? n : fin + 2;
      if (css[i + 2] === '!') {
        poner(css.slice(i, j));
        salida += '\n';
      } else {
        espacio = true;
      }
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c) {
        if (css[j] === '\\') j++;
        j++;
      }
      poner(css.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') {
      espacio = true;
      i++;
      continue;
    }
    if (c === '\\') {
      poner(css.slice(i, i + 2));
      i += 2;
      continue;
    }
    const previo = espacio ? ' ' : (salida[salida.length - 1] || ' ');
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.substr(i, 4)) && !/[\w-]/.test(previo)) {
      let j = i + 4;
      while (j < n && /\s/.test(css[j])) j++;
      if (css[j] !== '"' && css[j] !== "'") {
        const fin = css.indexOf(')', j);
        poner(css.slice(i, i + 4) + css.slice(j, fin).trim() + ')');
        i = fin + 1;
        continue;
      }
    }
    poner(c);
    i++;
  }
  return salida.trim();
}

/* ---- minificar JS -------------------------------------------------------- */

const PUNTUACION = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=',
  '&=', '|=', '^=', '<<', '>>', '**'];

/* Detras de estas palabras una barra abre una expresion regular, no divide. */
const ANTES_DE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'instanceof',
  'new', 'delete', 'void', 'throw', 'yield', 'await', 'of']);

function esLetraNombre(ch) {
  return /[\w$\\]/.test(ch) || (ch > '\u007f' && ch !== '\u00a0' && ch !== '\u2028' && ch !== '\u2029' && ch !== '\ufeff');
}

function trocearJS(s) {
  const piezas = [];
  const n = s.length;
  let previo = null;
  let i = 0;

  function significativa(tipo, valor) {
    const p = { tipo: tipo, valor: valor };
    piezas.push(p);
    previo = p;
  }
  function puedeRegex() {
    if (!previo) return true;
    if (previo.tipo === 'nombre') return ANTES_DE_REGEX.has(previo.valor);
    if (previo.tipo === 'signo') return previo.valor !== ')' && previo.valor !== ']';
    return false;
  }
  function saltarCadena(j, comilla) {
    j++;
    while (j < n && s[j] !== comilla) {
      if (s[j] === '\\') j++;
      else if (s[j] === '\n') throw new Error('cadena sin cerrar en la posicion ' + j);
      j++;
    }
    return j + 1;
  }
  function saltarPlantilla(j) {
    j++;
    while (j < n) {
      const d = s[j];
      if (d === '\\') { j += 2; continue; }
      if (d === '`') return j + 1;
      if (d === '$' && s[j + 1] === '{') { j = saltarExpresion(j + 2); continue; }
      j++;
    }
    throw new Error('plantilla sin cerrar');
  }
  function saltarExpresion(j) {
    let profundidad = 1;
    while (j < n) {
      const d = s[j];
      if (d === '"' || d === "'") { j = saltarCadena(j, d); continue; }
      if (d === '`') { j = saltarPlantilla(j); continue; }
      if (d === '{') profundidad++;
      else if (d === '}' && --profundidad === 0) return j + 1;
      j++;
    }
    throw new Error('expresion de plantilla sin cerrar');
  }

  while (i < n) {
    const c = s[i];
    if (c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029') {
      piezas.push({ tipo: 'salto' });
      i++;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\v' || c === '\f' || c === '\u00a0' || c === '\ufeff') {
      piezas.push({ tipo: 'espacio' });
      i++;
      continue;
    }
    if (c === '/' && s[i + 1] === '/') {
      let j = i;
      while (j < n && s[j] !== '\n' && s[j] !== '\r') j++;
      piezas.push({ tipo: 'comentario', salto: false });
      i = j;
      continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      const fin = s.indexOf('*/', i + 2);
      if (fin < 0) throw new Error('comentario sin cerrar');
      piezas.push({ tipo: 'comentario', salto: /[\n\r\u2028\u2029]/.test(s.slice(i, fin)) });
      i = fin + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const j = saltarCadena(i, c);
      significativa('cadena', s.slice(i, j));
      i = j;
      continue;
    }
    if (c === '`') {
      const j = saltarPlantilla(i);
      significativa('plantilla', s.slice(i, j));
      i = j;
      continue;
    }
    if (c === '/' && puedeRegex()) {
      let j = i + 1;
      let enClase = false;
      while (j < n) {
        const d = s[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '\n') throw new Error('expresion regular sin cerrar en la posicion ' + i);
        if (enClase) { if (d === ']') enClase = false; }
        else if (d === '[') enClase = true;
        else if (d === '/') break;
        j++;
      }
      j++;
      while (j < n && /[A-Za-z]/.test(s[j])) j++;
      significativa('regex', s.slice(i, j));
      i = j;
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1]))) {
      let j = i + 1;
      while (j < n) {
        const d = s[j];
        if (/[\w.]/.test(d)) { j++; continue; }
        if ((d === '+' || d === '-') && /[eE]/.test(s[j - 1]) && !/^0[xX]/.test(s.slice(i, j))) { j++; continue; }
        break;
      }
      significativa('numero', s.slice(i, j));
      i = j;
      continue;
    }
    if (esLetraNombre(c)) {
      let j = i;
      while (j < n && esLetraNombre(s[j])) j++;
      significativa('nombre', s.slice(i, j));
      i = j;
      continue;
    }
    let signo = null;
    for (const p of PUNTUACION) {
      if (s.startsWith(p, i)) { signo = p; break; }
    }
    if (signo === '?.' && /[0-9]/.test(s[i + 2])) signo = null;
    signo = signo || c;
    significativa('signo', signo);
    i += signo.length;
  }
  return piezas;
}

/* Un espacio entre dos piezas solo se quita si una de las dos es uno de estos
   signos: pegados a otra pieza no forman nunca un signo distinto. Los saltos
   de linea no se quitan jamas, que de ellos depende donde acaba cada frase. */
const PEGA_JS = '{}()[],;:=?*%^~&|';

function minificarJS(fuente, nombre) {
  const piezas = trocearJS(fuente);
  let salida = '';
  let separador = '';
  for (const p of piezas) {
    if (p.tipo === 'espacio') { if (!separador) separador = ' '; continue; }
    if (p.tipo === 'salto') { separador = '\n'; continue; }
    if (p.tipo === 'comentario') {
      if (p.salto) separador = '\n';
      else if (!separador) separador = ' ';
      continue;
    }
    if (salida) {
      if (separador === '\n') salida += '\n';
      else if (separador === ' ') {
        const a = salida[salida.length - 1];
        const b = p.valor[0];
        if (!(PEGA_JS.includes(a) || PEGA_JS.includes(b))) salida += ' ';
      }
    }
    salida += p.valor;
    separador = '';
  }

  /* La comprobacion: las mismas piezas, en el mismo orden, y un salto de
     linea delante de las mismas. */
  function huella(codigo) {
    const lista = [];
    let salto = false;
    for (const p of trocearJS(codigo)) {
      if (p.tipo === 'salto' || (p.tipo === 'comentario' && p.salto)) { salto = true; continue; }
      if (p.valor === undefined) continue;
      lista.push((salto ? '\n' : '') + p.valor);
      salto = false;
    }
    return lista;
  }
  const antes = huella(fuente);
  const despues = huella(salida);
  for (let k = 0; k < Math.max(antes.length, despues.length); k++) {
    const x = (antes[k] || '').replace(/^\n/, '');
    const y = (despues[k] || '').replace(/^\n/, '');
    const saltoX = /^\n/.test(antes[k] || '');
    const saltoY = /^\n/.test(despues[k] || '');
    if (x !== y || saltoX !== saltoY) {
      throw new Error('minificarJS altero ' + nombre + ' en la pieza ' + k + ': ' +
        JSON.stringify(antes[k]) + ' -> ' + JSON.stringify(despues[k]));
    }
  }
  return salida;
}

/* ---- las paginas --------------------------------------------------------- */

function listaDe(valor) {
  return valor.split(/\s+/).filter(Boolean);
}

function kb(bytes) { return (bytes / 1024).toFixed(1).padStart(6) + ' KB'; }
function br(texto) { return zlib.brotliCompressSync(Buffer.from(texto, 'utf8')).length; }

function construirEstilos(hojas, pagina) {
  let fuente = 0;
  const css = hojas.map(function (rel) {
    if (!fs.existsSync(path.join(RAIZ, rel))) {
      faltantes.push(pagina + ' -> ' + rel);
      return '';
    }
    const texto = leerTexto(rel).replace(/@charset\s+"[^"]*";/gi, '');
    fuente += Buffer.byteLength(texto);
    return reescribirUrls(minificarCSS(texto), rel, pagina);
  }).join('');
  return { css: css, fuente: fuente };
}

/* El guion de las tipografias. Hace dos cosas, las dos segun la plataforma:
   precarga los archivos que la pagina pide en `data-precargar` (para que
   lleguen antes de pintar y el texto no salte al cambiar de letra) y, en
   Windows y Linux, cambia la serie por la de fuentes/hinting/. Tiene que ir
   por guion porque ni una <link rel="preload"> ni una @font-face saben en que
   sistema estan. */
function guionFuentes(hojas, pagina, precargar) {
  if (!hojas.includes('estilos/00-fuentes.css')) return '';
  const serie = leerTexto('estilos/00-fuentes.css').replace(/\.\.\/fuentes\//g, '../fuentes/hinting/');
  const css = reescribirUrls(minificarCSS(serie), 'estilos/00-fuentes.css', pagina);
  const urls = function (carpeta) {
    return precargar.map(function (nombre) { return sellarUrl(carpeta + nombre + '.woff2', pagina); });
  };
  let js = 'var d=document,h=!/Android|iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);';
  if (precargar.length) {
    js += '(h?' + JSON.stringify(urls('fuentes/hinting/')) + ':' + JSON.stringify(urls('fuentes/')) + ')' +
      '.forEach(function(u){var l=d.createElement("link");l.rel="preload";l.as="font";' +
      'l.type="font/woff2";l.crossOrigin="";l.href=u;d.head.appendChild(l)});';
  }
  js += 'if(h){var s=d.createElement("style");s.textContent=' + JSON.stringify(css) + ';d.head.appendChild(s)}';
  return js;
}

function construirGuiones(lista, pagina) {
  let fuente = 0;
  const trozos = lista.map(function (rel) {
    if (!fs.existsSync(path.join(RAIZ, rel))) {
      faltantes.push(pagina + ' -> ' + rel);
      return '';
    }
    let js = leerTexto(rel);
    fuente += Buffer.byteLength(js);
    js = js.replace(/\n?\/\/# sourceMappingURL=\S+\s*$/, '');
    if (!/\.min\.js$/.test(rel)) js = minificarJS(js, rel);
    return js.trim();
  });
  const paquete = trozos.join(';\n') + '\n';
  new vm.Script(paquete, { filename: pagina });
  return { js: paquete, fuente: fuente };
}

function procesarPagina(pagina) {
  const ruta = path.join(RAIZ, pagina);
  const original = fs.readFileSync(ruta, 'utf8');
  let html = original;
  const fila = { pagina: pagina };
  /* Lo que se escribe dentro de la pagina lleva sus mismos saltos de linea
     (en el disco los HTML van en CRLF): el comentario de licencia de
     Bootstrap tiene varias lineas. */
  const NL = original.includes('\r\n') ? '\r\n' : '\n';
  const conSaltos = function (texto) { return NL === '\n' ? texto : texto.replace(/\r?\n/g, NL); };

  const reEstilos = /(<style\b[^>]*\bdata-hojas="([^"]*)"[^>]*>)[\s\S]*?(<\/style>)/g;
  if ((html.match(reEstilos) || []).length !== 1) throw new Error(pagina + ': tiene que haber una y solo una <style data-hojas>');
  let hojas = [];
  html = html.replace(reEstilos, function (_t, apertura, lista, cierre) {
    hojas = listaDe(lista);
    const r = construirEstilos(hojas, pagina);
    fila.cssFuente = r.fuente;
    fila.css = Buffer.byteLength(r.css);
    fila.cssBr = br(r.css);
    return apertura + conSaltos(r.css) + cierre;
  });

  html = html.replace(/(<script\b[^>]*\bdata-fuentes\b[^>]*>)[\s\S]*?(<\/script>)/, function (_t, apertura, cierre) {
    const lista = apertura.match(/\bdata-precargar="([^"]*)"/);
    return apertura + guionFuentes(hojas, pagina, lista ? listaDe(lista[1]) : []) + cierre;
  });

  const reGuiones = /<script\b[^>]*\bdata-guiones="([^"]*)"[^>]*>/g;
  const etiquetas = html.match(reGuiones) || [];
  if (etiquetas.length > 1) throw new Error(pagina + ': mas de un <script data-guiones>');
  if (etiquetas.length) {
    const etiqueta = etiquetas[0];
    const src = (etiqueta.match(/\bsrc="([^"?]+)/) || [])[1];
    if (!src || !src.startsWith(PAQUETES + '/')) throw new Error(pagina + ': el <script data-guiones> tiene que pedir un paquete de ' + PAQUETES + '/');
    const lista = listaDe(etiqueta.match(/data-guiones="([^"]*)"/)[1]);
    const r = construirGuiones(lista, pagina);
    pendientes.set(src, r.js);
    fila.jsFuente = r.fuente;
    fila.js = Buffer.byteLength(r.js);
    fila.jsBr = br(r.js);
  }

  html = sellarHtml(html, pagina);
  fila.html = Buffer.byteLength(html);
  fila.htmlBr = br(html);
  informe.push(fila);

  if (html !== original) {
    desactualizados.push(pagina);
    if (!SOLO_VERIFICAR) fs.writeFileSync(ruta, html, 'utf8');
  }
}

/* ---- adelante ------------------------------------------------------------ */

PAGINAS.forEach(procesarPagina);

const carpetaPaquetes = path.join(RAIZ, PAQUETES);
if (!SOLO_VERIFICAR) fs.mkdirSync(carpetaPaquetes, { recursive: true });
pendientes.forEach(function (contenido, rel) {
  const abs = path.join(RAIZ, rel);
  const actual = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (actual === contenido) return;
  desactualizados.push(rel);
  if (!SOLO_VERIFICAR) fs.writeFileSync(abs, contenido, 'utf8');
});
if (fs.existsSync(carpetaPaquetes)) {
  fs.readdirSync(carpetaPaquetes).forEach(function (nombre) {
    const rel = PAQUETES + '/' + nombre;
    if (pendientes.has(rel)) return;
    desactualizados.push(rel + ' (sobra)');
    if (!SOLO_VERIFICAR) fs.unlinkSync(path.join(RAIZ, rel));
  });
}

console.log('\n  pagina              estilos (fuente -> min, brotli)          guiones (fuente -> min, brotli)        html final (brotli)');
informe.forEach(function (f) {
  console.log('  ' + f.pagina.padEnd(18) +
    kb(f.cssFuente) + ' ->' + kb(f.css) + ',' + kb(f.cssBr) + '   ' +
    (f.js ? kb(f.jsFuente) + ' ->' + kb(f.js) + ',' + kb(f.jsBr) : '        -') + '   ' +
    kb(f.html) + ' (' + kb(f.htmlBr).trim() + ')');
});
console.log('');

faltantes.forEach(function (aviso) { console.warn('  aviso: ' + aviso + ' no existe'); });
prohibidos.forEach(function (aviso) { console.error('  ERROR: ' + aviso + ' no se publica (.vercelignore)'); });

if (SOLO_VERIFICAR) {
  if (desactualizados.length || prohibidos.length) {
    console.error('Desactualizado:\n  ' + desactualizados.join('\n  '));
    console.error('\nCorre: node herramientas/construir.js');
    process.exit(1);
  }
  console.log('Todo construido y sellado.');
} else {
  console.log(desactualizados.length
    ? 'Actualizado: ' + desactualizados.join(', ')
    : 'Nada que hacer: ya estaba todo al dia.');
  if (prohibidos.length) process.exit(1);
}
