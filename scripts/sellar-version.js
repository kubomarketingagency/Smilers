#!/usr/bin/env node
/* ==========================================================================
   SELLADO DE VERSIÓN DE LOS ASSETS
   --------------------------------------------------------------------------
   Reescribe el "?v=..." de cada referencia local de los HTML con los
   primeros 10 caracteres del SHA-1 del archivo al que apunta.

   POR QUÉ EXISTE
   El "?v=38" a mano funciona solo si uno se acuerda de subirlo, y basta
   olvidarlo una vez para que quien ya visitó el sitio se quede viendo el
   CSS viejo — que es justo lo que pasó. Con el sello por contenido la URL
   cambia sola en cuanto el archivo cambia, y NO cambia si el archivo no
   cambió (así el navegador reaprovecha lo que ya tiene).

   QUÉ SE SELLA (y por qué se amplió)
   Antes solo se sellaban .css y .js. Las imágenes y los vídeos quedaban con
   URL fija y en vercel.json estaban marcados "immutable" a un año: o sea
   que si se reemplazaba una foto por otra con el mismo nombre, quien ya
   había visitado el sitio seguía viendo la ANTIGUA durante un año, sin
   forma de forzar la actualización salvo renombrar el archivo. Ahora se
   sellan también imágenes, vídeos y tipografías, en todos los atributos por
   los que el HTML puede pedirlas:

     href / src                 <link>, <script>, <img>, <video>
     srcset / imagesrcset       <img>, <source>, <link rel=preload>
     data-src-escritorio        el vídeo del splash, que elige index.html
     data-src-movil             (misma idea)
     data-antes / data-despues  las fotos de la esfera de testimonios, que
                                carga testimonios-esfera.js

   Con eso, TODO lo que la página pide lleva el hash de su contenido en la
   URL, y por tanto todo puede ir "immutable" en el CDN sin riesgo de que
   un cambio no llegue: cambiar el archivo cambia la URL, y una URL nueva
   nunca puede venir de la caché. Es el par que hace que la regla de
   vercel.json sea correcta — ver el comentario de ese archivo.

   LO QUE NO SE SELLA
   · Los .html: son el punto de entrada y se sirven siempre revalidando
     (max-age=0, must-revalidate), así que no necesitan sello y ponérselo
     rompería las URL que la gente comparte.
   · URLs absolutas (Google Fonts, etc.): las versiona su propio CDN.
   · data: URIs (el favicon en línea, las texturas SVG del CSS).

   USO
     node scripts/sellar-version.js
     node scripts/sellar-version.js --verificar
        (no escribe; sale con código 1 si algún sello está desactualizado,
         para engancharlo en CI o en un hook de pre-commit)
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

/* Extensiones que llevan sello. Deliberadamente NO incluye .html. */
const SELLABLES = /\.(css|js|mjs|webp|avif|png|jpe?g|gif|svg|ico|mp4|webm|woff2?)$/i;

const cacheSellos = new Map();

/* Se normalizan los finales de línea ANTES de calcular el hash de un archivo
   de texto. En Windows git suele estar con core.autocrlf, así que el mismo
   archivo es CRLF en la copia de trabajo y LF en el repositorio (que es lo
   que acaba desplegado): sin normalizar, el sello calculado en local no
   coincide con el del archivo servido y cambiaría de un checkout a otro sin
   que el contenido cambie. Los binarios (imágenes, vídeo, fuentes) se
   hashean tal cual: ahí un 0x0D0A es un byte de datos, no un salto de
   línea, y "normalizarlo" corrompería el hash. */
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

/* Sella UNA url. Devuelve la url ya sellada (o la original si no aplica).
   `carpeta` es la del HTML que la referencia, para resolver rutas relativas. */
function sellarUrl(url, carpeta, pagina) {
  const limpia = url.trim();
  if (!limpia) return url;
  // Absolutas, protocol-relative, data:, anclas y mailto/tel: no se tocan.
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

/* href/src y los data-* que llevan UNA sola url: el vídeo del splash y las
   dos fotos de cada testimonio. */
const ATRIBUTO_SIMPLE = /\b(href|src|data-src-escritorio|data-src-movil|data-antes|data-despues)="([^"]*)"/g;

/* srcset/imagesrcset: lista separada por comas, cada entrada "url [descriptor]".
   El descriptor (480w, 2x...) se conserva tal cual. */
/* data-fotos es la cinta del CTA (ver index.html): mismo formato de lista,
   sin descriptores. Vive en el HTML y no dentro de script.js precisamente
   para que el sello la alcance. */
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

  /* Los comentarios HTML se dejan intactos: dentro de uno puede haber
     marcado de ejemplo, con rutas que no existen en el repo. Sin esta
     pasada el script avisaría de archivos inexistentes en cada corrida y,
     peor, sellaría código que nadie está usando. Se trocea el archivo por
     comentarios y solo se transforman los tramos de marcado real. */
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
