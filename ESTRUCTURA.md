# Dónde está cada cosa

El código no lleva comentarios. Este archivo es el índice: dice qué hay en
cada archivo y con qué prefijo de clase buscarlo.

Para encontrar algo, lo más rápido casi siempre es buscar la clase por todo
el proyecto (`Ctrl+Mayús+F` en VS Code) — el prefijo dice de qué archivo
sale.

---

## Estilos — `estilos/`

**El número del nombre es el orden de carga, y el orden importa.** En CSS,
cuando dos reglas tienen la misma fuerza gana la última; `16-oro.css` va casi
al final justamente porque tiene que poder pisar a los quince anteriores, y
`17-detalle-lujo.css` va después porque retoca lo que dejaron todos.
Del 01 al 16 los cargan las cinco páginas; el 17, el 18, el 19 y el 21 solo
los cargan Nosotros y Tratamientos, y el 20 solo Nosotros.
Si se añade un archivo nuevo hay que enlazarlo en la posición que le toque
por número.

| Archivo | Qué contiene | Prefijos |
|---|---|---|
| `01-variables.css` | Colores, tipografías, sombras, transiciones. Todo lo que se reutiliza. | `:root`, `--*` |
| `02-base.css` | Etiquetas base, imán de scroll, splash de bienvenida, foco de teclado. | `.splash-inicio` |
| `03-botones.css` | Los botones del sitio. | `.btn-*` |
| `04-navbar.css` | Barra superior de mármol negro (con el filo dorado y el `.navbar-oculta` que la sube al llegar al pie) y menú a pantalla completa. | `.navbar-*`, `.marca-*`, `.menu-panel` |
| `05-hero.css` | Portada: vídeo, carrusel, el marco de «Smilers» y el hero cine. | `.hero-*` |
| `06-secciones.css` | Títulos, párrafos y fondos genéricos de sección. | `.seccion*`, `.titulo-seccion` |
| `07-nosotros.css` | Sección 3 de la portada: collage, texto, pilares y contador. | `.nm-*`, `.nc-*`, `.cl-*`, `.pilar*` |
| `08-especialidades.css` | Tarjetas de especialidades y acordeón de galería. | `.card-especialidad`, `.acordeon-*`, `.ag-*` |
| `09-cierre-cta.css` | Cierre cine y banda final con llamada a la acción. | `.cierre-cine*`, `.banda-cta*` |
| `10-footer.css` | Pie de página, mapas, formulario, redes y los dos botones flotantes (WhatsApp y subir). | `.footer*`, `.mapa-*`, `.redes-sociales`, `.wsp-flotante`, `.btn-subir` |
| `11-animaciones.css` | Apariciones al hacer scroll, cortinas y formas decorativas. | `.revelar`, `.cortina*`, `.forma-*` |
| `12-interiores.css` | Piezas de las subpáginas: banner, equipo, historia, tratamientos, FAQ, comparador. | `.banner-*`, `.bloque-tratamiento*`, `.comparador*` |
| `13-testimonios.css` | La esfera de testimonios, su versión en tarjetas y el fondo de jardín que va detrás de las dos. | `.testimonios-*`, `.tst-*`, `.tc-*` |
| `14-pagina-nosotros.css` | Nació para Nosotros, pero hoy quien usa estas piezas de texto es Tratamientos: portada, ruta, rótulo, entradilla y párrafo. | `.nos-*` |
| `15-lienzo-claro.css` | Las subpáginas sobre fondo claro, y el lienzo de mármol de FAQ (`.lienzo-marmol`: va fijo detrás de todo, así que las secciones de esa página son transparentes a propósito). | `.pagina-clara`, `.pagina-*`, `.lienzo-marmol` |
| `16-oro.css` | **Va el último a propósito.** Reparte el oro de marca sobre todo lo anterior. | — |
| `17-detalle-lujo.css` | El fondo con trama de las dos páginas, la portada negra con la palabra en oro (Tratamientos la usa con la clase `.pagina-cubierta` del `<body>`) y los retoques del comparador antes/después. **Solo lo cargan esas dos páginas.** | `.nos-portada__*`, `.pagina-tratamientos *` |
| `18-piezas-editoriales.css` | **Va después del 17 a propósito.** Las piezas de Tratamientos: el tríptico de tarjetas que se monta sobre la portada, la tarjeta de cita negra y la fila de medallones del proceso. | `.pz-*` |
| `19-guia-marca.css` | La guía de marca aplicada: reescribe los tokens a crema `#FAF8F5`, negro `#0A0A0A` y oro champán `#C5A059`, y de ahí salen los fondos, los bordes finos, las sombras y los estados de hover de las dos páginas. **Aquí se cambia el color de marca, no en el 01, y aquí se cambia el alto de las secciones de Tratamientos, no en el 15 ni en el 17.** | `--gm-*` |
| `20-nosotros-editorial.css` | **Solo `subpaginas/nosotros.html`.** Toda la página: portada asimétrica con marco dorado, collage bento de la historia, bloque negro de misión/visión/objetivos, tarjetas de valores, galería e infraestructura con las dos sedes, y la franja de cifras con el cierre. | `.ns-*` |
| `21-dinamico.css` | **Va el último y lo cargan Nosotros y Tratamientos.** Lo que da movimiento a las dos páginas: el carrusel dorado, las tarjetas de cristal con borde de oro, las secciones de Nosotros con su telón de entrada (`.ns-pantalla__velo`, que se levanta en vez de desvanecerse), la costura de oro que se dibuja sola entre sección y sección, el riel de puntos lateral y el fondo fotográfico de sección (`.ns-fondo`, con las variantes `--jardin`, `--marmol` y `--marmol-claro`). **Aquí se cambia el alto de las secciones de Nosotros.** Aquí se convierten en cristal las fichas del 20 y las tarjetas del 18. | `.crsl-*`, `.ns-pantalla`, `.ns-riel`, `.ns-fondo`, `.pz-panel` |


---

## Dos medidas que se calculan solas

Hay dos números que estaban repetidos a mano en varios sitios y que ahora
salen de una variable. Si se tocan, se tocan una vez:

- `--alto-navbar` (en `01-variables.css`): lo que mide la barra. De ahí sacan
  su hueco el rótulo de Testimonios y las portadas de Nosotros y Tratamientos,
  para que la barra no se les monte encima.
- `--pz-solape` (en `18-piezas-editoriales.css`): lo que el tríptico de
  Tratamientos se sube por encima de su portada. La portada reserva ese mismo
  valor de `padding-bottom`, así que ya no se pueden descuadrar.

---

## Fondos — `imagenes/fondos/`

Texturas a todo ancho que van detrás de una sección, nunca sueltas: siempre
dentro de un `.ns-fondo` (Nosotros) o de un `.testimonios-fondo` (portada),
que es quien pone la veladura para que el texto de encima se siga leyendo.

| Archivo | Dónde se usa |
|---|---|
| `jardin-mosaico.webp` (+ `-720`) | Testimonios de la portada y Fundamentos de Nosotros. |
| `marmol-negro.webp` | Portada de Nosotros. |
| `marmol-negro-barra.webp` | La barra de navegación, en las cinco páginas. Es una tira recortada del mármol negro, de 1920×130, para no cargar la imagen entera por 60px de alto. |
| `marmol-blanco.webp` | Dos sitios: Nuestro equipo, en Nosotros, y la página entera de FAQ. En los dos la sección es clara y el mármol se ve casi entero. |

---

## Scripts — `scripts/`

El orden de las etiquetas `<script>` también importa: `planificador.js`
tiene que ir primero porque los demás lo usan.

| Archivo | Qué hace |
|---|---|
| `planificador.js` | El planificador único de scroll (`SmilersScroll`). Un solo listener para todos los efectos, con las lecturas y las escrituras separadas. |
| `navegacion.js` | Navbar (incluido el repliegue al llegar al pie), menú hamburguesa y botón de volver arriba. |
| `revelados.js` | Apariciones al entrar en pantalla, cortinas, paralaje y escenas de salida. |
| `footer.js` | Contadores, selector de mapa, formulario a WhatsApp y año automático. |
| `subpaginas.js` | Filtros de galería, lightbox, comparador antes/después y acordeón de tratamientos. |
| `secciones.js` | Formas decorativas, acordeón de galería (el de especialidades del inicio y el del equipo en Nosotros), pausa del carrusel y cinta de la banda final. |
| `hero.js` | Carrusel de portada, hero cine, imán de tratamientos, desenfoque, cierre cine y splash. |
| `interiores.js` | El carrusel dorado (`[data-carrusel]`) y las pantallas completas de Nosotros: marca la sección visible y arma el riel de puntos lateral. Solo lo cargan Nosotros y Tratamientos. |
| `testimonios-esfera.js` | La esfera WebGL de testimonios. Solo la carga `index.html`. |
| `sellar-version.js` | Herramienta. Ver `CACHE.md`. |
| `convert-to-webp.js` | Herramienta para convertir imágenes. |

Cada archivo registra su propio `DOMContentLoaded`. Eso además los aísla: si
uno fallara, los demás siguen funcionando.

---

## Antes de commitear

Si tocaste CSS, JS o imágenes:

```bash
node scripts/sellar-version.js
```

Sin eso, quien ya visitó el sitio se queda con la versión vieja. El porqué
está en `CACHE.md`.

---

## Los comentarios que había

Hasta septiembre de 2026 el código llevaba comentarios extensos que
explicaban por qué cada decisión estaba tomada así — qué se probó antes, qué
trampa de cascada había detrás de una regla, por qué un desenfoque tiene el
radio que tiene. Se quitaron todos. Siguen en el historial de git:

```bash
git show 15b5856:estilos/estilos.css
git show 15b5856:scripts/script.js
```
