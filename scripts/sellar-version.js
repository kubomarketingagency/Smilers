#!/usr/bin/env node
/* ==========================================================================
   SELLADO DE VERSIÓN DE LOS ASSETS
   --------------------------------------------------------------------------
   Reemplaza el "?v=..." de cada <link>/<script> local de los HTML por los
   primeros 10 caracteres del SHA-1 del archivo al que apuntan.

   Por qué: el "?v=38" a mano funciona solo si uno se acuerda de subirlo, y
   basta olvidarlo una vez para que quien ya visitó el sitio se quede viendo
   el CSS viejo — que es justo lo que pasó. Con el sello por contenido la URL
   cambia sola en cuanto el archivo cambia, y NO cambia si el archivo no
   cambió (así el navegador reaprovecha lo que ya tiene).

   Uso:  node scripts/sellar-version.js
         node scripts/sellar-version.js --verificar   (no escribe; devuelve
         código 1 si algún sello está desactualizado — para usarlo en CI)
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
const SOLO_VERIFICAR = process.argv.includes('--verificar');

/* Qué HTML se revisan. Se listan a mano en vez de recorrer todo el árbol:
   el proyecto es de tamaño conocido y así nunca se cuela un archivo de
   prueba o un backup suelto. */
const PAGINAS = [
  'index.html',
  'subpaginas/faq.html',
  'subpaginas/galeria.html',
  'subpaginas/nosotros.html',
  'subpaginas/tratamientos.html'
];

const cacheSellos = new Map();

/* Se normalizan los finales de línea ANTES de calcular el hash. En Windows
   git suele estar con core.autocrlf, así que el mismo archivo es CRLF en la
   copia de trabajo y LF en el repositorio (que es lo que acaba desplegado):
   sin normalizar, el sello calculado en local no coincide con el del archivo
   servido y cambiaría de un checkout a otro sin que el contenido cambie. */
function sello(rutaAbsoluta) {
  if (cacheSellos.has(rutaAbsoluta)) return cacheSellos.get(rutaAbsoluta);
  const contenido = fs.readFileSync(rutaAbsoluta, 'utf8').split('\r\n').join('\n');
  const valor = crypto.createHash('sha1').update(contenido, 'utf8').digest('hex').slice(0, 10);
  cacheSellos.set(rutaAbsoluta, valor);
  return valor;
}

/* Solo href/src locales que terminen en .css o .js. Se ignoran las URLs
   absolutas (fuentes de Google, etc.): esas las versiona su propio CDN. */
const REFERENCIA = /(href|src)="((?!https?:|\/\/|data:)[^"]+?\.(?:css|js))(\?v=[^"]*)?"/g;

let cambiados = 0;
let desactualizados = [];

PAGINAS.forEach(function (pagina) {
  const rutaPagina = path.join(RAIZ, pagina);
  if (!fs.existsSync(rutaPagina)) return;

  const original = fs.readFileSync(rutaPagina, 'utf8');
  const carpeta = path.dirname(rutaPagina);

  const nuevo = original.replace(REFERENCIA, function (completo, atributo, ruta, consulta) {
    const destino = path.resolve(carpeta, ruta);
    if (!fs.existsSync(destino)) {
      console.warn('  aviso: ' + pagina + ' apunta a ' + ruta + ', que no existe');
      return completo;
    }
    const esperado = '?v=' + sello(destino);
    if (consulta !== esperado) desactualizados.push(pagina + ' -> ' + ruta);
    return atributo + '="' + ruta + esperado + '"';
  });

  if (nuevo === original) return;
  cambiados++;
  if (!SOLO_VERIFICAR) fs.writeFileSync(rutaPagina, nuevo, 'utf8');
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
