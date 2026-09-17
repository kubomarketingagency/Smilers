#!/usr/bin/env node
/*
 * Levanta el sitio en local para poder revisarlo en el navegador:
 *
 *     node herramientas/servidor.js
 *
 * Y en otro puerto, si el 8099 esta ocupado:
 *
 *     node herramientas/servidor.js 3000
 *
 * Sirve la carpeta del proyecto tal cual esta, asi que **ensena lo construido,
 * no lo que hay en estilos/ y scripts/**: las paginas llevan los estilos dentro
 * y piden los guiones de paquetes/, de modo que despues de tocar una hoja o un
 * guion hay que correr `node herramientas/construir.js` para verlo aqui. Es la
 * misma regla que para publicar, y se avisa al arrancar (ver CACHE.md).
 *
 * No copia a Vercel entero: copia lo que cambia lo que se ve en pantalla, que
 * es lo unico que hay que revisar aqui.
 *
 *  - `cleanUrls`: /nosotros sirve nosotros.html, y si alguien escribe
 *    /nosotros.html se le manda a /nosotros, igual que en produccion. Sin esto
 *    cada enlace del sitio —que van todos sin extension— daria 404 en local y
 *    no se podria navegar de una pagina a otra.
 *  - Las redirecciones de vercel.json, las de /subpaginas/*, con su 308.
 *  - Los tipos de contenido. Un .webp servido como octet-stream no se pinta, y
 *    un .js con el tipo equivocado lo rechaza el navegador entero.
 *  - Lo que no se publica, no existe. Las carpetas de .vercelignore (estilos/,
 *    scripts/, herramientas/, vendor/, los .md y las fotos originales) dan 404
 *    igual que en produccion, y avisan por consola. Sin eso, una pagina que por
 *    error pidiera `estilos/algo.css` funcionaria en local y solo se rompería
 *    una vez publicada, que es el peor sitio para enterarse.
 *
 * Lo que no copia, a proposito: el cacheo de un ano. Aqui todo se sirve con
 * `no-store`, que en local lo que hace falta es ver el ultimo cambio a la
 * primera y no que el navegador se quede con la version de hace media hora.
 *
 * Sin dependencias: el proyecto no tiene package.json y esto no es motivo para
 * que lo tenga.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.argv[2]) || 8099;

const PAGINAS = ['nosotros', 'tratamientos', 'galeria', 'faq'];

/* Lo mismo que .vercelignore, escrito aqui porque ese archivo admite patrones
   que no hace falta interpretar para esto. Si se toca uno, tocar el otro. */
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

/* La redireccion permanente que pide vercel.json: las direcciones viejas de
   /subpaginas/ y, por `cleanUrls`, cualquier .html escrito a mano. */
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

/* Lo que Vercel no sube. Se contesta 404 antes de mirar el disco, que el
   archivo esta ahi y la gracia es que no se pueda pedir. */
function estaPublicado(ruta) {
  const limpia = ruta.replace(/^\/+/, '');
  if (/\.md$/i.test(limpia)) return false;
  return !SIN_PUBLICAR.some(function (carpeta) { return limpia.startsWith(carpeta); });
}

/* El archivo que le toca a una direccion. Solo dentro del proyecto: sin esta
   comprobacion, un `..` en la direccion serviria cualquier archivo del disco. */
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

/* Las direcciones de esta maquina en la red de casa. Son las que hay que
   escribir en el telefono para revisar ahi lo que se hizo para ahi: el emulador
   del escritorio no trae ni el teclado, ni la barra que se esconde al bajar, ni
   el dedo.

   Hay que elegir, y no vale la primera que aparezca: una maquina de trabajo
   tiene media docena de tarjetas y casi todas son inutiles para esto. Se
   ordenan de mas a menos probable y se enseñan todas, que la unica manera de
   saber cual es la buena es probar. */
function direccionesEnLaRed() {
  const tarjetas = os.networkInterfaces();
  const candidatas = [];

  for (const nombre of Object.keys(tarjetas)) {
    for (const señal of tarjetas[nombre] || []) {
      if (señal.family !== 'IPv4' || señal.internal) continue;
      const ip = señal.address;

      /* 169.254.* es lo que Windows se inventa cuando no hay red: no lleva a
         ninguna parte. */
      if (ip.startsWith('169.254.')) continue;

      let puntos = 0;
      /* Las de una red de casa de verdad. */
      if (/^192\.168\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) puntos += 10;
      /* 100.64/10 es el rango de las VPN tipo Tailscale: se llega desde el
         telefono solo si el telefono esta en esa misma VPN, no por el wifi. */
      if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) puntos -= 8;
      /* El wifi es lo que suele compartir red con el telefono. */
      if (/wi-?fi|wlan|wireless|inal[aá]mbric/i.test(nombre)) puntos += 5;
      else if (/ethernet|lan/i.test(nombre)) puntos += 3;
      /* Y las tarjetas de las maquinas virtuales no son la red de nadie. */
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
