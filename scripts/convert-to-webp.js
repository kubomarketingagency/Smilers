#!/usr/bin/env node
/**
 * Conversion masiva JPG/PNG -> WebP.
 *
 * Uso:
 *   npm install --no-save sharp
 *   node scripts/convert-to-webp.js
 *
 * Recorre INPUT_DIR, y por cada .jpg/.jpeg/.png genera un .webp
 * al lado del original (el original NO se borra: sirve de fallback
 * para navegadores muy viejos que no soportan WebP).
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT_DIRS = ['imagenes'];
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const WEBP_QUALITY = 82; // 80-85 = visualmente sin perdida perceptible, buen ratio de compresion

async function convertirArchivo(rutaAbsoluta) {
  const { dir, name } = path.parse(rutaAbsoluta);
  const destino = path.join(dir, `${name}.webp`);

  if (fs.existsSync(destino)) {
    const [origen, existente] = [fs.statSync(rutaAbsoluta), fs.statSync(destino)];
    if (existente.mtimeMs >= origen.mtimeMs) {
      console.log(`  = ${path.relative(process.cwd(), destino)} (ya actualizado, se omite)`);
      return { skipped: true };
    }
  }

  const antes = fs.statSync(rutaAbsoluta).size;
  await sharp(rutaAbsoluta)
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(destino);
  const despues = fs.statSync(destino).size;
  const ahorro = (100 - (despues / antes) * 100).toFixed(1);

  console.log(
    `  + ${path.relative(process.cwd(), destino)}  ` +
    `(${(antes / 1024).toFixed(0)}KB -> ${(despues / 1024).toFixed(0)}KB, -${ahorro}%)`
  );
  return { skipped: false, antes, despues };
}

async function main() {
  let totalAntes = 0;
  let totalDespues = 0;
  let convertidos = 0;
  let omitidos = 0;

  for (const dirRelativo of INPUT_DIRS) {
    const dirAbsoluto = path.resolve(process.cwd(), dirRelativo);
    if (!fs.existsSync(dirAbsoluto)) {
      console.warn(`Aviso: no existe la carpeta "${dirRelativo}", se omite.`);
      continue;
    }

    console.log(`\nProcesando "${dirRelativo}"...`);
    const archivos = fs.readdirSync(dirAbsoluto);

    for (const archivo of archivos) {
      const ext = path.extname(archivo).toLowerCase();
      if (!EXTENSIONS.has(ext)) continue;

      const rutaAbsoluta = path.join(dirAbsoluto, archivo);
      const resultado = await convertirArchivo(rutaAbsoluta);

      if (resultado.skipped) {
        omitidos++;
      } else {
        convertidos++;
        totalAntes += resultado.antes;
        totalDespues += resultado.despues;
      }
    }
  }

  console.log('\n---');
  console.log(`Convertidos: ${convertidos}  |  Omitidos (sin cambios): ${omitidos}`);
  if (convertidos > 0) {
    const ahorroTotal = (100 - (totalDespues / totalAntes) * 100).toFixed(1);
    console.log(
      `Peso total: ${(totalAntes / 1024).toFixed(0)}KB -> ${(totalDespues / 1024).toFixed(0)}KB ` +
      `(ahorro de ${ahorroTotal}%)`
    );
  }
}

main().catch((error) => {
  console.error('Error durante la conversion:', error);
  process.exit(1);
});
