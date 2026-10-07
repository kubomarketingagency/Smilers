#!/usr/bin/env node
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.argv[2]) || 8099;

const PAGINAS = ['nosotros', 'tratamientos', 'galeria', 'faq'];

const SIN_PUBLICAR = ['estilos/', 'scripts/', 'herramientas/', 'vendor/', 'imagenes/originales/'];

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function destinoDeRedireccion(ruta) {
  const limpia = ruta.replace(/\/+$/, '') || '/';

  const vieja = limpia.match(/^\/subpaginas\/([a-z]+)(?:\.html)?$/);
  if (vieja && PAGINAS.includes(vieja[1])) return '/' + vieja[1];
  if (limpia === '/subpaginas') return '/';

  if (limpia === '/index.html') return '/';
  const conExtension = limpia.match(/^\/([a-z]+)\.html$/);
  if (conExtension && PAGINAS.includes(conExtension[1])) return '/' + conExtension[1];

  return null;
}

function estaPublicado(ruta) {
  const limpia = ruta.replace(/^\/+/, '');
  if (/\.md$/i.test(limpia)) return false;
  return !SIN_PUBLICAR.some(function (carpeta) { return limpia.startsWith(carpeta); });
}

function archivoDe(ruta) {
  const limpia = ruta === '/' ? '/index.html' : ruta.replace(/\/+$/, '');
  const candidato = path.resolve(RAIZ, '.' + limpia);
  if (candidato !== RAIZ && !candidato.startsWith(RAIZ + path.sep)) return null;

  for (const intento of [candidato, candidato + '.html']) {
    if (fs.existsSync(intento) && fs.statSync(intento).isFile()) return intento;
  }
  return null;
}

const servidor = http.createServer(function (peticion, respuesta) {
  let ruta;
  try {
    ruta = decodeURIComponent(peticion.url.split('?')[0]);
  } catch (e) {
    respuesta.writeHead(400, { 'Content-Type': TIPOS['.txt'] });
    return respuesta.end('Direccion mal escrita');
  }

  const redireccion = destinoDeRedireccion(ruta);
  if (redireccion) {
    respuesta.writeHead(308, { Location: redireccion });
    return respuesta.end();
  }

  if (!estaPublicado(ruta)) {
    console.log('  404  ' + ruta + '   <- esta carpeta no se publica (.vercelignore)');
    respuesta.writeHead(404, { 'Content-Type': TIPOS['.txt'] });
    return respuesta.end('Esa carpeta no se publica: en produccion tampoco existiria.');
  }

  const archivo = archivoDe(ruta);
  if (!archivo) {
    console.log('  404  ' + ruta);
    respuesta.writeHead(404, { 'Content-Type': TIPOS['.html'] });
    return respuesta.end('<!doctype html><meta charset="utf-8"><title>404</title>'
      + '<body style="font:16px system-ui;padding:3rem">'
      + '<h1>404</h1><p>No existe <code>' + ruta.replace(/[<&]/g, '') + '</code>.'
      + '<p><a href="/">Volver a la portada</a>');
  }

  respuesta.writeHead(200, {
    'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(archivo).pipe(respuesta);
});

servidor.on('error', function (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('\n  El puerto ' + PUERTO + ' esta ocupado.');
    console.error('  Prueba con otro:  node herramientas/servidor.js ' + (PUERTO + 1) + '\n');
    process.exit(1);
  }
  throw error;
});

function direccionesEnLaRed() {
  const tarjetas = os.networkInterfaces();
  const candidatas = [];

  for (const nombre of Object.keys(tarjetas)) {
    for (const señal of tarjetas[nombre] || []) {
      if (señal.family !== 'IPv4' || señal.internal) continue;
      const ip = señal.address;

      if (ip.startsWith('169.254.')) continue;

      let puntos = 0;
      if (/^192\.168\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) puntos += 10;
      if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) puntos -= 8;
      if (/wi-?fi|wlan|wireless|inal[aá]mbric/i.test(nombre)) puntos += 5;
      else if (/ethernet|lan/i.test(nombre)) puntos += 3;
      if (/virtualbox|vmware|hyper-v|vethernet|docker|wsl|loopback/i.test(nombre)) puntos -= 10;

      candidatas.push({ ip, nombre, puntos });
    }
  }

  return candidatas.sort(function (a, b) { return b.puntos - a.puntos; });
}

servidor.listen(PUERTO, function () {
  const base = 'http://localhost:' + PUERTO;
  console.log('\n  El sitio esta en ' + base + '\n');
  console.log('    portada         ' + base + '/');
  PAGINAS.forEach(function (pagina) {
    console.log('    ' + pagina.padEnd(15) + ' ' + base + '/' + pagina);
  });

  const red = direccionesEnLaRed();
  if (red.length) {
    console.log('\n  Desde el telefono, con el mismo wifi:');
    red.slice(0, 3).forEach(function (t, i) {
      console.log('    ' + (i === 0 ? '->' : '  ') + ' http://' + t.ip + ':' + PUERTO
        + '   (' + t.nombre + ')');
    });
    console.log('  Si la primera no carga, prueba la siguiente; y si no carga ninguna,');
    console.log('  es el cortafuegos de Windows: deja pasar a node.');
  }

  console.log('\n  Sirve lo construido: despues de tocar estilos/ o scripts/, corre');
  console.log('  `node herramientas/construir.js` y recarga.');
  console.log('\n  Ctrl+C para parar.\n');
});
