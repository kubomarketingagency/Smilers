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
Del 01 al 16, el 22 y el 23 los cargan las cinco páginas; el 17, el 18,
el 19, el 20 y el 21 solo los cargan Nosotros y Tratamientos.
Si se añade un archivo nuevo hay que enlazarlo en la posición que le toque
por número.

| Archivo | Qué contiene | Prefijos |
|---|---|---|
| `01-variables.css` | Colores, tipografías, sombras, transiciones. Todo lo que se reutiliza. | `:root`, `--*` |
| `02-base.css` | Etiquetas base, imán de scroll, splash de bienvenida, foco de teclado. | `.splash-inicio` |
| `03-botones.css` | La forma de los botones y sus dos adornos: el destello de oro que cruza al pasar el ratón y el filo interior. **El color no se decide aquí**: el 16 los iguala a todos. Las variantes viejas (`.btn-naranja`, `.btn-turquesa`, `.btn-blanco`, `.btn-contorno`, `.btn-fantasma`, `.btn-traslucido`, `.btn-sm-nav`) y el tamaño `.btn-lg` **ya no existen**: se borraron de aquí y del HTML, porque mientras estuvieran bastaba con que una de ellas trajese un `border:` o un `:hover` con más peso para volver a partir el conjunto. | `.btn` |
| `04-navbar.css` | Barra superior de mármol negro (con el filo dorado y el `.navbar-oculta` que la sube al llegar al pie) y el menú que se despliega: un panel que entra por la derecha (`.menu-panel`) sobre un velo desenfocado (`.menu-velo`). En pantallas pequeñas lleva solo las cinco secciones; a partir de 992px se abre a lo ancho y reparte esas cinco en columnas (`.menu-columnas`), cada una con su contenido debajo (`.menu-sub`). | `.navbar-*`, `.marca-*`, `.menu-panel`, `.menu-col*`, `.menu-sub` |
| `05-hero.css` | Portada: vídeo, carrusel, el marco de «Smilers» y el hero cine. | `.hero-*` |
| `06-secciones.css` | Títulos, párrafos y fondos genéricos de sección. | `.seccion*`, `.titulo-seccion` |
| `07-nosotros.css` | Sección «Quiénes somos» de la portada, que son **tres pantallas seguidas**: collage + texto, la pantalla negra, y el segundo collage + texto. Los dos collages (`.nosotros-media`) van a media página de ancho y página entera de alto, **sin separación entre fotos**: el filo de oro sale del `gap` de 1px sobre el fondo dorado de la rejilla, no de un borde por figura —así todas las líneas miden lo mismo—, y una `mask-image` apaga el canto que da al centro para que la foto se funda con el mármol en vez de tocarlo. Por eso la figura ya no se desvanece al entrar (`opacity: 1`): con la figura transparente lo que asomaba por debajo era el oro del fondo, y media página se encendía entera. **Los tres bloques son una sola escena** (`.pn-escena`), que no se dispara con el reloj sino con el scroll: un envoltorio de 360vh con un `position: sticky` dentro (`.pn-pin`) que se queda clavado a pantalla completa, y `revelados.js` convierte el recorrido en un progreso de 0 a 1. Con él: se ve el primer collage (0→.05), el telón cruza de izquierda a derecha tapándolo (.05→.32), salen los pilares y el contador (.34→.46), se sostiene (.46→.70) y el telón se retira por la izquierda descubriendo Instalaciones (.70→.97). **Los dos collages viven dentro del pin** —`.pn-fondo--uno` y `.pn-fondo--dos`— y el cambiazo se da en el punto medio, con el negro tapando la pantalla entera, que es lo que hace que la secuencia se lea como toca. Si el segundo se deja puesto desde el principio se ve antes de que entre el negro y se destripa la transición. Dentro de la escena los dos collages van **dibujados desde el principio**, sin revelado por scroll: mientras el segundo espera a opacidad 0 el observador no lo da por visible —se midió: 13 de 26 `.revelar` se quedaban apagados, justo los de dentro— y al abrirse el telón aparecía la piedra en blanco; aquí no se pierde nada porque quien presenta las dos pantallas es el barrido. El filo dorado que viaja con el canto (`.pn-filo`) va fuera del telón porque dentro se lo comería su propio recorte. **Sin la clase `.pn-escena--viva` no hay nada de esto**: los tres bloques se quedan apilados en flujo normal y en ese orden, que es lo que se ve en móvil, sin JS o con `prefers-reduced-motion`. Dos trampas dentro: **`.seccion-decorada` le pone `overflow: hidden` a la sección y eso convierte la sección en contenedor de scroll, con lo que el `sticky` deja de pegarse a nada** —de ahí `.seccion-decorada.seccion-nosotros { overflow: clip }`, que recorta igual pero no crea contenedor, escrito con las dos clases porque el 11 se carga después—; y el `bottom` del sello se reescribe **después** de `.nm-sello`, no arriba con el collage, porque las dos reglas pesan (0,1,0) y gana la última — ese sello se sube porque el observador de `revelados.js` recorta su marco un 8% por abajo y, con el collage midiendo la pantalla entera, caía justo en esa franja muerta y no se encendía nunca. | `.nm-*`, `.nc-*`, `.cl-*`, `.pilar*`, `.pn-*` |
| `08-especialidades.css` | Tarjetas de especialidades y acordeón de galería. | `.card-especialidad`, `.acordeon-*`, `.ag-*` |
| `09-cierre-cta.css` | Cierre cine y banda final con llamada a la acción. | `.cierre-cine*`, `.banda-cta*` |
| `10-footer.css` | Pie de página, mapas, formulario, redes y los dos botones flotantes (WhatsApp y subir). | `.footer*`, `.mapa-*`, `.redes-sociales`, `.wsp-flotante`, `.btn-subir` |
| `11-animaciones.css` | Apariciones al hacer scroll, cortinas y formas decorativas. | `.revelar`, `.cortina*`, `.forma-*` |
| `12-interiores.css` | Piezas de las subpáginas: banner, equipo, historia, tratamientos, FAQ, comparador y el visor de la galería (`#modalLightbox`, que respeta el tamaño real de la foto y le pone marco cuando se queda corta). | `.banner-*`, `.bloque-tratamiento*`, `.comparador*`, `.lightbox-marco` |
| `13-testimonios.css` | La esfera de testimonios, su versión en tarjetas y el fondo de jardín que va detrás de las dos. | `.testimonios-*`, `.tst-*`, `.tc-*` |
| `14-pagina-nosotros.css` | Nació para Nosotros, pero hoy quien usa estas piezas de texto es Tratamientos: portada, ruta, rótulo, entradilla y párrafo. | `.nos-*` |
| `15-lienzo-claro.css` | Las subpáginas sobre fondo claro y el mármol que llevan debajo: `.lienzo-marmol` va fijo detrás de toda la página, `.seccion-marmol` detrás de una sola sección. **Las secciones claras no pintan fondo a propósito; si se les devuelve un color, se tapa la piedra.** Aquí vive también la rejilla de la Galería: **cuatro columnas** de `grid` (dos entre 768 y 991, y las dos de Bootstrap por debajo). Era una mampostería de `columns` con las fotos de siete alturas distintas, y con trece fotos el repartidor de Chrome las dejaba 4/4/4/1, con un hueco del tamaño de una columna a la derecha; en rejilla las filas se llenan siempre, y para que cuadren todas las fotos van al mismo cuadrado —que es el formato nativo de los archivos, así que no se recorta nada—. Ojo: las clases `col-*` del HTML hay que anularlas, porque dentro de una rejilla su `width` mide sobre la celda y encogería cada foto a un cuarto de su hueco. | `.pagina-clara`, `.pagina-*`, `.lienzo-marmol`, `.seccion-marmol` |
| `16-oro.css` | Reparte el oro de marca sobre todo lo anterior, y es donde **todos** los botones se vuelven el mismo botón de oro, el único que hay: filo de oro, letras de oro y, al pasar por encima, el degradado entero de fondo con las letras en negro. Su oro sale de `--oro-marca`, no de `--gold-500`. **El filo dorado es un `border-image`, así que cualquier regla posterior que use el atajo `border:` lo borra** — es lo que pasaba con `.pagina-clara .btn` en el 15 y con `.footer .btn` en el 10, que dejaban el filo negro y blanco en vez de oro. Si un botón sale sin oro, se busca por ahí. Y el mismo cuidado con el color de las letras: `.footer .btn` y `.btn:hover` pesan igual (0,2,0), así que **el hover tiene que ir escrito después** o las letras se quedan doradas sobre el relleno dorado. | — |
| `17-detalle-lujo.css` | El fondo con trama de las dos páginas, la portada negra con la palabra en oro (Tratamientos la usa con la clase `.pagina-cubierta` del `<body>`) y los retoques del comparador antes/después. **Solo lo cargan esas dos páginas.** | `.nos-portada__*`, `.pagina-tratamientos *` |
| `18-piezas-editoriales.css` | **Va después del 17 a propósito.** Las piezas de Tratamientos: el tríptico de tarjetas que se monta sobre la portada, la tarjeta de cita negra y la fila de medallones del proceso. | `.pz-*` |
| `19-guia-marca.css` | La guía de marca aplicada: reescribe los tokens a crema `#FAF8F5` y negro `#0A0A0A` —el oro sale del 01, que es donde vive el único de la marca—, y de ahí salen los fondos, los bordes finos, las sombras y los estados de hover de las dos páginas. **Aquí se cambia el color de marca, no en el 01, y aquí se cambia el alto de las secciones de Tratamientos, no en el 15 ni en el 17.** | `--gm-*` |
| `20-nosotros-editorial.css` | **Lo cargan Nosotros y Tratamientos**: es el kit editorial (rótulos, titulares, párrafos, fichas). Las dos portadas son la misma pieza `.ns-portada`, solo cambia la palabra. | `.ns-portada*`, `.ns-titulo`, `.ns-rotulo` |
| `21-dinamico.css` | **Va el último y lo cargan Nosotros y Tratamientos.** Lo que da movimiento a las dos páginas: el carrusel dorado, las tarjetas de piedra (que al pasar el ratón solo crecen un pelo y hunden la sombra: el oro vive en sus títulos, no en el hover), las secciones de Nosotros con su telón de entrada (`.ns-pantalla__velo`, que se levanta en vez de desvanecerse), la costura de oro que se dibuja sola entre sección y sección, el riel de puntos lateral, la portada (`.ns-portada__cinta`: el carrusel de fondo a todo el ancho y todo el alto del hero, que mide un tercio de la pantalla; las tomas no se funden en el sitio sino que entran por la derecha y salen por la izquierda —de ahí la clase `crsl__toma--saliente` que pone `interiores.js`—, que llega a media pantalla, con la palabra encima —peso 400 a propósito, porque es un `h1` y heredaría la negrita; y el bloque **centrado a ojo, no por caja**: son mayúsculas sin bajos, así que la tinta cae en la mitad alta de su línea y el relleno de abajo va más corto para compensar— y la ruta con filo dorado debajo, y nada más; cada toma dice por dónde quiere que la recorten con `data-encuadre`), las dos paradas de scroll de Nosotros —la de Fundamentos y Valores, que van juntos en una sola sección (`.ns-doble`, donde todo se aprieta para que las dos mitades quepan de una vez, ), y la de Equipo—, el sello de marca de Tratamientos (`.ns-sello`: el logo de verdad **sin placa**, apoyado directamente sobre la piedra, en el hueco a la derecha del párrafo de «Todo bajo un mismo techo»), el cierre de esa página (`.pz-proceso`, que repite la parada de «En cifras» pero **al revés por abajo**: la foto entra por arriba, se ve entera en el centro y se apaga antes de llegar al borde. La máscara de «En cifras» llega al 100% a plena opacidad, y como debajo de esta empieza la banda verde de la pregunta, la foto se cortaba en seco justo en la juntura; ahora la sección acaba en la misma piedra en la que empieza) y la cinta (`.cinta-trat`: línea recta de texto en **plata** sobre negro, ceñida a las letras, con la lista repetida dos veces para que el bucle no tenga costura), que sale **dos veces** —debajo del sello y al cerrar los nueve tratamientos, la segunda con `aria-hidden` porque solo repite lo ya dicho—, la piedra de las tarjetas (`.tarjeta-piedra`, que va debajo y por eso todo lo demás de la tarjeta sube a `z-index: 1`; **sin lavado de oro encima: sobre el mármol negro se veía como una mancha**. Las de valores ya no la llevan: sobre el jardín de Fundamentos van en negro con opacidad, para que la hoja se siga viendo por debajo), la ficha del especialista (`.ns-ficha`, que rellena `scripts/secciones.js` con los `data-esp-*` de cada retrato y se despliega **a la derecha** de los retratos dentro de `.ns-equipo__reparto`: elegir a alguien no abre su foto, cambia la ficha), el orden de los bloques de Tratamientos en móvil (la tarjeta de información sube por delante de la foto con un `:has()`) y el fondo fotográfico de sección (`.ns-fondo`, con las variantes `--jardin`, `--marmol` y `--degradado` —la de En cifras, que emerge del mármol: la máscara la borra arriba y la va dejando ver hacia abajo, con un lavado claro encima para que el texto siga siendo oscuro. Esa sección es clara, no negra: por eso lleva `.ns-cifras-sec`, que baja la tinta de los contadores y mete la pregunta y el botón del cierre en una tarjeta negra con opacidad y filo de oro, porque sueltos sobre la foto se perdían—; las secciones claras ya no llevan fondo propio, lo pone el lienzo del 15). **Aquí se cambia el alto de las secciones de Nosotros.** Aquí se visten de piedra las fichas del 20 y las tarjetas del 18. | `.crsl-*`, `.ns-pantalla`, `.ns-riel`, `.ns-fondo`, `.pz-panel` |
| `22-oro-unico.css` | **La cargan las cinco páginas.** Un solo oro en todo el sitio: le pone a toda la tipografía dorada el mismo degradado recortado que lleva «Smilers» en la barra. Dos trampas documentadas dentro: `background-clip: text` recorta *todas* las capas de fondo (por eso los iconos con círculo y los botones se quedan fuera, en oro plano), y `-webkit-text-fill-color` se hereda pero el fondo no (por eso un `<span>` dentro de un texto recortado se queda invisible si no se le pasa el degradado). Sobre mármol claro entra el mismo efecto con `--gradiente-oro-hondo`. | `--oro-vivo-degradado` |
| `23-cierres.css` | **Va la última y la cargan las cinco páginas.** El cierre de las páginas interiores, uno solo: la pregunta final sobre el jardín, dentro de un recuadro negro con filo de oro (`.banda-cta--jardin` + `.banda-cta__vidrio`). Nació en Tratamientos y hoy es la misma pieza en Galería y en FAQ. **Va después del 15 a propósito**, y con las dos clases (`.banda-cta.banda-cta--jardin`) también a propósito: el 15 le pone `background: transparent` a `.pagina-galeria .banda-cta` y a `.pagina-tratamientos .banda-cta`, y esos selectores pesan más que `.banda-cta--jardin` a secas — con una sola clase se veía el mármol blanco del lienzo en lugar del jardín. | `.banda-cta--jardin`, `.banda-cta__vidrio` |


---

## El desenfoque: dos en todo el sitio

Solo la tarjeta del titular de la portada (`.hero-titulo`, en `05-hero.css`)
y el velo del menú (`.menu-velo`, en `04-navbar.css`)
llevan `backdrop-filter`. Todo lo demás que antes era cristal esmerilado
—el menú, la banda del comparador, el chip de testimonios, la tarjeta
flotante, el globo del riel, las flechas del carrusel, la cita y el cierre
de Tratamientos— es ahora negro con opacidad. Si hace falta un panel
translúcido nuevo, se resuelve con opacidad, no con desenfoque.

---

## El oro

Uno solo, y vive en `01-variables.css`: **`--gold-500: #D4AF37`**, el oro
del logo. De ahí salen el resto de escalones (`--gold-100` para el brillo,
`--gold-700` para la sombra) y los tres degradados:

| Token | Dónde va |
|---|---|
| `--gradiente-oro` | El oro vivo, el de «Smilers» en la barra. Sobre negro. |
| `--gradiente-oro-hondo` | El mismo oro, con el tramo claro bajado. Sobre mármol claro, donde el vivo se lava. Lo enchufa el 22 con `--oro-vivo-degradado`. |
| `--gradiente-oro-profundo` | Variante intermedia, para fondos y filos. |

Si hay que cambiar el oro se cambia ahí y en ningún otro sitio: ni el 19 ni
el 15 vuelven a declararlo. La única pieza que a propósito **no** es de oro
es la cinta de Tratamientos (`.cinta-trat`), que va en plata.

**Los botones tienen su propio oro, y es a propósito.** `--gold-500` y
`--gradiente-oro` cambian de tono según la piedra que tengan debajo —sobre
mármol claro bajan a `#B8942A`, que es el que aguanta ahí—, y eso servía
para la tipografía pero hacía que no hubiera dos botones iguales en el
sitio. Por eso `01-variables.css` declara además **`--oro-marca: #D4AF37`**
y **`--oro-marca-degradado`**, escritos en hexadecimal y sin que ningún
contexto los vuelva a definir. Son los que usan `.btn` (en el 16) y
`.ns-boton` (en el 20), que son el mismo botón escrito dos veces.

**El mármol no lleva oro encima.** Ni el negro de la barra
(`.navbar-marmol`), ni el blanco de la sección 3 de la portada
(`.seccion-marmol`), ni el de las tarjetas (`.tarjeta-piedra`): el lavado
dorado que llevaban se veía como una mancha sobre la piedra. El oro de esas
piezas vive en sus filos y en su tipografía, no en el fondo.

---

## Los botones y lo que dicen por WhatsApp

Hay **un solo botón** en todo el sitio (`.btn`, más `.ns-boton`, que es el
mismo escrito a mano en el 20): filo de oro, letras de oro y, al pasar por
encima, el degradado entero de fondo con las letras en negro. Ni variantes de
color ni de tamaño. Si aparece uno distinto, es que alguna hoja anterior le
está ganando por peso —el `border:` que borra el `border-image`, o un `:hover`
de contexto que pesa (0,3,0)—; se busca ahí, no en el 16.

**Y si un botón se rellena de oro pero deja de leerse, es siempre lo mismo:**
el color de reposo lo está pisando el del hover. `.ns-cifras-sec .ns-boton`
(en el 21) y `.ns-boton:hover` (en el 20) pesan igual —(0,2,0)— y el 21 va
después, así que las letras se quedaban doradas sobre el relleno dorado. La
cura es escribir el hover otra vez en la hoja de más abajo, y dentro del
mismo `@media (hover: hover)`. Pasó con el botón del pie y volvió a pasar con
el de «En cifras».

Casi todos abren WhatsApp al número `593997556002` con el mensaje ya escrito,
y **todos dicen de dónde viene quien escribe**:

| Botón | Lo que llega al chat |
|---|---|
| Los generales (banda de cierre, icono flotante, redes del pie) | «Hola, les escribo desde su página web. Me gustaría más información o agendar una cita dental.» |
| «Agendar valoración», uno por tratamiento | «…desde su página web. Me gustaría más información sobre **Ortodoncia**.» — el nombre sale del bloque en el que está el botón |
| «Agenda tu visita», en Galería | «…desde su página web. Vi la galería y me gustaría agendar una visita a la clínica.» |
| El formulario del pie | Lo arma `scripts/footer.js` con el nombre y el mensaje que se escriban, y añade la línea de la página web |

Los mensajes van en el `href`, con el texto codificado (`%20`, `%C3%A1`…) y el
`&` escrito `&amp;`. Si se cambia el número de teléfono hay que cambiarlo en
las cinco páginas **y** en `NUMERO_WHATSAPP` de `scripts/footer.js`.

---

## La medida que se calcula sola

- `--alto-navbar` (en `01-variables.css`): lo que mide la barra. De ahí sacan
  su hueco el rótulo de Testimonios y las portadas de Nosotros y Tratamientos,
  para que la barra no se les monte encima. Si se toca, se toca una vez.

El tríptico de Tratamientos ya no se sube sobre la portada: va en su sitio,
separado por su propio margen.

---

## El logo

No habia archivo de logo: el unico sitio donde estaba era dentro del video
de arranque (`video-hero/SmilersCompu-720.mp4`). De ahi salio
`imagenes/logo-smilers.webp` (y su version de 440px), recortado del fotograma
en el segundo 4,4. Viene sobre negro puro.

De ese mismo archivo sale `imagenes/logo-smilers-marmol.webp` (y su version
de 440px), que es el que usa Tratamientos: el negro pasa a transparente
—la luminancia del pixel se convierte en su alfa— y lo que en el logo era
plata o blanco se pasa a tinta `#2B2B2B`. Sin eso, sobre el marmol claro el
diente y el «Dental Clinique» desaparecen. El oro se queda como esta.

---

## Fondos — `imagenes/fondos/`

Texturas a todo ancho que van detrás de una sección, nunca sueltas: siempre
dentro de un `.ns-fondo` (Nosotros) o de un `.testimonios-fondo` (portada),
que es quien pone la veladura para que el texto de encima se siga leyendo.

| Archivo | Dónde se usa |
|---|---|
| `jardin-mosaico.webp` (+ `-720`) | Testimonios de la portada y Fundamentos de Nosotros. |
| `marmol-negro.webp` | Las dos portadas (Nosotros y Tratamientos) y el fondo de las tarjetas que llevan `.tarjeta-piedra` dentro: el tríptico, los paneles de tratamiento y la ficha del especialista. Las de valores no, que van en negro con opacidad. |
| `marmol-negro-barra.webp` | La barra de navegación, en las cinco páginas. Es una tira recortada del mármol negro, de 1920×130, para no cargar la imagen entera por 60px de alto. |
| `marmol-blanco.webp` | El fondo de todo lo que en el sitio es claro: Nosotros, Tratamientos, Galería y FAQ lo llevan de lienzo de página (`.lienzo-marmol`), y la sección de Nosotros de la portada lo lleva por sección (`.seccion-marmol`). |

---

## Scripts — `scripts/`

El orden de las etiquetas `<script>` también importa: `planificador.js`
tiene que ir primero porque los demás lo usan.

| Archivo | Qué hace |
|---|---|
| `planificador.js` | El planificador único de scroll (`SmilersScroll`). Un solo listener para todos los efectos, con las lecturas y las escrituras separadas. |
| `navegacion.js` | Navbar (incluido el repliegue al llegar al pie), menú hamburguesa y botón de volver arriba. |
| `revelados.js` | Apariciones al entrar en pantalla, cortinas, paralaje, escenas de salida y **la escena de la pantalla negra de la portada** (`#pnEscena`): saca un progreso de 0 a 1 del recorrido del pin y lo escribe en las variables `--pn-*`. Solo se enciende —clase `.pn-escena--viva`— a partir de 992px y sin `prefers-reduced-motion`; en cualquier otro caso no toca nada y el bloque se queda apilado. |
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
