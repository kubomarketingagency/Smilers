#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const vm = require('vm');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const SOLO_VERIFICAR = process.argv.includes('--verificar');

const PAGINAS = ['index.html', 'nosotros.html', 'tratamientos.html', 'galeria.html', 'faq.html', 'privacidad.html', '404.html'];
const PAQUETES = 'paquetes';

const RESPETAR_MENOS_MOVIMIENTO = false;

const GUION_MOVIMIENTO =
  '(function(){var m=window.matchMedia;if(!m)return;window.matchMedia=function(q){' +
  'var c=String(q).replace(/\\s+/g,"").toLowerCase();' +
  'return m.call(window,c==="(prefers-reduced-motion:no-preference)"?"all":' +
  'c==="(prefers-reduced-motion:reduce)"||c==="(prefers-reduced-motion)"?"not all":q)}})();';

const SELLABLES = /\.(css|js|mjs|webp|avif|png|jpe?g|gif|svg|ico|mp4|webm|woff2?)$/i;
const TEXTO = /\.(css|js|mjs|svg)$/i;

const NO_PUBLICADO = /^(estilos|scripts|herramientas|vendor|parciales)\//;
const PARCIALES = 'parciales';

const pendientes = new Map();
const cacheSellos = new Map();
const faltantes = [];
const prohibidos = [];
const desactualizados = [];
const informe = [];
const finales = new Map();
const DOMINIO = 'https://smilersdental.vercel.app';

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

const ATRIBUTO_SIMPLE = /\b(href|src|data-src-escritorio|data-src-movil|data-anim-escritorio|data-anim-movil|data-antes|data-despues|data-perezoso-js|data-perezoso-css|data-video|data-foto)="([^"]*)"/g;
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

const PUNTUACION = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=',
  '&=', '|=', '^=', '<<', '>>', '**'];

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

function listaDe(valor) {
  return valor.split(/\s+/).filter(Boolean);
}

function kb(bytes) { return (bytes / 1024).toFixed(1).padStart(6) + ' KB'; }
function br(texto) { return zlib.brotliCompressSync(Buffer.from(texto, 'utf8')).length; }

function conRespaldoVh(css) {
  return css.replace(/([{;])([a-z][a-z-]*):([^;{}]*\d(?:s|l|d)vh\b[^;{}]*)(?=[;}])/g,
    function (_t, antes, prop, valor) {
      return antes + prop + ':' + valor.replace(/(\d)(?:s|l|d)vh\b/g, '$1vh') + ';' + prop + ':' + valor;
    });
}

function finDeBloque(css, abre) {
  let profundidad = 0;
  for (let k = abre; k < css.length; k++) {
    const c = css[k];
    if (c === '\\') { k++; continue; }
    if (c === '"' || c === "'") {
      k++;
      while (k < css.length && css[k] !== c) {
        if (css[k] === '\\') k++;
        k++;
      }
      continue;
    }
    if (c === '/' && css[k + 1] === '*') {
      const fin = css.indexOf('*/', k + 2);
      if (fin < 0) break;
      k = fin + 1;
      continue;
    }
    if ((c === 'u' || c === 'U') && /^url\([^'"]/i.test(css.substr(k, 5))) {
      const fin = css.indexOf(')', k);
      if (fin < 0) break;
      k = fin;
      continue;
    }
    if (c === '{') profundidad++;
    else if (c === '}' && --profundidad === 0) return k;
  }
  throw new Error('llave sin cerrar');
}

function conMovimiento(css, hoja) {
  if (RESPETAR_MENOS_MOVIMIENTO) return css;
  const REDUCIR = '@media (prefers-reduced-motion:reduce){';
  let salida = css.split('@media (prefers-reduced-motion:no-preference){').join('@media all{');
  for (let i = salida.indexOf(REDUCIR); i !== -1; i = salida.indexOf(REDUCIR, i)) {
    salida = salida.slice(0, i) + salida.slice(finDeBloque(salida, i + REDUCIR.length - 1) + 1);
  }
  if (/prefers-reduced-motion/i.test(salida)) {
    throw new Error(hoja + ': pregunta por prefers-reduced-motion de una forma que conMovimiento() no sabe tratar');
  }
  return salida;
}

function construirEstilos(hojas, pagina) {
  let fuente = 0;
  const css = hojas.map(function (rel) {
    if (!fs.existsSync(path.join(RAIZ, rel))) {
      faltantes.push(pagina + ' -> ' + rel);
      return '';
    }
    const texto = leerTexto(rel).replace(/@charset\s+"[^"]*";/gi, '');
    fuente += Buffer.byteLength(texto);
    return reescribirUrls(conRespaldoVh(conMovimiento(minificarCSS(texto), rel)), rel, pagina);
  }).join('');
  return { css: css, fuente: fuente };
}

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

function finDeElemento(html, desde) {
  const tag = /^<([a-z][a-z0-9-]*)/i.exec(html.slice(desde, desde + 40))[1];
  const re = new RegExp('<(/?)' + tag + '(?=[\\s>/])[^>]*>', 'gi');
  re.lastIndex = desde;
  let profundidad = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) { if (--profundidad === 0) return m.index + m[0].length; }
    else if (!m[0].endsWith('/>')) profundidad++;
  }
  throw new Error('<' + tag + '> sin cerrar');
}

function rutaDe(pagina) {
  return pagina === 'index.html' ? '/' : '/' + pagina.replace(/\.html$/, '');
}

function leerParcial(nombre) {
  return leerTexto(PARCIALES + '/' + nombre).replace(/\n+$/, '');
}

function menuPara(texto, ruta) {
  return texto
    .replace('class="menu-col__titulo" href="' + ruta + '"', 'class="menu-col__titulo activo" href="' + ruta + '"')
    .split('href="' + ruta + '#').join('href="#');
}

function iconosPara(resto, pagina) {
  const maestro = leerParcial('iconos.svg');
  const simbolos = [...maestro.matchAll(/<symbol\b[^>]*\bid="([^"]+)"[\s\S]*?<\/symbol>/g)];
  const disponibles = new Set(simbolos.map(function (m) { return m[1]; }));
  const usados = new Set([...resto.matchAll(/<use\b[^>]*\bhref="#([\w-]+)"/g)].map(function (m) { return m[1]; }));
  usados.forEach(function (id) {
    if (!disponibles.has(id) && !resto.includes('id="' + id + '"')) throw new Error(pagina + ': falta el icono #' + id + ' en ' + PARCIALES + '/iconos.svg');
  });
  const apertura = /^<svg\b[^>]*>/.exec(maestro)[0];
  return apertura + '\n' + simbolos.filter(function (m) { return usados.has(m[1]); })
    .map(function (m) { return '    ' + m[0]; }).join('\n') + '\n  </svg>';
}

function conParciales(html, pagina, conSaltos) {
  ['barra', 'menu', 'pie'].forEach(function (nombre) {
    const m = new RegExp('<[a-z]+\\b[^>]*\\bdata-parcial="' + nombre + '"').exec(html);
    if (!m) return;
    let texto = leerParcial(nombre + '.html');
    if (nombre === 'menu') texto = menuPara(texto, rutaDe(pagina));
    html = html.slice(0, m.index) + conSaltos(texto) + html.slice(finDeElemento(html, m.index));
  });
  const m = /<svg\b[^>]*\bdata-parcial="iconos"/.exec(html);
  if (m) {
    const fin = finDeElemento(html, m.index);
    const sprite = iconosPara(html.slice(0, m.index) + html.slice(fin), pagina);
    html = html.slice(0, m.index) + conSaltos(sprite) + html.slice(fin);
  }
  return html;
}

function procesarPagina(pagina) {
  const ruta = path.join(RAIZ, pagina);
  const original = fs.readFileSync(ruta, 'utf8');
  const fila = { pagina: pagina };
  const NL = original.includes('\r\n') ? '\r\n' : '\n';
  const conSaltos = function (texto) { return NL === '\n' ? texto : texto.replace(/\r?\n/g, NL); };
  let html = conParciales(original, pagina, conSaltos);

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

  const reMovimiento = /(<script\b[^>]*\bdata-movimiento\b[^>]*>)[\s\S]*?(<\/script>)/g;
  const movimientos = html.match(reMovimiento) || [];
  if (movimientos.length !== 1 || html.indexOf('<script') !== html.indexOf(movimientos[0])) {
    throw new Error(pagina + ': tiene que haber un <script data-movimiento>, y tiene que ser el primer <script> de la pagina');
  }
  html = html.replace(reMovimiento, function (_t, apertura, cierre) {
    return apertura + (RESPETAR_MENOS_MOVIMIENTO ? '' : GUION_MOVIMIENTO) + cierre;
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

  const rePerezosos = /<meta\b[^>]*\bdata-guiones-perezosos="([^"]*)"[^>]*>/g;
  (html.match(rePerezosos) || []).forEach(function (etiqueta) {
    const src = (etiqueta.match(/\bdata-perezoso-js="([^"?]+)/) || [])[1];
    if (!src || !src.startsWith(PAQUETES + '/')) throw new Error(pagina + ': la <meta data-guiones-perezosos> tiene que pedir un paquete de ' + PAQUETES + '/');
    const r = construirGuiones(listaDe(etiqueta.match(/data-guiones-perezosos="([^"]*)"/)[1]), pagina);
    pendientes.set(src, r.js);
  });

  html = sellarHtml(html, pagina);
  finales.set(pagina, html);
  fila.html = Buffer.byteLength(html);
  fila.htmlBr = br(html);
  informe.push(fila);

  if (html !== original) {
    desactualizados.push(pagina);
    if (!SOLO_VERIFICAR) fs.writeFileSync(ruta, html, 'utf8');
  }
}

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

function fechaLocal(fecha) {
  const dos = function (n) { return String(n).padStart(2, '0'); };
  return fecha.getFullYear() + '-' + dos(fecha.getMonth() + 1) + '-' + dos(fecha.getDate());
}

function git(orden) {
  try {
    return execSync('git ' + orden, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    return null;
  }
}

function ultimoCambio(pagina) {
  const pendiente = desactualizados.includes(pagina) || git('status --porcelain -- "' + pagina + '"');
  if (pendiente) return fechaLocal(new Date());
  return git('log -1 --format=%cs -- "' + pagina + '"') || fechaLocal(new Date());
}

function escaparXml(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function imagenesDe(html) {
  let m;
  while ((m = /<[a-z]+\b[^>]*\bdata-parcial="[a-z]+"/.exec(html))) html = html.slice(0, m.index) + html.slice(finDeElemento(html, m.index));
  const vistas = new Set();
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const alt = /\salt="([^"]*)"/.exec(m[0]);
    if (!alt || !alt[1].trim()) continue;
    const url = (/\ssrc="([^"]+)"/.exec(m[0]) || /\sdata-src="([^"]+)"/.exec(m[0]) || [])[1];
    if (!url || /^(data:|https?:|\/\/)/i.test(url)) continue;
    vistas.add(DOMINIO + '/' + url.replace(/^\//, ''));
  }
  return Array.from(vistas);
}

function generarSitemap() {
  const urls = PAGINAS.filter(function (pagina) {
    return !/<meta name="robots" content="[^"]*noindex/i.test(finales.get(pagina) || '');
  }).map(function (pagina) {
    const imagenes = imagenesDe(finales.get(pagina)).map(function (url) {
      return '    <image:image>\n      <image:loc>' + escaparXml(url) + '</image:loc>\n    </image:image>\n';
    }).join('');
    return '  <url>\n    <loc>' + DOMINIO + rutaDe(pagina) + '</loc>\n    <lastmod>' + ultimoCambio(pagina) + '</lastmod>\n' + imagenes + '  </url>\n';
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    urls.join('') + '</urlset>\n';
}

const sitemap = generarSitemap();
const rutaSitemap = path.join(RAIZ, 'sitemap.xml');
const sitemapActual = fs.existsSync(rutaSitemap) ? fs.readFileSync(rutaSitemap, 'utf8').replace(/\r\n/g, '\n') : null;
if (sitemapActual !== sitemap) {
  desactualizados.push('sitemap.xml');
  if (!SOLO_VERIFICAR) fs.writeFileSync(rutaSitemap, sitemap, 'utf8');
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
