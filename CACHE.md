# Caché del sitio — cómo funciona y qué hacer al publicar

Resumen en una línea: **los HTML nunca se cachean, todo lo demás se cachea
un año y se le cambia la URL cuando cambia el archivo.**

---

## El problema que había

La configuración anterior estaba justo al revés de como debe ir:

| Tipo de archivo | Antes | Consecuencia |
|---|---|---|
| `estilos/*.css`, `scripts/*.js` | `max-age=0, must-revalidate` | Llevaban `?v=hash` en la URL — o sea que ya eran seguros de cachear — y aun así el navegador pedía permiso al servidor **en cada carga de cada página**. Un viaje de ida y vuelta por archivo, por visita, para nada. |
| `imagenes/*`, `video-hero/*` | `immutable` a 1 año | Estas **no** llevaban hash. Reemplazar una foto por otra con el mismo nombre no llegaba a quien ya había visitado el sitio: se quedaba con la vieja hasta un año, sin forma de forzarlo salvo renombrar el archivo. |

Es decir: se revalidaba lo que no hacía falta revalidar, y se congelaba lo
que sí podía cambiar. De ahí la sensación de que la caché estaba
desordenada y de que los cambios "a veces no se ven".

---

## Cómo funciona ahora

Son dos piezas que solo funcionan juntas.

### 1. El sello por contenido — `scripts/sellar-version.js`

Recorre los cinco HTML del sitio y le pone a cada recurso local un
`?v=<primeros 10 del SHA-1 del archivo>`:

```html
<link rel="stylesheet" href="estilos/04-navbar.css?v=10f475c1e6">
<img src="imagenes/nosotros.webp?v=7dadb1fd33" srcset="imagenes/nosotros-720.webp?v=1a077e1d09 720w, ...">
```

Lo importante es la doble garantía:

- Si el archivo **cambia**, el hash cambia → la URL cambia → es una URL que
  el navegador no ha visto nunca → **no puede** servirla de caché. El cambio
  llega sí o sí, en la primera carga.
- Si el archivo **no cambia**, el hash es idéntico → la URL es idéntica →
  el navegador reutiliza lo que ya tiene, sin pedir nada.

Cubre `href`, `src`, `srcset`, `imagesrcset`, `data-fotos` y los
`data-src-*` del vídeo del splash. Es decir: CSS, JS, imágenes, vídeo y
tipografías locales.

### 2. Las cabeceras — `vercel.json`

```
/estilos, /scripts, /vendor, /imagenes, /video-hero
    → public, max-age=31536000, immutable      (un año, sin revalidar)

todo lo demás (los HTML)
    → public, max-age=0, must-revalidate       (siempre se comprueba)
```

`immutable` es seguro **precisamente porque** la pieza 1 garantiza que una
URL nunca cambia de contenido. Y los HTML se revalidan siempre porque son
la puerta de entrada: son quienes traen las URLs nuevas con los hashes
nuevos.

---

## Qué tienes que hacer al publicar

Una sola cosa, siempre, antes de commitear:

```bash
node scripts/sellar-version.js
```

Y si quieres comprobar sin escribir nada (útil en CI o en un hook):

```bash
node scripts/sellar-version.js --verificar   # sale con código 1 si falta algo
```

Si se te olvida, el efecto es el de siempre: quien ya visitó el sitio se
queda con la versión anterior de lo que hayas tocado.

---

## Reglas para cuando añadas cosas nuevas

1. **Una foto o un script nuevo** → referéncialo desde el HTML y corre el
   sello. Ya está.
2. **Nunca escribas una URL de imagen dentro de un `.js`.** El sello recorre
   los HTML, no el JavaScript: una URL escrita en el JS se queda sin `?v=` y
   vuelve el problema de la foto congelada un año. Si el JS necesita una
   lista de imágenes, pásasela por un atributo `data-` del HTML — así se
   hace ya con la cinta del CTA (`data-fotos` en `index.html`).
3. **No renombres archivos para "forzar" una actualización.** El sello lo
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
# Un asset: debe decir "max-age=31536000, immutable"
curl -sI https://TU-DOMINIO/estilos/01-variables.css | grep -i cache-control

# La portada: debe decir "max-age=0, must-revalidate"
curl -sI https://TU-DOMINIO/ | grep -i cache-control
```
