#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
const SOLO_VERIFICAR = process.argv.includes('--verificar');

const PAGINAS = [
  'index.html',
  'subpaginas/faq.html',
  'subpaginas/galeria.html',
  'subpaginas/nosotros.html',
  'subpaginas/tratamientos.html'
];

const SELLABLES = /\.(css|js|mjs|webp|avif|png|jpe?g|gif|svg|ico|mp4|webm|woff2?)$/i;

const cacheSellos = new Map();

const TEXTO = /\.(css|js|mjs|svg)$/i;

function sello(rutaAbsoluta) {
  if (cacheSellos.has(rutaAbsoluta)) return cacheSellos.get(rutaAbsoluta);

  let datos;
  if (TEXTO.test(rutaAbsoluta)) {
    datos = Buffer.from(
      fs.readFileSync(rutaAbsoluta, 'utf8').split('\r\n').join('\n'),
      'utf8'
    );
  } else {
    datos = fs.readFileSync(rutaAbsoluta);
  }

  const valor = crypto.createHash('sha1').update(datos).digest('hex').slice(0, 10);
  cacheSellos.set(rutaAbsoluta, valor);
  return valor;
}

const desactualizados = [];
const faltantes = [];

function sellarUrl(url, carpeta, pagina) {
  const limpia = url.trim();
  if (!limpia) return url;

  if (/^(https?:|\/\/|data:|#|mailto:|tel:)/i.test(limpia)) return url;

  const partes = limpia.split('?');
  const ruta = partes[0];
  const consultaPrevia = partes.length > 1 ? '?' + partes.slice(1).join('?') : '';
  if (!SELLABLES.test(ruta)) return url;

  const destino = path.resolve(carpeta, ruta);
  if (!fs.existsSync(destino)) {
    faltantes.push(pagina + ' -> ' + ruta);
    return url;
  }

  const esperada = '?v=' + sello(destino);
  if (consultaPrevia !== esperada) desactualizados.push(pagina + ' -> ' + ruta);
  return ruta + esperada;
}

const ATRIBUTO_SIMPLE = /\b(href|src|data-src-escritorio|data-src-movil|data-antes|data-despues)="([^"]*)"/g;

const ATRIBUTO_LISTA = /\b(srcset|imagesrcset|data-fotos)="([^"]*)"/g;

let cambiados = 0;

PAGINAS.forEach(function (pagina) {
  const rutaPagina = path.join(RAIZ, pagina);
  if (!fs.existsSync(rutaPagina)) return;

  const original = fs.readFileSync(rutaPagina, 'utf8');
  const carpeta = path.dirname(rutaPagina);

  function sellarTexto(texto) {
    let salida = texto.replace(ATRIBUTO_SIMPLE, function (_completo, atributo, valor) {
      return atributo + '="' + sellarUrl(valor, carpeta, pagina) + '"';
    });

    salida = salida.replace(ATRIBUTO_LISTA, function (_completo, atributo, valor) {
      const entradas = valor.split(',').map(function (entrada) {
        const trozos = entrada.trim().split(/\s+/);
        if (!trozos[0]) return entrada.trim();
        trozos[0] = sellarUrl(trozos[0], carpeta, pagina);
        return trozos.join(' ');
      });
      return atributo + '="' + entradas.join(', ') + '"';
    });

    return salida;
  }

  const nuevo = original
    .split(/(<!--[\s\S]*?-->)/)
    .map(function (tramo) {
      return tramo.startsWith('<!--') ? tramo : sellarTexto(tramo);
    })
    .join('');

  if (nuevo === original) return;
  cambiados++;
  if (!SOLO_VERIFICAR) fs.writeFileSync(rutaPagina, nuevo, 'utf8');
});

faltantes.forEach(function (aviso) {
  console.warn('  aviso: ' + aviso + ' no existe');
});

if (SOLO_VERIFICAR) {
  if (desactualizados.length) {
    console.error('Sellos desactualizados:\n  ' + desactualizados.join('\n  '));
    console.error('\nCorre: node scripts/sellar-version.js');
    process.exit(1);
  }
  console.log('Todos los sellos al día.');
} else {
  console.log(cambiados
    ? 'Sellos actualizados en ' + cambiados + ' página(s).'
    : 'Nada que sellar: ya estaba todo al día.');
}
