# Caché del sitio — cómo funciona y qué hacer al publicar

Resumen en una línea: **los HTML nunca se cachean y llevan dentro sus
estilos; todo lo demás se cachea un año y cambia de URL cuando cambia el
archivo.**

---

## Cómo funciona

Son dos piezas que solo funcionan juntas.

### 1. La construcción y el sello — `herramientas/construir.js`

Antes de publicar se corre una sola orden:

```bash
node herramientas/construir.js
```

Hace tres cosas en cada una de las cinco páginas (`index.html`,
`nosotros.html`, `tratamientos.html`, `galeria.html`, `faq.html`):

- **Mete los estilos dentro del HTML.** Junta, en el orden en que los lista
  `<style data-hojas="…">`, las hojas de `estilos/` (y el Bootstrap recortado),
  las minifica y las escribe dentro de esa etiqueta. La página no pide ninguna
  hoja aparte: nada bloquea el primer pintado.
- **Empaqueta los guiones.** Junta los que lista `data-guiones`, los minifica y
  escribe `paquetes/<pagina>.js`, que la página pide con `defer`.
- **Sella cada recurso** con `?v=<primeros 10 del SHA-1 del archivo>`:

```html
<script defer src="paquetes/portada.js?v=5d03e7c848" …></script>
<img src="imagenes/nosotros.webp?v=50efd7060f" srcset="imagenes/nosotros-720.webp?v=726b9e3483 720w, …">
```

Lo importante es la doble garantía:

- Si el archivo **cambia**, el hash cambia → la URL cambia → es una URL que
  el navegador no ha visto nunca → **no puede** servirla de caché. El cambio
  llega sí o sí, en la primera carga.
- Si el archivo **no cambia**, el hash es idéntico → la URL es idéntica →
  el navegador reutiliza lo que ya tiene, sin pedir nada.

El sello cubre `href`, `src`, `srcset`, `imagesrcset`, `data-fotos`,
`data-antes`, `data-despues`, los `data-src-*` del vídeo del splash, **y las
`url()` de las hojas de estilo** (las tipografías, por ejemplo), que ahora
pasan por la construcción. Es decir: guiones, imágenes, vídeo y tipografías.

### 2. Las cabeceras — `vercel.json`

```
/paquetes, /fuentes, /imagenes, /video-hero
    → public, max-age=31536000, immutable      (un año, sin revalidar)

todo lo demás (los HTML)
    → public, max-age=0, must-revalidate       (siempre se comprueba)
```

`immutable` es seguro **precisamente porque** la pieza 1 garantiza que una
URL nunca cambia de contenido. Y los HTML se revalidan siempre porque son
la puerta de entrada: traen dentro los estilos y las URLs nuevas con los
hashes nuevos. Si un HTML no ha cambiado, el servidor contesta «sigue igual»
(304) y no se vuelve a descargar.

`estilos/`, `scripts/`, `herramientas/` y `vendor/` **no se publican**
(`.vercelignore`): son el código fuente. Las páginas solo piden lo que
genera la construcción.

---

## Qué tienes que hacer al publicar

Una sola cosa, siempre, antes de commitear cualquier cambio en `estilos/`,
`scripts/`, `imagenes/`, `fuentes/`, `video-hero/` o en el HTML:

```bash
node herramientas/construir.js
```

Y si quieres comprobar sin escribir nada (útil en CI o en un hook):

```bash
node herramientas/construir.js --verificar   # sale con código 1 si falta algo
```

**Ojo, esto es más serio que antes.** Antes, olvidar el sello solo afectaba a
quien ya había visitado el sitio. Ahora las páginas usan lo que genera la
construcción: un cambio en `estilos/` o en `scripts/` **no se ve en ninguna
parte** hasta que se construye.

---

## Reglas para cuando añadas cosas nuevas

1. **Una hoja o un guion nuevo** → añádelo a la lista de `data-hojas` o de
   `data-guiones` de la página que lo use, en la posición que le toque (el
   orden de la lista es el de la cascada o el de ejecución), y construye.
2. **Una foto nueva** → referénciala desde el HTML (o desde una hoja con
   `url()`) y construye. Ya está.
3. **Nunca escribas una URL de imagen dentro de un `.js`.** La construcción
   sella el HTML y las hojas, no las cadenas del JavaScript: una URL escrita
   en el JS se queda sin `?v=` y vuelve el problema de la foto congelada un
   año. Si el JS necesita una lista de imágenes, pásasela por un atributo
   `data-` del HTML — así se hace con la cinta del CTA (`data-fotos`) y con
   las fotos de la esfera de testimonios (`data-antes` / `data-despues`).
4. **No renombres archivos para "forzar" una actualización.** El sello lo
   hace solo.

---

## Sobre instalar una caché de terceros

No hace falta y sería contraproducente:

- **El CDN ya está.** Vercel sirve el sitio desde su red de borde y purga
  esa caché en cada despliegue. Un CDN encima de un CDN solo añade una capa
  más donde algo puede quedarse viejo.
- **Un Service Worker sería un paso atrás aquí.** Es la forma habitual de
  "caché de terceros" en un sitio estático (Workbox y similares) y sirve
  sobre todo para funcionar sin conexión. Pero mete una caché que vive en el
  dispositivo del visitante y que ya no controlas desde el servidor: si se
  configura mal —que es lo normal— el visitante se queda con una versión
  antigua incluso después de recargar, y hace falta que el propio Service
  Worker se actualice para arreglarlo. Es exactamente el síntoma del que
  venimos huyendo, pero peor, porque ni siquiera un Ctrl+F5 lo resuelve.

Con hash por contenido + `immutable`, un visitante recurrente ya no descarga
nada que no haya cambiado. Ese es el techo de lo que una caché puede dar; un
Service Worker no mejora eso, solo añade riesgo.

---

## Cómo comprobar que quedó bien, ya desplegado

```bash
# Un paquete: debe decir "max-age=31536000, immutable"
curl -sI "https://smilersdental.vercel.app/paquetes/portada.js" | grep -i cache-control

# La portada: debe decir "max-age=0, must-revalidate"
curl -sI https://smilersdental.vercel.app/ | grep -i cache-control

# Las direcciones viejas redirigen a las nuevas (308)
curl -sI https://smilersdental.vercel.app/subpaginas/nosotros | grep -i -E "^(HTTP|location)"
```
