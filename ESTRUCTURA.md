# Dónde está cada cosa

El código no lleva comentarios. Este archivo es el índice: dice qué hay en
cada archivo y con qué prefijo de clase buscarlo.

Para encontrar algo, lo más rápido casi siempre es buscar la clase por todo
el proyecto (`Ctrl+Mayús+F` en VS Code) — el prefijo dice de qué archivo
sale.

**La seccion se llama Especialidades y el archivo se llama `tratamientos.html`.**
De cara al lector no queda ni una «Tratamientos» suelta: ni en el menu, ni en el
titulo, ni en la ruta, ni en el umbral, ni en los filtros de Galeria, ni en el
bloque de FAQ. Por dentro no se toco nada: el nombre del archivo, los `id`, los
anclas (`galeria.html#tratamientos`, `faq.html#faq-tratamientos`) y los prefijos
de clase (`.bloque-tratamiento`, `.acordeon-tratamiento-*`, `.cinta-trat`) siguen
siendo los de siempre — renombrarlos romperia cada enlace que alguien haya
guardado y cada direccion que este indexada, y no arregla nada que se vea.
Donde «tratamiento» sigue escrito en la pagina es porque ahi significa un
tratamiento de verdad y no la seccion: «tratamiento de conducto», «plan de
tratamiento», «post-tratamiento». Cambiar esas seria decir algo falso.

---

## Estilos — `estilos/`

**El número del nombre es el orden de carga, y el orden importa.** En CSS,
cuando dos reglas tienen la misma fuerza gana la última; `16-oro.css` va casi
al final justamente porque tiene que poder pisar a los quince anteriores, y
`17-detalle-lujo.css` va después porque retoca lo que dejaron todos.
**Cada página carga solo las hojas que le pintan algo**, y eso ya no es
una regla de bulto sino una lista comprobada: hay un cuadro con el reparto
entero más abajo, en «Qué carga cada página». Antes las cinco cargaban de la
01 a la 16 más la 22, la 23 y la 26 vinieran o no a cuento, y así Nosotros
se traía los 42 KB de la portada (07) y los 14 de los testimonios (13) para
no usar de ellos ni una regla.
Si se añade un archivo nuevo hay que enlazarlo en la posición que le toque
por número.

**Y se cayeron 181 reglas que no alcanzaban a nada** (152 → 124 KB en las
once hojas afectadas): restos de diseños anteriores que seguían viajando en
cada visita — `.card-especialidad`, `.timeline`, `.tarjeta-equipo`,
`.ns-bento`, `.ns-galeria`, `.ns-duo`, `.marco-esquina`… El criterio fue el
prudente: una regla se fue solo si **todas** las clases de **todos** sus
selectores faltaban a la vez en los cinco HTML y en todo el JS. Con que una
apareciera en algún sitio, la regla se quedó. Los comentarios no se tocaron.

| Archivo | Qué contiene | Prefijos |
|---|---|---|
| `01-variables.css` | Colores, tipografías, sombras, transiciones. Todo lo que se reutiliza. Aquí viven los **dos tonos planos de oro** del sitio, `--oro-marca` para piedra oscura y `--oro-hondo` para piedra clara, y no en la guía de marca (19): esa hoja solo la cargan dos páginas y el oro tiene que ser el mismo en las cinco. | `:root`, `--*` |
| `02-base.css` | Etiquetas base, imán de scroll, splash de bienvenida, foco de teclado. | `.splash-inicio` |
| `03-botones.css` | La forma de los botones y sus dos adornos: el destello de oro que cruza al pasar el ratón y el filo interior. **El color no se decide aquí**: el 16 los iguala a todos. Las variantes viejas (`.btn-naranja`, `.btn-turquesa`, `.btn-blanco`, `.btn-contorno`, `.btn-fantasma`, `.btn-traslucido`, `.btn-sm-nav`) y el tamaño `.btn-lg` **ya no existen**: se borraron de aquí y del HTML, porque mientras estuvieran bastaba con que una de ellas trajese un `border:` o un `:hover` con más peso para volver a partir el conjunto. | `.btn` |
| `04-navbar.css` | Barra superior de mármol negro (con el filo dorado y el `.navbar-oculta` que la sube al llegar al pie) y el menú que se despliega: un panel que entra por la derecha (`.menu-panel`) sobre un velo desenfocado (`.menu-velo`). En pantallas pequeñas lleva solo las cinco secciones; a partir de 992px se abre a lo ancho y reparte esas cinco en columnas (`.menu-columnas`), cada una con su contenido debajo (`.menu-sub`). | `.navbar-*`, `.marca-*`, `.menu-panel`, `.menu-col*`, `.menu-sub` |
| `05-hero.css` | Portada: vídeo, carrusel, el marco de «Smilers» y el hero cine. La marca va en **versales de Bodoni** —la misma letra con la que la clínica se presenta dos pantallas más abajo, en `.titulo-seccion`—, no en la Prata que llevaba: era la misma voz diciendo el mismo nombre con dos tipografías. En caja alta la palabra crece de ancho, así que el cuerpo baja de 16vw a 12,4vw y el aire de abajo sube, porque la Bodoni en versales no tiene descendentes y sin él la palabra se pegaba al filo. | `.hero-*` |
| `06-secciones.css` | Títulos, párrafos y fondos genéricos de sección. **Y el mármol de fondo de una sección** (`.seccion-marmol`), que vivía en el 15: era lo único que la portada sacaba de esa hoja, y por tres reglas se traía sus 41 KB. | `.seccion*`, `.titulo-seccion`, `.seccion-marmol` |
| `07-nosotros.css` | Sección «Quiénes somos» de la portada, que son **tres pantallas seguidas**: collage + texto, la pantalla negra, y el segundo collage + texto. Los dos collages (`.nosotros-media`) van a media página de ancho y página entera de alto, **sin separación entre fotos**: el filo de oro sale del `gap` de 1px sobre el fondo dorado de la rejilla, no de un borde por figura —así todas las líneas miden lo mismo—, y una `mask-image` apaga el canto que da al centro para que la foto se funda con el mármol en vez de tocarlo. Por eso la figura ya no se desvanece al entrar (`opacity: 1`): con la figura transparente lo que asomaba por debajo era el oro del fondo, y media página se encendía entera. **Los tres bloques son una sola escena** (`.pn-escena`), que no se dispara con el reloj sino con el scroll: un envoltorio de 360vh con un `position: sticky` dentro (`.pn-pin`) que se queda clavado a pantalla completa, y `revelados.js` convierte el recorrido en un progreso de 0 a 1. Con él: se ve el primer collage (0→.05), el telón cruza de izquierda a derecha tapándolo (.05→.32), salen los pilares y el contador (.34→.46), se sostiene (.46→.70) y el telón se retira por la izquierda descubriendo Instalaciones (.70→.97). **Los dos collages viven dentro del pin** —`.pn-fondo--uno` y `.pn-fondo--dos`— y el cambiazo se da en el punto medio, con el negro tapando la pantalla entera, que es lo que hace que la secuencia se lea como toca. Si el segundo se deja puesto desde el principio se ve antes de que entre el negro y se destripa la transición. Dentro de la escena los dos collages van **dibujados desde el principio**, sin revelado por scroll: mientras el segundo espera a opacidad 0 el observador no lo da por visible —se midió: 13 de 26 `.revelar` se quedaban apagados, justo los de dentro— y al abrirse el telón aparecía la piedra en blanco; aquí no se pierde nada porque quien presenta las dos pantallas es el barrido. El filo dorado que viaja con el canto (`.pn-filo`) va fuera del telón porque dentro se lo comería su propio recorte. **La escena va también en el móvil**, con el mismo barrido: lo único que la apaga es `prefers-reduced-motion` (o que no haya JS), y entonces los tres bloques se quedan apilados en flujo normal y en ese orden. En móvil cada pantalla tiene que caber en el alto de la ventana con el collage arriba y el texto debajo, así que se aprieta el interlineado, se recorta el aire y **se cae el párrafo de acompañamiento** —el único texto sin dato: el resumen está en la entradilla y lo concreto en la lista—; sigue en el HTML para escritorio. Ahí el pin va en `dvh` y no en `svh` a propósito: la barra del navegador se esconde al bajar, la ventana crece, y con `svh` el telón se quedaba corto y asomaba una franja de mármol por debajo. Y con la escena viva la sección no pone relleno (`:has(.pn-escena--viva)`), que si no deja esa misma franja por arriba. Cuatro cosas mas que hay que saber. **La columna de texto mide 640px de TEXTO, no de caja**: con `border-box` el `max-width` incluye el relleno, y ese relleno crece con el ancho de la ventana, asi que cuanto mas grande era la pantalla mas estrecha salia la columna —524px a 1366, 518 a 1440, 499 a 1707—; en ese ultimo los dos botones ya no cabian en una fila, se apilaban, el bloque crecia 69px de golpe y el segundo boton se iba por debajo del filo. Sumando el relleno al tope la columna mide lo mismo en toda pantalla, y a partir de 1800px la medida crece un poco porque ahi media pagina es marmol vacio. En ventanas de escritorio **bajas** —menos de 720px de alto: un portatil pequeno, una ventana a medias, o un monitor grande con el escalado de Windows subido— se aprieta en el mismo orden que en el movil, primero los aires y despues el interlineado, nunca el cuerpo de letra; por debajo de 640px de alto eso ya no basta y se cae el parrafo de acompanamiento. Y entre 992 y 1200 los botones llevan menos relleno lateral, que apilados cuestan mas de lo que ahorran. **Dentro del pin la ventana es la medida exacta**: lo que sobre por arriba o por abajo se lo come el `overflow` del pin sin avisar, asi que en escritorio la rejilla se clava al alto del pin y se le descuenta la barra fija — y el collage con ella, con la resta escrita a mano (`calc(100svh - var(--alto-navbar))`) y no con un `100%`, que en una celda de rejilla de fila automatica no tiene contra que medirse y lo disparaba a 1600px; con `100svh` a secas se salia 62px por los dos cantos en cualquier pantalla —sin eso el titular de Instalaciones salia debajo de la barra y el boton se iba por abajo—, y el margen superior de la pantalla invertida se anula ahi dentro, que si no saca el sello tres pixeles por debajo del filo. **El sello de la derecha no se arrima al canto** como el de la izquierda: en esa esquina esta el boton fijo de WhatsApp con su anillo, ocupando los primeros cien pixeles, asi que se corre hacia dentro para dejarlo pasar por fuera. Y **la segunda pantalla lleva un solo parrafo**: llevaba dos y no cabian. Dos trampas mas: **`.seccion-decorada` le pone `overflow: hidden` a la sección y eso convierte la sección en contenedor de scroll, con lo que el `sticky` deja de pegarse a nada** —de ahí `.seccion-decorada.seccion-nosotros { overflow: clip }`, que recorta igual pero no crea contenedor, escrito con las dos clases porque el 11 se carga después—; y el `bottom` del sello se reescribe **después** de `.nm-sello`, no arriba con el collage, porque las dos reglas pesan (0,1,0) y gana la última — ese sello se sube porque el observador de `revelados.js` recorta su marco un 8% por abajo y, con el collage midiendo la pantalla entera, caía justo en esa franja muerta y no se encendía nunca. **En el movil el collage no comparte fila con el texto**: va arriba y el texto debajo, asi que ocupa la pantalla de borde a borde —el relleno lateral se lo queda solo la columna de texto— y se lleva algo mas de un tercio del alto. Ahi el desvanecido no apaga el canto del centro sino el de abajo, para que la foto se funda con el marmol en vez de cortarse contra el; como la mascara se come tambien el filo dorado de ese lado, el sello sube al 26%. Y en las pantallas cortas —640px de alto— hay un bloque aparte que aprieta otra vez interlineados y aires y baja el collage al tercio justo: con el collage mas alto el segundo boton se salia por abajo. **En el telefono los dos botones van uno debajo del otro**: el texto de esa pantalla acaba antes de llegar al filo del pin y debajo quedaba una franja vacia, con los dos apretados en media fila cada uno y el rotulo cortado a .61rem para que cupieran; apilados ocupan ese hueco, se leen a un cuerpo normal y cada uno recibe el dedo entero. Solo por debajo de **560px de ventana** vuelven a su fila, que ahi apilados cuestan 51px que ya no hay — se midio cuanto sobra por debajo de ellos dentro del pin a 588, 515 y 488, que es donde esta el limite. | `.nm-*`, `.nc-*`, `.cl-*`, `.pilar*`, `.pn-*` |
| `08-especialidades.css` | Tarjetas de especialidades y acordeón de galería. El rótulo «Tratamientos» va pegado al techo de la sección, y el techo de la sección está debajo de la barra fija: **su aire de arriba se cuenta desde donde acaba la barra** (`calc(var(--alto-navbar) + …)`), que con un valor fijo la palabra salía partida por la mitad. | `.card-especialidad`, `.acordeon-*`, `.ag-*` |
| `09-cierre-cta.css` | Cierre cine y banda final con llamada a la acción. La pregunta va **suelta sobre la mampostería, sin recuadro** —lo llevó una temporada y encerraba el cierre—, así que la legibilidad la pone el velo: dos capas, la vertical que baja el conjunto y una horizontal que carga la mitad izquierda, donde está la pregunta, y suelta la derecha. Apilado en móvil el degradado lateral estorba y se cambia por uno vertical. **El collage se ve.** Iba a `brightness(.62)` con la vertical de .62 a .82 encima: se adivinaba que había fotos, no qué fotos eran. Hoy el filtro va a .82 y la vertical de .3 a .5, y lo que el titular pierde de suelo plano se lo lleva pegado en su propia sombra, que solo pesa donde hay letra. **El botón sí lleva relleno aquí** (`--btn-relleno: rgba(8,6,4,.72)`), y es lo único que se le devuelve: cae en la mitad derecha —la que el velo suelta— y por ahí pasan retratos a plena luz; una sombra no vale, porque lo que hay que sostener no es solo la letra sino el filo de oro. | `.cierre-cine*`, `.banda-cta*` |
| `10-footer.css` | Pie de página, mapas, formulario, redes y los dos botones flotantes (WhatsApp y subir). | `.footer*`, `.mapa-*`, `.redes-sociales`, `.wsp-flotante`, `.btn-subir` |
| `11-animaciones.css` | Apariciones al hacer scroll, cortinas y formas decorativas. Aquí está el bloque que entra; lo que pasa **dentro** del bloque vive en el 26. | `.revelar`, `.cortina*`, `.forma-*` |
| `12-interiores.css` | Piezas de las subpáginas: banner, equipo, historia, tratamientos, FAQ, comparador y el visor de la galería (`#modalLightbox`, que respeta el tamaño real de la foto y le pone marco cuando se queda corta). | `.banner-*`, `.bloque-tratamiento*`, `.comparador*`, `.lightbox-marco` |
| `13-testimonios.css` | La esfera de testimonios, su versión en tarjetas y el fondo de **madera** que va detrás de las dos. La madera va entera (`opacity: 1`), y no como iba el jardín, que era una foto que mirar y por eso iba tenue y aclarada: la madera es una superficie, la veta es todo lo que tiene, y con aquellos ajustes se apagaba hasta quedar en negro. **Sin halo de oro encima**: lo llevaba al 13% y sobre una madera wengú eso no la encendía, le lavaba la veta del centro justo donde más se ve y la dejaba con aspecto de foto vieja. Lo único que queda encima es el negro de los cantos, que la cose con las secciones vecinas. | `.testimonios-*`, `.tst-*`, `.tc-*` |
| `14-pagina-nosotros.css` | Nació para Nosotros, pero hoy quien usa estas piezas de texto es Tratamientos: portada, ruta, rótulo, entradilla y párrafo. | `.nos-*` |
| `15-lienzo-claro.css` | Las subpáginas sobre fondo claro y el mármol que llevan debajo: `.lienzo-marmol` va fijo detrás de toda la página, `.seccion-marmol` detrás de una sola sección. **Las secciones claras no pintan fondo a propósito; si se les devuelve un color, se tapa la piedra.** Aquí vive también la rejilla de la Galería: **cuatro columnas** de `grid` (dos entre 768 y 991, y las dos de Bootstrap por debajo). Era una mampostería de `columns` con las fotos de siete alturas distintas, y con trece fotos el repartidor de Chrome las dejaba 4/4/4/1, con un hueco del tamaño de una columna a la derecha; en rejilla las filas se llenan siempre, y para que cuadren todas las fotos van al mismo cuadrado —que es el formato nativo de los archivos, así que no se recorta nada—. Ojo: las clases `col-*` del HTML hay que anularlas, porque dentro de una rejilla su `width` mide sobre la celda y encogería cada foto a un cuarto de su hueco. Aqui vive tambien el **umbral** (`.ns-umbral`): la pantalla negra con la palabra de la seccion en oro que tapa la pagina al entrar. **Dura 1,6s clavados**, y esa es la cuenta entera: la palabra entra en .8s, el filo la alcanza en .9s y a 1s empieza a irse con .6s de desvanecido. Eran 2,85s —2s parado mas .85s de salida— y en la segunda visita eso ya no es una entrada, es una espera. El fondo va **negro y nada mas**: llevaba encima un halo de oro —un radial al 12% saliendo del centro— y sobre negro puro eso no se lee como luz, se lee como una mancha; la palabra ya es de oro, y el oro sobre oro deslavado le quita el filo en vez de darselo. El unico oro de la bienvenida es la palabra y su rayita. La palabra va **centrada y equilibrada** (`text-align: center` mas `text-wrap: balance`): «Preguntas frecuentes» es la unica de las cuatro que no cabe en una linea, y sin eso la segunda quedaba pegada a la izquierda debajo de la primera —la caja iba centrada por la rejilla, pero el texto de dentro no— y ademas se salia de la ventana, asi que en esa pagina el cuerpo baja. Lo llevan las cuatro paginas interiores, cada una con su palabra; la portada no, que ahi ese trabajo lo hace el video de bienvenida. **La animacion va en CSS puro y no en JS a proposito** — si dependiera de un guion y el guion fallara, la pagina se quedaria tapada de negro para siempre. Quien decide si sale es un guion de tres lineas en el `<head>`, y **solo puede apagarlo, nunca encenderlo**, que es lo que mantiene en pie esa garantia: sale al pinchar la seccion entera en el menu, y se lo salta si se llega con ancla —ahi no vienes a entrar en la seccion, vienes a un sitio concreto de ella—. Aqui vive tambien la **variante de cine del hero** (`.banner-pagina--cine`, la de Tratamientos): el mismo hero pero con el carrusel de fotos de la clinica pasando por detras en vez de una piedra quieta, y con el velo mas cargado, porque la cinta pasa batas blancas y ventanas a plena luz cada cinco segundos y el titular en blanco no aguanta si no. Ojo con el velo del movil: lleva las dos clases (`.banner-pagina--hero.banner-pagina--cine`) porque el del hero de madera vive mas abajo en la misma hoja y pesa lo mismo, asi que ganaba por ir despues y el de cine no pintaba nada — se midio. Y el **indice de especialidades** (`.franja-nav`), que es la franja de piedra de los filtros con enlaces en vez de botones: las nueve especialidades de Tratamientos, cada una bajando a su bloque. **Ya no es una tira de navegacion, es un indice**, y ese es el cambio: eran nueve nombres sueltos centrados en su celda dentro de un cuadro de tres por tres, y no se entendia que eran —ni una lista, ni una tabla, ni un menu—. Ahora cada uno lleva delante su numero (el mismo 01..09 que preside su bloque mas abajo) y el nombre arranca pegado a la izquierda, que es como se lee un indice. **El numero sale de un contador de CSS y no del HTML**: la numeracion de los bloques ya la lleva el documento, y duplicarla a mano seria pedir que las dos listas no se despeguen nunca. La flecha del canto derecho va **siempre puesta y tenue**, no solo al pasar el raton: sin nada al otro lado, el nombre ocupaba un tercio de la celda y la fila se quedaba colgando en el aire; con la flecha hay principio y final, que es lo que hace que se lea como una linea de indice. **Las junturas van en `border` y no en pseudo**, que es lo que deja el `::after` libre para la flecha —en una tira centrada un borde de canto a canto la habria convertido en una tabla; en un indice es justo lo que se quiere—, y **por `nth-of-type` y no por `nth-child`**: el primer hijo de la franja no es un enlace sino la piedra del fondo, asi que contando hijos la cuenta sale corrida en uno y las lineas caian en la tercera columna en vez de en la primera — se midio. Tres columnas fijas dan un cuadro de 3x3 sin fila coja; por debajo de 576px son dos columnas, el noveno ocupa las dos y la flecha se cae, que sin raton no se enciende nunca y solo le robaria ancho al nombre. Aquí vive también el **hero de madera de Galería y FAQ** (`.banner-pagina--hero`): esas dos páginas empezaban con una franja blanca —el mismo mármol en el que seguían, así que no había entrada— y ahora arrancan con una pantalla de madera. El contenido no cambió (ruta, título, filo de oro y bajada); lo que cambió es la piedra. Es una pieza oscura dentro de una página clara, así que todo su bloque le da la vuelta a lo que el bloque de arriba pinta en negro sobre blanco, y en el 22 entra en la lista de piezas oscuras para que su oro sea el degradado vivo y no el hondo. No va a pantalla completa sino con tope (`min(58svh, 496px)`): a pantalla entera escondía el principio de la galería y no invitaba a bajar, y con el tope más alto que tuvo quedaba media pantalla de aire entre la bajada y el filo. **La madera va entera** —opacidad 1, sin filtro—: a media opacidad lo que se veía no era madera sino el negro de debajo teñido de marrón. Y **el velo casi se ha ido**: la madera wengué mide 35 de luz de media, es de por sí más oscura que cualquier velo razonable, así que el blanco encima se lee sin ayuda y lo que hacía el .78 de la izquierda no era dar contraste, era tapar la veta. Queda .3 a la izquierda y .34 arriba y abajo, y ese resto tiene trabajo: cose el hero con la barra fija —que también es piedra oscura— y con el mármol claro que viene después. El apoyo que el titular pierde se lo lleva pegado: título, bajada, ruta y etiqueta llevan `text-shadow`, que apaga los pocos píxeles que hay detrás de cada letra en vez de apagar la piedra entera. En el hero de cine (Tratamientos) la misma cuenta con otros números, porque ahí abajo no hay una superficie de tono parejo sino fotos de consulta con batas blancas: la izquierda baja de .76 a .58 y el techo de .5 a .3 —sumaban .88 justo donde va el titular y la foto dejaba de existir; ahora suman .71 donde hay letra y .12 en la mitad derecha—. Aquí vive también el **acordeón de FAQ** (`.acordeon-faq`): pregunta y respuesta eran las dos únicas piezas de texto de leer del sitio que bajaban de un rem —.95 las dos—, y en una página que es solo texto eso se nota; hoy la pregunta va de `clamp(1.08rem … 1.22rem)` y la respuesta a 1.04rem, con la interlínea de la respuesta bajada de 1.95 a 1.82, que con el cuerpo mayor ese aire ya no hace falta. Y la **franja de piedra** (`.franja-piedra`): un rectángulo de mármol negro con filo de oro para las tiras de navegación que viven sobre el mármol blanco —los filtros de la Galería y el rótulo de cada bloque de FAQ, que es la misma pieza haciendo el mismo trabajo—. La piedra va en un `<img>` y no en un `url()` de CSS a propósito: es como el sitio carga todas sus piedras, y es lo único que el sellador de caché sabe estampar. El filo va en pseudo y no en `border` del elemento, que entraría en la caja y además se lo comería el `overflow` de la piedra. | `.pagina-clara`, `.pagina-*`, `.lienzo-marmol`, `.seccion-marmol`, `.banner-pagina--hero`, `.bp-fondo`, `.bp-velo`, `.franja-piedra` |
| `16-oro.css` | Reparte el oro de marca sobre todo lo anterior, y es donde **todos** los botones se vuelven el mismo botón de oro, el único que hay: filo de oro, letras de oro y, al pasar por encima, el degradado entero de fondo con las letras en negro. Su oro sale de `--oro-marca`, no de `--gold-500`. **El filo dorado es un `border-image`, así que cualquier regla posterior que use el atajo `border:` lo borra** — es lo que pasaba con `.pagina-clara .btn` en el 15 y con `.footer .btn` en el 10, que dejaban el filo negro y blanco en vez de oro. Si un botón sale sin oro, se busca por ahí. Y el mismo cuidado con el color de las letras: `.footer .btn` y `.btn:hover` pesan igual (0,2,0), así que **el hover tiene que ir escrito después** o las letras se quedan doradas sobre el relleno dorado. **El relleno del botón en reposo no se decide aquí sino con `--btn-relleno`**, que ponen los contextos al final del 22: sobre piedra oscura el botón es solo filo y letras; sobre mármol blanco va relleno de negro, porque en blanco el oro no puede ser filo, letra y contraste a la vez. Al pasar por encima se invierte igual en los dos casos. | `--btn-relleno` |
| `17-detalle-lujo.css` | El fondo con trama de las dos páginas, la portada negra con la palabra en oro (Tratamientos la usa con la clase `.pagina-cubierta` del `<body>`) y los retoques del comparador antes/después. **Solo lo cargan esas dos páginas.** | `.nos-portada__*`, `.pagina-tratamientos *` |
| `18-piezas-editoriales.css` | Aqui vive la cabeza del triptico de Tratamientos (`.pz-triptico__cabeza`): las tres tarjetas iban sueltas, sin nada que dijera que son un grupo. Va centrada y no arrimada a la izquierda como el resto de rotulos de la pagina, porque encabeza tres columnas y no una; el rotulo pierde ahi su linea, que centrada quedaria colgando de un lado. **Va después del 17 a propósito.** Las piezas de Tratamientos: el tríptico de tarjetas que se monta sobre la portada, la tarjeta de cita negra y la fila de medallones del proceso. **Las tres tarjetas miden lo mismo en cualquier reparto** (`grid-auto-rows: 1fr`): en tres columnas ya salían iguales porque comparten fila, pero apiladas en el teléfono cada una medía lo que medía su párrafo —348, 321 y 321— y se veían como tres tarjetas de tres tamaños. **Y la foto va a 3/2, no a 16/7**: las tres imágenes que entran ahí son 1200×800, 1000×750 y 800×552 —o sea 1.50, 1.33 y 1.45—, así que un marco de 1.50 no las recorta casi nada y las tres se ven completas, al mismo tamaño y por el centro; a 16/7 (2.29) se les cortaba más de la mitad del alto y cada una por un sitio distinto. En una tarjeta de 399 de ancho la foto pasa de 174 a 266 de alto y la tarjeta entera de 393 a 485. Apilada baja a 16/9, que es el mismo encuadre con menos alto. **El aro del medallón lleva dos grosores** —2px el de fuera, que es lo que se ve de lejos en una fila de cinco círculos, y 1px el de dentro, que solo lo dobla— y su icono va en `--oro-plano`, no en el vivo: sobre el mármol de Tratamientos el vivo se lavaba y el paso del proceso se quedaba sin oro. El nombre de cada paso entró en la lista de tipografía dorada del 22 por el mismo motivo. | `.pz-*` |
| `19-guia-marca.css` | La guía de marca aplicada: reescribe los tokens a crema `#FAF8F5` y negro `#0A0A0A` —el oro sale del 01, que es donde vive el único de la marca—, y de ahí salen los fondos, los bordes finos, las sombras y los estados de hover de las dos páginas. **Aquí se cambia el color de marca, no en el 01, y aquí se cambia el alto de las secciones de Tratamientos, no en el 15 ni en el 17.** | `--gm-*` |
| `20-nosotros-editorial.css` | **Lo cargan Nosotros y Tratamientos**: es el kit editorial (rótulos, titulares, párrafos, fichas). Las dos portadas son la misma pieza `.ns-portada`, solo cambia la palabra. **Nosotros ya no usa `.ns-portada`**: su portada es ahora el hero de la historia del 24. La pieza se queda porque Tratamientos si la usa. | `.ns-portada*`, `.ns-titulo`, `.ns-rotulo` |
| `21-dinamico.css` | **Va el último y lo cargan Nosotros y Tratamientos.** Lo que da movimiento a las dos páginas: el carrusel dorado, las tarjetas de piedra (que al pasar el ratón solo crecen un pelo y hunden la sombra: el oro vive en sus títulos, no en el hover), las secciones de Nosotros con su telón de entrada (`.ns-pantalla__velo`, que se levanta en vez de desvanecerse), la costura de oro que se dibuja sola entre sección y sección, el riel de puntos lateral, la portada (`.ns-portada__cinta`: el carrusel de fondo a todo el ancho y todo el alto del hero, que mide un tercio de la pantalla; las tomas no se funden en el sitio sino que entran por la derecha y salen por la izquierda —de ahí la clase `crsl__toma--saliente` que pone `interiores.js`—, que llega a media pantalla, con la palabra encima —peso 400 a propósito, porque es un `h1` y heredaría la negrita; y el bloque **centrado a ojo, no por caja**: son mayúsculas sin bajos, así que la tinta cae en la mitad alta de su línea y el relleno de abajo va más corto para compensar— y nada más; cada toma dice por dónde quiere que la recorten con `data-encuadre`), las dos paradas de scroll de Nosotros —la de Fundamentos y Valores, que van juntos en una sola sección (`.ns-doble`, donde todo se aprieta para que las dos mitades quepan de una vez, ), y la de Equipo—, el sello de marca de Tratamientos (`.ns-sello`: el logo de verdad **sin placa**, apoyado directamente sobre la piedra, en el hueco a la derecha del párrafo de «Todo bajo un mismo techo»), el cierre de esa página (`.pz-proceso`, que repite la parada de «En cifras» pero **al revés por abajo**: la foto entra por arriba, se ve entera en el centro y se apaga antes de llegar al borde. La máscara de «En cifras» llega al 100% a plena opacidad, y como debajo de esta empieza la banda de la pregunta, la foto se cortaba en seco justo en la juntura; ahora la sección acaba en la misma piedra en la que empieza. **Su lavado claro carga más que el de cifras**, y no por gusto: desde que el nombre de cada paso va en oro hay tipografía dorada pequeña y muy espaciada cayendo justo sobre la banda donde la foto se ve entera, y el oro sobre una consulta con batas blancas no se lee) y la cinta (`.cinta-trat`: línea recta de texto en **plata** sobre negro, ceñida a las letras, con la lista repetida dos veces para que el bucle no tenga costura), que sale **dos veces** —debajo del sello y al cerrar los nueve tratamientos, la segunda con `aria-hidden` porque solo repite lo ya dicho—, la piedra de las tarjetas (`.tarjeta-piedra`, que va debajo y por eso todo lo demás de la tarjeta sube a `z-index: 1`; **sin lavado de oro encima: sobre el mármol negro se veía como una mancha**. Las de valores ya no la llevan: sobre el jardín de Fundamentos van en negro con opacidad, para que la hoja se siga viendo por debajo), la ficha del especialista (`.ns-ficha`, que rellena `scripts/secciones.js` con los `data-esp-*` de cada retrato y se despliega **a la derecha** de los retratos dentro de `.ns-equipo__reparto`: elegir a alguien no abre su foto, cambia la ficha), el orden de los bloques de Tratamientos en móvil (la tarjeta de información sube por delante de la foto con un `:has()`) y el fondo fotográfico de sección (`.ns-fondo`, con las variantes `--jardin`, `--marmol` y `--degradado` —la de En cifras, que emerge del mármol: la máscara la borra arriba y la va dejando ver hacia abajo, con un lavado claro encima para que el texto siga siendo oscuro. Esa sección es clara, no negra: por eso lleva `.ns-cifras-sec`, que baja la tinta de los contadores y mete la pregunta y el botón del cierre en una tarjeta negra con opacidad y filo de oro, porque sueltos sobre la foto se perdían—; las secciones claras ya no llevan fondo propio, lo pone el lienzo del 15). **Aquí se cambia el alto de las secciones de Nosotros.** Aquí se visten de piedra las fichas del 20 y las tarjetas del 18. Dos avisos desde que Nosotros es una escena clavada: **sus secciones ya no llevan `.ns-pantalla`**, asi que ni el telon de entrada ni la costura de oro ni el `en-pantalla` corren en esa pagina —el riel lateral si, pero lo arma `nosotros-cine.js` con sus propias paradas, porque dentro del pin todas las secciones caen en el mismo punto del documento—; y **las reglas de `.ns-equipo__galeria` estan muertas**, porque el acordeon de retratos lo sustituyo el carrusel del elenco. Se dejan por si vuelve. | `.crsl-*`, `.ns-pantalla`, `.ns-riel`, `.ns-fondo`, `.pz-panel` |
| `22-oro-unico.css` | **La cargan las cinco páginas.** Un solo oro en todo el sitio: le pone a toda la tipografía dorada el mismo degradado recortado que lleva «Smilers» en la barra. Dos trampas documentadas dentro: `background-clip: text` recorta *todas* las capas de fondo (por eso los iconos con círculo y los botones se quedan fuera, en oro plano), y `-webkit-text-fill-color` se hereda pero el fondo no (por eso un `<span>` dentro de un texto recortado se queda invisible si no se le pasa el degradado). Sobre mármol claro entra el mismo efecto con `--gradiente-oro-hondo`. **Y aquí se reparte también `--oro-plano`**, la variable hermana para lo que no se puede recortar contra el texto —un icono dentro de su círculo, un aro, una manija—: esas piezas se quedaban en el oro vivo en toda la página, y sobre mármol claro ese oro da 2:1 contra el fondo, o sea amarillo pálido, no oro. Las dos variables viajan siempre en la misma lista. Ojo con de dónde sale su valor: **sale del 01 y no de la guía de marca**, porque esta hoja la cargan las cinco páginas y la guía solo dos, y una variable sin valor no cae al respaldo del `var()` —invalida la declaración entera y el color se hereda—. Y ojo con la escapatoria de las piezas oscuras: apunta a `--oro-marca-degradado` y no a `--gradiente-oro`, porque en una página clara esa última ya viene redefinida al hondo desde el 15 y la escapatoria no escapaba de nada. **Aquí se reparte también `--btn-relleno`**, por la misma vía y con casi la misma lista: se nombra la piedra clara una vez —se hereda— y se devuelve la variable a `transparent` dentro de las piezas oscuras que viven en esas páginas claras (la barra, el pie, las bandas de cierre, las tarjetas de piedra, el telón de la portada). Si un botón sale relleno de negro sobre negro, o sin rellenar sobre blanco, la pieza que le falta a esa lista es la culpable. En la lista de piezas oscuras entran también las dos **franjas de piedra** del 15 —los filtros de la Galería y los rótulos de FAQ—, que son mármol negro dentro de páginas claras. La que **salió** de esa lista es la banda de ónix: desde que va retroiluminada es piedra clara, y el 23 le devuelve el degradado hondo y el relleno negro del botón. | `--oro-vivo-degradado`, `--btn-relleno` |
| `23-cierres.css` | **Va la última y la cargan las cinco páginas.** El cierre de las páginas interiores, uno solo: la pregunta final sobre el **ónix**, dentro de un recuadro negro con filo de oro (`.banda-cta--onyx` + `.banda-cta__vidrio`). Nació en Tratamientos y hoy es la misma pieza en Galería, en FAQ y —con su mampostería en vez de la piedra— en la portada, que hasta ahora leía el titular en blanco directamente sobre las fotos y por debajo pasaban batas blancas y caras a plena luz. **Va después del 15 a propósito**, y con las dos clases (`.banda-cta.banda-cta--onyx`) también a propósito: el 15 le pone `background: transparent` a `.pagina-galeria .banda-cta` y a `.pagina-tratamientos .banda-cta`, y esos selectores pesan más que `.banda-cta--onyx` a secas — con una sola clase se veía el mármol blanco del lienzo en lugar de la piedra. **El recuadro ya no está y el velo negro tampoco**: mientras hubo recuadro, la piedra iba a media opacidad; fuera el recuadro, el ónix pasó a ir entero pero todavía con un velo negro al 82% por la izquierda que le hacía el contraste al texto blanco — y ese velo apagaba justo la miel que hace bonita a esta piedra. Hoy la banda va **retroiluminada**: la piedra a opacidad 1 con un punto más de brillo, un foco cálido a media altura escorado a la derecha y un apagado hacia los cantos que va a tierra caliente y no a gris (una plancha con luz detrás nunca se va al negro por los bordes). Con la piedra encendida el texto blanco deja de servir y pasa a negro, que es lo mismo que hace el sitio sobre el mármol blanco; por eso **aquí se le devuelve a la banda el degradado hondo y `--btn-relleno: var(--onix)`**: dejó de ser una pieza oscura. En móvil la banda se apila y el foco se centra. Medido: bajo el texto la piedra da 219 de gris de media y 159 en su punto más oscuro, o sea **7,1:1 en el peor píxel** para el negro del titular. | `.banda-cta--onyx` |
| `24-nosotros-cine.css` | **Va la ultima y solo la carga Nosotros.** Esa pagina es una sola escena clavada: un envoltorio de 590vh con un `position: sticky` dentro (`.ns-cine__pin`) que se queda a pantalla completa, y `nosotros-cine.js` convierte el recorrido en un progreso de 0 a 1 que escribe en variables. Dentro del pin hay cuatro capas —el hero de la historia, el panel de fundamentos, el elenco y el panel de infraestructura— y las dos hojas negras que cierran; detras viene la segunda escena, la del cierre (210vh), donde esas mismas hojas se abren sobre la pregunta final. **El orden del HTML es el orden en que se lee**, y eso es lo que salva la pagina sin JS o con `prefers-reduced-motion`: la clase `.ns-cine--viva` no se pone y las capas se quedan apiladas en flujo normal. **El cine va tambien en el movil**, con el mismo barrido; ahi cada capa se aprieta hasta caber en el alto de la ventana —y lo que se cae es siempre lo mismo, el texto sin dato: el segundo parrafo del hero y la glosa de cada valor—, el pin va en `dvh` y no en `svh` porque la barra del navegador se esconde al bajar, y en las pantallas cortas (640px de alto) hay un segundo recorte. **Las dos maderas de la pagina —la de fundamentos y la mitad del elenco— ya no llevan halo de oro encima**, igual que la de Testimonios: lo unico que va sobre la veta es el negro que le da contraste al texto; la de fundamentos sube ademas de .44 a .6 de opacidad, que con el halo fuera se puede. **El suelo de la pagina va en negro mientras hay escena** (`main:has(.ns-cine--viva)`), y eso es lo que quitaba la raya blanca del movil: las dos piezas de la escena son bloques altisimos con un pin de `100dvh` dentro, y el pin no siempre mide un numero redondo de pixeles —entre lo que el navegador redondea y lo que la barra de direcciones hace crecer y encoger al vuelo, por el canto asoma de vez en cuando media linea de lo que hay debajo—, y lo que hay debajo es la pagina, que en Nosotros es crema. Con el suelo en negro esa media linea sigue estando —no hay forma de que no este— pero es del mismo color que el telon que la tapa. Va en `:has()` para que solo pase con la escena encendida: sin ella la pagina es clara y su fondo tiene que serlo. **Y en el movil se cae tambien el desenfoque de entrada de los dos paneles.** En un ordenador `filter: blur()` es un filtro mas; en un telefono es un gaussiano a pantalla completa recalculado en cada fotograma de scroll, y son dos —el de fundamentos a mitad de escena y el de infraestructura al final—. La entrada se queda en la opacidad y el desplazamiento, que el compositor mueve solo, y a ese cuerpo de letra el desenfoque no se echa de menos. **En el movil el cierre deja de ser una escena**: por debajo de 992px `nosotros-cine.js` no le pone `--viva` y la banda se queda en flujo normal, que es su estado de partida. El motivo es geometrico y no de gusto: dos pines seguidos se cobran **el alto entero de una pantalla** entre el uno y el otro —el pin del cine tiene que terminar de salir antes de que el del cierre pueda clavarse—, y como las hojas estan cerradas a los dos lados de ese hueco, lo que se recorria ahi era una pantalla de negro quieto; despues venia otro tanto de apertura y todavia media pantalla mas de banda clavada sin hacer nada. Sin pin, quien descubre la pregunta es el propio telon del cine al terminar de subir, que es movimiento que ya estaba pagado: la apertura deja de costar scroll porque deja de ser un tramo aparte. El telon se cierra ademas en el ultimo 6% del recorrido y no en el 8%, que sin apertura a la que dar entrada alargar el cierre es solo alargar el negro. **Las cifras las cuenta entonces el observador de `footer.js`**, que las observa siempre; el relanzamiento desde la escena solo hace falta cuando las hojas las tapan. El umbral se mudo al 15, que lo cargan las cuatro paginas interiores. Tres cosas que hay que saber: **el 15 le apaga la mamposteria a toda `.banda-cta` de pagina clara**, y por eso el cierre la recupera con tres clases (`.pagina-clara .banda-cta--cine .banda-cta-masonry`) —y con la mamposteria a la vista, **el velo de esa banda cierra por el centro y suelta los cuatro cantos**: el radial sumado al lineal daba .93 justo donde estan la pregunta y las cifras y el collage no se veia; hoy suman .74 ahi y .34 en las esquinas. Lo que falta lo ponen las piezas: sombra de texto en el titular y los rotulos, y **una plancha oscura detras de la fila de cifras**, no una sombra por cifra. Aqui hay una trampa que costo un bug: el numero va en oro recortado contra el fondo, asi que `text-shadow` no pinta nada —el texto es transparente— y lo natural es poner un `drop-shadow` al bloque; pero **ese numero cambia de texto en cada fotograma mientras se cuenta**, y un `filter` sobre un elemento que se repinta sesenta veces por segundo se recalcula sesenta veces por segundo, en las cuatro cifras a la vez y justo cuando las dos hojas se estan abriendo. En el movil eso se notaba. La plancha se pinta una sola vez, va en `z-index: -1` dentro de `.ns-cifras` —que no abre contexto de apilado, asi que cae por detras de las cifras y por delante del velo— y ademas hace mejor trabajo: lo que hay que separar del collage es la fila, no cada numero. El boton recupera relleno (`--btn-relleno: rgba(6,6,6,.72)`) por lo mismo que el de la portada: cae sobre retratos a plena luz y lo que hay que sostener es el filo tanto como la letra—; **los imanes de scroll del 21 apuntan a `#fundamentos` y a `#equipo`**, que dentro del pin caen los dos en el mismo sitio y engancharian el barrido, asi que se apagan con la escena viva; y dentro del pin **no hay revelado por scroll** —las capas que esperan su turno estan a opacidad 0 y el observador no las da nunca por visibles—, asi que `.revelar` se fuerza a visible y quien presenta cada pantalla es el barrido. Y una cuarta, la mas facil de volver a tropezar: **`.ns-envoltura` trae `margin-inline: auto` del 20, y la capa es un flex**; ahi un margen automatico no centra una caja estirada, le quita el estirado y la deja del ancho de su contenido, en medio de la pantalla. Por eso el titular del hero empezaba por el tercio de la pagina en vez de por el borde, y por eso aqui se reescribe a `margin-inline: 0` con `width: 100%`. | `.ns-cine*`, `.ns-cierre*`, `--c-*` |
| `25-tratamientos-cine.css` | **Va la última y solo la carga Tratamientos.** Cada una de las nueve especialidades ocupa **una pantalla**: `min-height: calc(100svh - var(--alto-navbar))`, el contenido centrado dentro y un `scroll-snap-align: start` que, con un `proximity` suave en el `html`, encaja la pantalla solo cuando ya estás cerca —la portada, el tríptico y el pie siguen pasando de largo—. La foto se lleva **siete columnas de doce** y el panel de información cinco; los bloques se colocan por orden de fuente, así que la clase `order-lg-*` que ya alternaba el lado sigue mandando y no hubo que tocar el HTML. **La altura de la foto se escribe en la columna, no en el marco**: el marco es un hijo flexible que se come lo que sobra después del deslizador y su nota, y si la altura fuera suya esos dos se saldrían por abajo. Aquí murió la **deriva editorial** que vivía en el 15 —un ancho y un margen distintos por cada `id`—, que con la pantalla completa solo dejaba un hueco muerto a un lado. La entrada es un barrido: el marco se descubre de abajo arriba con `clip-path` y se asienta desde un 96,5%, y el panel llega 160 ms después. **Tres trampas dentro.** Una, `min-height` y nunca `height`: en una ventana muy baja el bloque crece y se sale de la pantalla, que se arregla con scroll — cortar el contenido no se arregla con nada. Dos, `clip-path` no solo tapa: **quita el elemento del mapa de clics**, así que el reset de `prefers-reduced-motion` del final no es cosmético — sin él, quien navegue sin animaciones se queda los nueve comparadores invisibles y muertos. Y tres, la capa de piedra es un elemento posicionado con `z-index: 0`, que **se pinta después del contenido en flujo aunque en el HTML vaya antes**: por eso el `.container` de los bloques de piedra sube a `z-index: 1` fuera de toda media query — en móvil el bloque es un acordeón, pero la piedra sigue estando. Aquí se pintan también los **fondos intercalados** (`.trat-piedra`, en las especialidades pares). Desde que la piedra es hormigón claro y no pizarra oscura, encima lleva tierra tostada al 12% en vez de velo negro, el panel se queda con su mármol negro de siempre —sobre hormigón separa mejor que sobre crema— y no hay que girar nada a blanco. La juntura entre las dos superficies la marcan dos filos de grosor distinto: 2px arriba, que es el que anuncia el cambio de piedra, y 1px abajo, que solo lo cierra. Aquí vive también **el oro añadido de esta página**, con la misma escala de grosores que Nosotros —2px la línea que abre una pieza que sostiene una afirmación, 1px el contorno y las divisiones de dentro, y nada por debajo de 1px, que a media opacidad una línea de oro deja de ser una línea y se vuelve una mancha—: filo de 2px sobre cada tarjeta del tríptico (las tres cosas que aquí no se negocian) y sobre el panel de cada especialidad, que sube de 1px porque es la pieza que lleva el nombre y lo que incluye; y una raya de 1px en la juntura entre la foto y el texto de la tarjeta, que es el único corte que la tarjeta tiene dentro y sin él la foto se derramaba sobre el mármol negro del cuerpo. **El aro del sello y las cuatro esquinas del comparador salen de `--gold-200` y pasan a `--oro-plano`**: #E6C95F es un tono de dentro del degradado, no uno de los dos planos del sitio, y sobre negro sale amarillo al lado del #D4AF37 de su propio filo. Se probó también una regla debajo del número de cada bloque y se quitó: el número ya lleva una a la izquierda desde el 17, y dos rayas de oro alrededor de dos dígitos no es un detalle, es un adorno. | `.bloque-tratamiento--piedra`, `.trat-piedra` |
| `26-entradas.css` | **Va la ultima y la cargan las cinco paginas.** Las entradas de dentro. El `.revelar` del 11 sube el bloque entero cuando entra en pantalla; esto es lo que pasa **dentro** de ese bloque: el rotulo, el titular, el parrafo y la lista o el boton se descubren uno detras de otro, cada uno detras de su propia mascara. **El retraso se reparte por clase y no por posicion**, y eso es lo que hace que un bloque de dos piezas y otro de cuatro se lean con el mismo ritmo: lo que decide cuando entra algo es lo que ES, no donde esta. Tres escalones de 90ms. Escalonan tambien las tres tarjetas del triptico, los cinco medallones del proceso y los nueve enlaces del indice de especialidades —esos con la mascara abriendo de izquierda a derecha, que son lineas de una sola altura y sobre una linea un barrido vertical no se ve—, y el hero de las paginas interiores, que no es un `.revelar` (no entra en pantalla, ya esta) y por eso va en `animation` y arranca con la pagina. **Todo es mascara y opacidad, sin `transform`, y es una decision**: media docena de estas piezas ya usan `transform` para su hover —las tarjetas crecen un 2,2% al pasar el raton— y pisarselo desde aqui apagaria el hover para siempre en cuanto la pieza terminara de entrar. La mascara **acaba en `inset(-50%)` y no en `inset(0)`**: recortando a ras de caja se quedaria comiendo para siempre lo que sobresale de ella, que en estas tarjetas son 54px de sombra. Dentro de una ficha escalonada el texto no vuelve a esperar su turno, que encadenar los dos retrasos dejaba el ultimo parrafo del triptico entrando medio segundo tarde. La hoja entera vive dentro de `prefers-reduced-motion: no-preference`, asi que quien pide menos movimiento no llega siquiera a tener el estado escondido. Ojo con el pin de Nosotros: ahi nadie pone nunca `.visible` y el texto que lo esperara no llegaria jamas, asi que hay un bloque final que se lo devuelve. | `.revelar`, `--paso` |

**El indicador de pagina de esta portada es el mismo `.breadcrumb-personalizado` que el de las otras tres**, con su casita y su galon. Aqui vivia antes un `.ns-ruta--filo` propio que se le parecia en la letra pero no en el resto —sin iconos, con un `>` tipografico y con un filo de oro debajo que ninguna otra pagina llevaba—; se retiro entero, y lo unico que se escribe aqui es lo que pide la piedra de debajo: en las otras tres el indicador cae sobre madera quieta y aqui sobre un carrusel de fotos de consulta, asi que lleva sombra.

El retrato del elenco no es un recorte de verdad: es una mascara ovalada que apaga el fondo de la foto hacia los cantos y deja la figura sobre el marmol —cerrada antes de tocar el borde, que si llega con tinta se ve el rectangulo de la foto—. Un recorte de verdad pediria archivos con transparencia. El elenco reparte la pantalla en dos, y **cual piedra va en cada lado no es indiferente**: el marmol debajo del profesional y la madera debajo de lo que se cuenta de el. La figura acaba fundiendose en la superficie que tenga detras, y sobre la veta de la madera esa fundida se nota —la veta cruza por donde deberia estar el hombro—; sobre marmol, que es grano fino y tono parejo, no. De paso la mitad oscura pasa a ser la del texto, que es donde la ficha ya era negra. La figura va **escalada un 20% dentro del marco** con el origen a la altura de la cara, para que lo que se sale por abajo sea cintura y no cabeza, y el marco recorta lo que sobre. **El alto del marco lo manda la ficha de al lado, no la ventana**: iba a `min(66svh, 600px)` mientras la columna de texto mide entre 365 y 390 haga lo que haga la ventana —su alto lo pone su contenido—, asi que el retrato sobresalia 118px por arriba y por abajo; se midio a 1920, 1440, 1366 y 1280 y de ahi salen los 384. Y el nombre ya no cuelga del marco: va en una **placa** (`.ns-elenco__placa`) apoyada sobre el pecho, con la especialidad debajo, que es lo que le devuelve a la figura el alto que la placa ocupaba. La placa hace ademas falta desde que el retrato vive sobre marmol: el nombre iba en blanco porque debajo tenia madera.

**Los grosores del oro de esta pagina tienen escala**, y la decide la jerarquia: 3px la juntura de las dos piedras del elenco —la unica linea de la pagina que separa dos superficies y no dos cajas—, 2px el filo de arriba de la pieza que lleva la afirmacion principal de su pantalla (las dos fichas de Fundamentos, la del especialista y la placa de su nombre), 1px el contorno de todo lo demas y 1px al 32% los remates de dentro. Antes iba todo a 1px y a la misma opacidad, con lo que las cuatro piezas de una pantalla pesaban igual aunque no dijeran lo mismo. Los filos de 2px van en el `::before` que esas piezas ya tenian y no en el `border`: `border-image` con el degradado de marca pinta los cuatro cantos a la vez, asi que por esa via no se pueden tener dos grosores en la misma caja. Fundamentos va sobre **madera** y en dos columnas, que apilado no cabia en una pantalla; de ahi que solo queden mision, vision y los cuatro compromisos. La madera no es capricho: es la unica pantalla del recorrido que no ensena la clinica —no hay foto que valga para lo que se dice en ella— y sobre marmol negro quedaba indistinguible del hueco entre escenas. Va tenue, al 44%, porque detras lleva dos columnas de texto largo. Es la misma madera de Testimonios en la portada y de los heros de Galeria y FAQ. Infraestructura ya no lleva rejilla de fotos: es texto sobre el hero. Y las cifras del cierre van en oro, con el mismo recorte del 22 escrito aqui, porque alli quien lo lleva es `.ns-cifras-sec`, la seccion clara de la version vieja. | `.ns-umbral`, `.ns-cine*`, `.ns-capa*`, `.ns-elenco*`, `.ns-hoja*`, `.ns-filo*`, `.ns-cierre*` |


---

## Qué carga cada página

Ni una hoja de estilo ni un guion viaja a una página que no lo use. El reparto
sale de contar, selector por selector, cuáles alcanzan a algo en cada página, y
está comprobado: **la huella de estilo calculado de los cinco documentos —cada
elemento con cincuenta y tantas propiedades— es idéntica antes y después.** No
se quitó nada que se vea; se quitó lo que viajaba sin pintar.

| | portada | Nosotros | Especialidades | Galería | FAQ |
|---|---|---|---|---|---|
| **estilos** | 01-13, 16, 22, 26 | 01-04, 08-12, 15-17, 19-22, 24 | 01-04, 06, 09-12, 14-19, 21-23, 25, 26 | 01-04, 06, 08-12, 15, 16, 22, 23, 26 | igual que Galería |
| **guiones** | bootstrap, planificador, navegación, revelados, footer, secciones, hero, testimonios | planificador, navegación, footer, secciones, interiores, nosotros-cine | planificador, navegación, revelados, footer, subpáginas, interiores | bootstrap, planificador, navegación, revelados, footer, subpáginas, secciones | bootstrap, planificador, navegación, revelados, footer, secciones |
| **peso** | 580 → 308 KB | 672 → 275 KB | 629 → 249 KB | 540 → 250 KB | 540 → 244 KB |

Dos cosas que conviene entender antes de tocar el reparto:

- **Que una hoja aporte pocas reglas no significa que sobre.** La 19 le da a
  Nosotros dos selectores, y esos dos son el bloque de variables `--gm-*` que
  gobierna el color de las doscientas y pico cajas de la página. Se probó a
  quitarla y la letra entera cambió de tinta. La única señal fiable es **cero**.
- **Bootstrap ya no lo carga todo el mundo.** Su JavaScript solo hace falta
  donde hay acordeón (FAQ), carrusel (portada) o modal (Galería). Nosotros y
  Especialidades se traían 80 KB para no llamar a una sola función.

Los guiones van todos con `defer`. Antes bloqueaban el análisis del documento
al final del `<body>`; ahora se descargan mientras el navegador sigue leyendo y
se ejecutan en orden justo antes de `DOMContentLoaded`, que es cuando todos
esperaban de todas formas.

---

## Bootstrap va recortado — `vendor/bootstrap/`

Bootstrap trae 2031 clases. El sitio nombra 75. Las otras 1956 eran 190 KB que
el navegador descargaba, analizaba y guardaba en memoria en cada visita para no
pintar absolutamente nada, y encima **antes que ninguna hoja propia**, porque va
la primera y el CSS bloquea el pintado.

`scripts/podar-bootstrap.js` lee `bootstrap.min.css` y escribe
`bootstrap.recorte.css`, que es el que cargan las páginas: **227 KB → 37 KB**.
La regla es a propósito prudente: se conserva un selector si no nombra ninguna
clase —todo el *reboot*, que va por etiqueta— o si **todas** las que nombra
están en la lista de usadas. Esa lista sale de los cinco HTML, del CSS propio
(que puede colgarse de una clase de Bootstrap para afinarla) y del JS propio, y
lleva además a mano las clases que Bootstrap se pone a sí mismo desde su
JavaScript y por eso no están escritas en ningún sitio: `collapsing`, `showing`,
`carousel-item-start`, `modal-backdrop`…

**Si añades una clase de Bootstrap al HTML, vuelve a correrlo.** Si no, la regla
que la pinta puede no estar en el recorte y no te avisará nadie: simplemente no
se verá.

El original se queda en el repo como fuente, fuera del despliegue
(`.vercelignore`). El JavaScript pasó del `bundle` a `bootstrap.min.js`: el
`bundle` es lo mismo más Popper, y Popper solo lo usan el desplegable, el
*tooltip* y el *popover*, que aquí no existen.

---

## SEO

**Las direcciones buenas son las limpias, sin `.html`.** `vercel.json` tiene
`cleanUrls` encendido desde siempre, lo que significa que el servidor responde
en `/subpaginas/nosotros` y manda un 301 a quien pida `/subpaginas/nosotros.html`
— y los 181 enlaces internos del sitio llevaban `.html`. Cada salto entre
páginas costaba dos viajes en vez de uno y cada enlace apuntaba a una dirección
que no es la definitiva. Ahora van todos a la forma limpia, en raíz (`/`,
`/subpaginas/faq#cuidados`), y los enlaces de una página a sí misma se quedan en
el ancla pelada (`#historia`), que además es lo que `nosotros-cine.js` necesita
para reconocerlos como suyos.

**Contrapartida a saber:** abriendo los archivos a doble clic desde el disco,
los enlaces del menú ya no navegan, porque `file://` no sabe de `cleanUrls`. Para
ver el sitio en local hace falta un servidor (`npx serve .`) o mirarlo desplegado.

Cada página lleva, detrás de su descripción:

- `<link rel="canonical">` a su dirección limpia y absoluta.
- Tarjeta social completa (Open Graph + Twitter) con
  `imagenes/og-smilers.png`, 1200×630, negro y oro, generada aparte.
- `robots`, `theme-color`, `og:locale` en `es_EC`.

Y datos estructurados en `application/ld+json`, uno por página:

| Página | Qué declara |
|---|---|
| portada | `Dentist` (matriz) + `Dentist` (sucursal, con `parentOrganization`) + `WebSite`. Dirección, teléfono, correo, horario, redes y las nueve especialidades como `MedicalProcedure`. Las coordenadas son las de verdad: salen de los dos mapas incrustados del pie. |
| Nosotros | `BreadcrumbList` + `AboutPage` apuntando a la clínica. |
| Especialidades | `BreadcrumbList` + `ItemList` con las nueve, cada una a su ancla. |
| Galería | `BreadcrumbList` + `ImageGallery`. |
| FAQ | `BreadcrumbList` + `FAQPage` con las **13 preguntas y respuestas leídas del propio acordeón**. |

`robots.txt` y `sitemap.xml` están en la raíz. **`robots.txt` no cierra las
direcciones con `.html` a propósito**: un buscador solo puede recoger el 301 si
le dejas entrar a verlo, y cerrarlas dejaría las viejas colgadas en el índice
para siempre.

Se cayó el `<meta name="keywords">` de las cinco páginas: no lo lee ningún
buscador desde 2009.

Las tipografías se piden ahora como `Bodoni+Moda:wght@400..800` en vez de los
cinco pesos sueltos. Bodoni Moda es una fuente variable y los cinco pesos
apuntaban al mismo archivo: pedirlos por separado solo multiplicaba por cinco
las declaraciones `@font-face`, **23 KB → 6 KB de CSS que bloquea el pintado**.
Y se cayó Prata: la pedían la portada y Nosotros, y las dos únicas reglas que la
usaban eran de una portada de Nosotros que ya no existe.

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
`--gold-700` para la sombra).

**Hay dos tonos planos y dos degradados. Ni uno más, y esto se midió:** un
recorrido por las cinco páginas leyendo el color que de verdad se pinta en
cada icono, cada filo y cada texto dorado devuelve exactamente esos cuatro
valores y ninguno suelto.

| Token | Dónde va |
|---|---|
| `--oro-marca` `#D4AF37` | El tono plano sobre piedra oscura. |
| `--oro-hondo` `#A8801E` | El tono plano sobre piedra clara, donde el vivo se lava a 2:1 contra el fondo. |
| `--gradiente-oro` | El degradado vivo, el de «Smilers» en la barra. Sobre negro. |
| `--gradiente-oro-hondo` | El mismo degradado con el tramo claro bajado. Sobre mármol claro. |

Los dos tonos planos viven en el 01 y no en la guía de marca (19) **porque
esa hoja solo la cargan Nosotros y Tratamientos**, y el oro tiene que ser el
mismo también en la portada, la Galería y las Preguntas. Quien los reparte
según la piedra es el 22, con dos variables hermanas que viajan siempre en
la misma lista: `--oro-vivo-degradado` para lo que se recorta contra el
texto y `--oro-plano` para lo que no se puede recortar —un icono dentro de
su círculo, un aro, una manija—.

Aquí vivía además un tercer degradado, `--gradiente-oro-profundo`, con
cuatro tonos a menos de diez puntos del hondo y haciendo su mismo trabajo.
Se retiró: por tenerlos los dos, la misma pieza salía de un oro o de otro
según por qué hoja pasara.

Si hay que cambiar el oro se cambia ahí y en ningún otro sitio: ni el 19 ni
el 15 vuelven a declararlo. La única pieza que a propósito **no** es de oro
es la cinta de Tratamientos (`.cinta-trat`), que va en plata.

**Los botones tienen su propio oro, y es a propósito.** `--gold-500` y
`--gradiente-oro` cambian de tono según la piedra que tengan debajo —sobre
mármol claro bajan al hondo, que es el que aguanta ahí—, y eso servía
para la tipografía pero hacía que no hubiera dos botones iguales en el
sitio. Por eso `01-variables.css` declara además **`--oro-marca: #D4AF37`**
y **`--oro-marca-degradado`**, escritos en hexadecimal y sin que ningún
contexto los vuelva a definir. Son los que usan `.btn` (en el 16) y
`.ns-boton` (en el 20), que son el mismo botón escrito dos veces.

Y son también los que usa la escapatoria del 22 para las **piezas oscuras
dentro de páginas claras** —la barra, el pie, las tarjetas de piedra, las
bandas negras—. Eso último es un arreglo, no un detalle de estilo: la lista
apuntaba a `var(--gradiente-oro)`, pero en una página clara esa variable ya
viene redefinida al hondo desde el 15, así que **la escapatoria no escapaba
de nada** y todo el oro de dentro de esas piezas salía del tono de la piedra
clara en las cuatro páginas interiores. Escrito contra `--oro-marca*`, que
nadie redefine, sale el que toca. Si vuelve a aparecer un oro apagado dentro
de una pieza negra, empezar por ahí.

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
| El formulario del pie | Lo arma `scripts/footer.js` con el nombre y el mensaje que se escriban, y añade la línea de la página web |

**En Galería ya no hay botón debajo de la rejilla.** Tenía su propio mensaje
(«Vi la galería y me gustaría agendar una visita») y estaba a media pantalla
de la banda de cierre, que pide exactamente lo mismo dos veces seguidas; la
rejilla termina ahora en la banda. Si alguna vez vuelve, el mensaje era ese.

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
| `madera.webp` (+ `-960`) | Las cuatro superficies cálidas del sitio, que a propósito son la misma: Testimonios en la portada, el panel de Fundamentos en Nosotros, el hero de Galería y de FAQ, y **la media pantalla del elenco de Nosotros** —donde desde ahora va a la derecha, debajo de la ficha del especialista, y no a la izquierda debajo de su retrato—. Es un wengué de veta vertical, 1920×800; sustituye a la madera anterior y tiene su misma luz (35 de gris de media frente a 38), así que ninguno de los velos que lleva encima hubo que retocarlo. Todas van a opacidad 1 y lo que las diferencia es ese velo: en Testimonios y en los heros de Galería y FAQ apenas se toca —la madera *es* la sección—, y en Fundamentos pesa más, que detrás lleva dos columnas de texto largo. El ajuste vive en la hoja de cada pieza. |
| `onyx.webp` (+ `-960`) | La banda de la pregunta final en Galería, FAQ y Tratamientos (`.banda-cta--onyx`). Sustituye al jardín, que era verde y no pegaba con el oro. **Va retroiluminada**, que es como se pone el ónix de verdad: opacidad 1, un punto más de brillo y ningún velo que la apague. Lo que la hace leerse como una plancha con luz detrás son dos degradados: un foco cálido a media altura escorado a la derecha —donde la piedra ya tiene su veta clara— y un apagado hacia los cantos que va a tierra caliente, no a gris. Con la piedra encendida el texto de la banda es **negro**, igual que sobre el mármol blanco. |
| `jardin-mosaico.webp` (+ `-720`) | Ya no se usa. Estaba en Testimonios y en las bandas de cierre; lo sustituyeron la madera y el ónix. Se deja por si vuelve. |
| `piedra.webp` (+ `-960`) | El hormigón claro que viste **las especialidades pares de Tratamientos** (02 Ortodoncia, 04 Cirugía Oral, 06 Endodoncia, 08 Odontopediatría), para que la página alterne dos superficies en vez de repetir nueve pantallas iguales. Es de grano fino y muy plano —177 de gris de media, con once puntos de recorrido—, así que **encima no lleva velo negro sino una capa de tierra tostada al 12%**: un velo oscuro sobre piedra clara no da piedra oscura, da gris sucio, y además borraría el grano, que es todo lo que esta superficie tiene. La alternancia queda entre dos claros que se distinguen sin agujeros negros: crema a 238 y hormigón a 170. La juntura la marcan dos filos de oro de grosor distinto, 2px arriba y 1px abajo. Sustituye a la pizarra oscura reconstruida con grano que hubo antes, y con ella se fue la versión en negro translúcido del panel: sobre hormigón claro su mármol negro de siempre separa mejor. |
| `marmol-negro.webp` | La portada de Tratamientos, el panel de Fundamentos de Nosotros y el fondo de las tarjetas que llevan `.tarjeta-piedra` dentro: el tríptico, los paneles de tratamiento y la ficha del especialista. Las de valores no, que van en negro con opacidad. |
| `marmol-negro-barra.webp` | La barra de navegación, en las cinco páginas, y las **franjas de piedra** (`.franja-piedra`): los filtros de la Galería, el rótulo de cada bloque de preguntas de FAQ y la reja de las nueve especialidades de Tratamientos. Es una tira recortada del mármol negro, de 1920×130, para no cargar la imagen entera por 60px de alto. |
| `marmol-blanco.webp` | El fondo de todo lo que en el sitio es claro: Nosotros, Tratamientos, Galería y FAQ lo llevan de lienzo de página (`.lienzo-marmol`), y la sección de Nosotros de la portada lo lleva por sección (`.seccion-marmol`). |

---

## Scripts — `scripts/`

El orden de las etiquetas `<script>` también importa: `planificador.js`
tiene que ir primero porque los demás lo usan. **Van todas con `defer`, y
cada página carga solo las suyas** — el cuadro del reparto está en «Qué
carga cada página». `defer` no cambia nada de lo que hacían: ya esperaban
todas a `DOMContentLoaded`, y ahora se descargan mientras el navegador lee
el documento en vez de después.

| Archivo | Qué hace |
|---|---|
| `planificador.js` | El planificador único de scroll (`SmilersScroll`). Un solo listener para todos los efectos, con las lecturas y las escrituras separadas. |
| `navegacion.js` | Navbar (incluido el repliegue al llegar al pie), menú hamburguesa y botón de volver arriba. |
| `revelados.js` | Apariciones al entrar en pantalla, cortinas, paralaje, escenas de salida y **la escena de la pantalla negra de la portada** (`#pnEscena`): saca un progreso de 0 a 1 del recorrido del pin y lo escribe en las variables `--pn-*`. Con el fondo cambia también **quién recibe el ratón** (`--pn-ev-uno` / `--pn-ev-dos`): las dos pantallas ocupan el mismo hueco y la que espera turno está a opacidad 0, pero una capa transparente sigue capturando el clic — por eso los botones de la primera no se encendían ni llevaban a ningún sitio. Solo se apaga —y entonces no toca nada y el bloque se queda apilado— con `prefers-reduced-motion` o sin JS: **el telon va tambien en el movil**. |
| `footer.js` | Contadores, selector de mapa, formulario a WhatsApp y año automático. Deja el contador colgado en `window.SmilersContadores.animar` para poder relanzarlo desde fuera: lo necesita el cierre de Nosotros, donde las cifras viven dentro de un pin y el observador las da por vistas mientras las hojas negras todavía las tapan, de modo que para cuando se abren la cuenta ya había terminado. |
| `subpaginas.js` | Filtros de galería, lightbox, comparador antes/después y acordeón de tratamientos. **Las entradas del menú «Galería › Instalaciones, Equipo…» no son anclas**: no hay ningún elemento con esos identificadores, son el nombre del filtro, y quien lo aplica es `filtrarSegunDireccion`. Desde que hay hero de madera delante, además baja hasta la reja: si no, quien llega desde el menú se queda mirando el hero sin ver que su filtro ya está puesto. Pulsando el filtro a mano no se mueve nada, que ahí ya se está mirando la reja. |
| `secciones.js` | Formas decorativas, acordeón de galería (el de especialidades del inicio y el del equipo en Nosotros), pausa del carrusel y cinta de la banda final. |
| `hero.js` | Carrusel de portada, hero cine, imán de tratamientos, desenfoque, cierre cine y splash. |
| `interiores.js` | El carrusel dorado (`[data-carrusel]`) y las pantallas completas de Nosotros: marca la sección visible y arma el riel de puntos lateral. Solo lo cargan Nosotros y Tratamientos. **Las paradas del riel salen de `.ns-pantalla` o de cualquier elemento con `[data-pantalla]`**, y esa segunda vía es la que usa Tratamientos: sus cinco paradas —portada, tríptico, especialidades, proceso y cierre— son secciones normales que no llevan ni quieren llevar la puesta en escena de `.ns-pantalla`; basta con que digan cómo se llaman. En Nosotros esta parte no corre: allí el riel lo arma `nosotros-cine.js` con sus propias paradas, y esa página no tiene ningún `[data-pantalla]`, así que no salen dos rieles. **Cada carrusel devuelve un mando (`dormir`/`despertar`) y todos quedan en `window.SmilersCarruseles`.** Hacía falta porque su observador de visibilidad no vale dentro de un pin: en Nosotros las dos cintas —la del hero y la de infraestructura— están siempre en pantalla aunque solo se vea una, así que las dos pasaban fotos a la vez durante toda la escena, y la de infraestructura las pasaba **desde el primer fotograma detrás de un `clip-path: inset(100% 0 0 0)`**. Dos cruces de imágenes a pantalla completa corriendo en paralelo, una de ellas invisible. Ahora manda la escena, igual que con el elenco. En Tratamientos no hay escena y sigue mandando el observador, que es lo correcto: allí la cinta sí entra y sale de pantalla de verdad. |
| `nosotros-cine.js` | **Solo lo carga Nosotros, y va el último.** Corre igual en el movil que en el escritorio y lo unico que lo apaga es `prefers-reduced-motion` — salvo el cierre, que **es una escena clavada solo por encima de 992px**: en el telefono la banda de la pregunta se queda en flujo normal, porque dos pines seguidos se cobran una pantalla entera de scroll entre el uno y el otro y esa pantalla se recorria en negro quieto; sin pin, quien la descubre es el propio telon del cine al terminar de subir. De ahi `cierreCabe()` y la bandera `cierreVivo`, que decide tambien si las paradas del riel de esa pieza se miden por progreso o por geometria. Saca dos progresos de 0 a 1 —el de la escena y el del cierre— y los escribe en las variables `--c-*`, `--f-*`, `--i-*` y `--h-*` **solo cuando cambian de valor**, que no es un detalle: una propiedad personalizada se hereda, así que cada escritura invalida el estilo de toda la escena —las cuatro capas, los cuatro retratos del elenco con sus máscaras y las fichas—, y se escribían las dieciocho en cada píxel de scroll. La mitad del recorrido no mueve ninguna (mientras se lee el elenco están todas en su valor final) y el último cuarto mueve seis. El caché se vacía al redimensionar, que ahí los porcentajes miden sobre otra ventana —incluidas `--c-ev-uno` y `--c-ev-dos`, el mismo interruptor de ratón que la portada: el elenco tapaba a la historia y le robaba el «Inicio» de la ruta—; acota el desplazamiento de entrada del panel de fundamentos escribiendo solo el factor (`--f-ent`) y dejando la distancia en el CSS, que en `vw` crecia sin tope y a 2560 sacaba la columna derecha por el canto; mueve el carrusel del elenco, que pasa solo cada tres segundos, tiene una flecha a cada lado del retrato y al que **duerme y despierta la propia escena**, porque dentro del pin la capa está siempre en pantalla aunque no se vea y un observador no serviría —y por lo mismo duerme y despierta **las dos cintas de fotos**, la del hero y la de infraestructura, que corrían las dos a la vez durante toda la escena: ahora corre una cada vez, la del hero hasta que el telón la tapa (.22) y la de infraestructura desde que su capa empieza a subir (.73), con medio recorrido por el medio en el que no corre ninguna—; y arma el riel lateral y reescribe los enlaces del menú, ya que dentro del pin `#historia`, `#fundamentos`, `#equipo` e `#infraestructura` apuntan todos al mismo punto del documento y hay que traducirlos a un sitio del recorrido. Lo mismo al llegar con `#equipo` en la dirección: el navegador ya ha saltado al arranque de la escena antes de que exista este guion, y hay que recolocarlo. |
| `testimonios-esfera.js` | La esfera WebGL de testimonios. Solo la carga `index.html`. |
| `sellar-version.js` | Herramienta. Ver `CACHE.md`. |
| `podar-bootstrap.js` | Herramienta. Recorta Bootstrap a lo que el sitio usa. Ver «Bootstrap va recortado». |
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

Y si añadiste al HTML alguna **clase de Bootstrap** que no se usaba antes:

```bash
node scripts/podar-bootstrap.js
node scripts/sellar-version.js
```

El recorte de Bootstrap solo lleva lo que el sitio nombraba cuando se
generó. Si aparece una clase nueva y no se vuelve a podar, la regla que la
pinta no está y no lo dice nadie.

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
