# Dónde está cada cosa

El código no lleva comentarios. Este archivo es el índice: dice qué hay en
cada archivo y con qué prefijo de clase buscarlo.

Para encontrar algo, lo más rápido casi siempre es buscar la clase por todo
el proyecto (`Ctrl+Mayús+F` en VS Code) — el prefijo dice de qué archivo
sale.

---

## Estilos — `estilos/`

**El número del nombre es el orden de carga, y el orden importa.** En CSS,
cuando dos reglas tienen la misma fuerza gana la última; el `16-oro.css` va
al final justamente porque tiene que poder pisar a los quince anteriores.
Si se añade un archivo nuevo hay que enlazarlo en las cinco páginas, en la
posición que le toque por número.

| Archivo | Qué contiene | Prefijos |
|---|---|---|
| `01-variables.css` | Colores, tipografías, sombras, transiciones. Todo lo que se reutiliza. | `:root`, `--*` |
| `02-base.css` | Etiquetas base, imán de scroll, splash de bienvenida, foco de teclado. | `.splash-inicio` |
| `03-botones.css` | Los botones del sitio. | `.btn-*` |
| `04-navbar.css` | Barra superior y menú a pantalla completa. | `.navbar-*`, `.marca-*`, `.menu-panel` |
| `05-hero.css` | Portada: vídeo, carrusel, el marco de «Smilers» y el hero cine. | `.hero-*` |
| `06-secciones.css` | Títulos, párrafos y fondos genéricos de sección. | `.seccion*`, `.titulo-seccion` |
| `07-nosotros.css` | Sección 3 de la portada: collage, texto, pilares y contador. | `.nm-*`, `.nc-*`, `.cl-*`, `.pilar*` |
| `08-especialidades.css` | Tarjetas de especialidades y acordeón de galería. | `.card-especialidad`, `.acordeon-*`, `.ag-*` |
| `09-cierre-cta.css` | Cierre cine y banda final con llamada a la acción. | `.cierre-cine*`, `.banda-cta*` |
| `10-footer.css` | Pie de página, mapas, formulario, redes y los dos botones flotantes (WhatsApp y subir). | `.footer*`, `.mapa-*`, `.redes-sociales`, `.wsp-flotante`, `.btn-subir` |
| `11-animaciones.css` | Apariciones al hacer scroll, cortinas y formas decorativas. | `.revelar`, `.cortina*`, `.forma-*` |
| `12-interiores.css` | Piezas de las subpáginas: banner, equipo, historia, tratamientos, FAQ, comparador. | `.banner-*`, `.bloque-tratamiento*`, `.comparador*` |
| `13-testimonios.css` | La esfera de testimonios y su versión en tarjetas. | `.testimonios-*`, `.tst-*`, `.tc-*` |
| `14-pagina-nosotros.css` | Solo `subpaginas/nosotros.html`. | `.nos-*` |
| `15-lienzo-claro.css` | Las subpáginas sobre fondo claro. | `.pagina-clara`, `.pagina-*` |
| `16-oro.css` | **Va el último a propósito.** Reparte el oro de marca sobre todo lo anterior. | — |

---

## Scripts — `scripts/`

El orden de las etiquetas `<script>` también importa: `planificador.js`
tiene que ir primero porque los demás lo usan.

| Archivo | Qué hace |
|---|---|
| `planificador.js` | El planificador único de scroll (`SmilersScroll`). Un solo listener para todos los efectos, con las lecturas y las escrituras separadas. |
| `navegacion.js` | Navbar, menú hamburguesa y botón de volver arriba. |
| `revelados.js` | Apariciones al entrar en pantalla, cortinas, paralaje y escenas de salida. |
| `footer.js` | Contadores, selector de mapa, formulario a WhatsApp y año automático. |
| `subpaginas.js` | Filtros de galería, lightbox, comparador antes/después y acordeón de tratamientos. |
| `secciones.js` | Formas decorativas, acordeón de especialidades, pausa del carrusel y cinta de la banda final. |
| `hero.js` | Carrusel de portada, hero cine, imán de tratamientos, desenfoque, cierre cine y splash. |
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
