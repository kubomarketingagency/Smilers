/* ==========================================================================
   SMILERS DENTAL CLINIQUE — JavaScript principal
   Contiene:
     1. Configuración global (número de WhatsApp)
     1b. Planificador único de scroll (un listener + un rAF para todo el
         sitio, con fase de lectura y fase de escritura separadas, y una
         guarda por IntersectionObserver que duerme los efectos lejanos)
     2. Navbar con efecto scroll
     3. Cierre automático del menú en móvil
     4. Botón "volver arriba"
     5. Animaciones de aparición (IntersectionObserver)
     5b. Transición "cierre" entre secciones (paneles tipo obturador)
     5c. Efectos ligados al scroll (paralaje + salida de escena)
     6. Contadores animados de estadísticas
     6b. Selector de mapa (Matriz / Sucursal) en el footer
     7. Formulario del footer -> API de WhatsApp
     8. Año automático en el footer
     9. Galería: filtros por categoría
     10. Galería: lightbox
     11. Comparador antes/después
     12. Paralaje de formas decorativas
     13. FAQ: abrir pregunta enlazada por #hash
     14. Carrusel del hero: sincronizar puntos con el slide activo
     14e. Cierre cine: cortina negra que se levanta antes de la banda CTA
     14f. Oscurecimiento al acercarse a Tratamientos (ambos sentidos)
     15. Splash de bienvenida (retirada; el vídeo lo arranca index.html)
     (la intro de marca en banners de páginas interiores es 100% CSS,
      ver .banner-video-intro / .intro-logo en estilos.css)
   ========================================================================== */

/* ===== 1. CONFIGURACIÓN GLOBAL ==========================================
   IMPORTANTE: escribe el número en formato internacional,
   SIN "+", SIN espacios y SIN guiones.
   Ejemplo Ecuador: 593 + 9 dígitos  ->  '593997556002'
   ======================================================================== */
const NUMERO_WHATSAPP = '593997556002';


/* ===== 1b. PLANIFICADOR ÚNICO DE SCROLL =================================
   El problema que resuelve (era EL cuello de botella del sitio):
   la portada tenía OCHO listeners de "scroll" independientes -navbar,
   botón subir, paralaje, hero cine, auto-scroll asistido, oscurecimiento,
   cierre cine y la esfera de testimonios- y cada uno pedía su PROPIO
   requestAnimationFrame. Dentro de un mismo cuadro el navegador acababa
   ejecutando esa secuencia:

     leer caja (A) -> escribir estilo (A) -> leer caja (B) -> ...

   y cada lectura que viene DESPUÉS de una escritura obliga al navegador a
   rehacer el layout ahí mismo, de forma síncrona, para poder responder.
   Eran ~6 recálculos forzados de layout por cuadro, con la página entera
   como ámbito. En un teléfono eso solo no cabe en los 16.6 ms de un cuadro:
   de ahí la sensación de que el scroll "se traba" y de que la página está
   sobrecargada.

   Aquí hay UN listener, UN rAF y dos fases estrictas: primero corren TODAS
   las lecturas (getBoundingClientRect y compañía) y solo después TODAS las
   escrituras. Con ese orden el layout se calcula una vez por cuadro y ya.

   Uso:
     SmilersScroll.registrar(funcionLeer, funcionEscribir);
     SmilersScroll.registrar(leer, escribir, alRedimensionar, { guarda: el });
     SmilersScroll.pedir();   // forzar un cuadro (p. ej. tras un cambio propio)

   La "guarda" es la segunda mitad de la optimización, y hace falta porque
   la portada mide más de veinte pantallas: sin ella, con el hero en cuadro,
   el planificador seguía llamando en cada cuadro a las lecturas del hero
   cine, de los testimonios y del cierre — tres getBoundingClientRect para
   calcular siempre el mismo 0. Con guarda, un IntersectionObserver duerme
   la entrada mientras su sección esté a más de una pantalla, y el
   planificador le da un cuadro completo justo al entrar y otro justo al
   salir para que su estado final quede escrito. En gama baja son ~2/3 menos
   de trabajo de layout por cuadro durante la mayor parte del recorrido.

   Contrato -importante para quien añada efectos nuevos-:
     · en "leer" SOLO se mide y se guarda en variables propias. Nada de
       tocar estilos, clases ni scrollTo.
     · en "escribir" SOLO se escribe. Nada de volver a medir.
   Romper eso devuelve el thrashing de layout que este bloque elimina. ==== */
var SmilersScroll = (function () {
  /* Cada efecto registrado es una entrada {leer, escribir, activo}. El flag
     "activo" lo mueve un IntersectionObserver cuando el efecto declara una
     sección guarda (ver "registrar"): mientras esa sección está lejos, ni se
     mide ni se escribe. Antes, con el hero en pantalla, el sitio seguía
     llamando a getBoundingClientRect de #testimonios y de #cierreCine en
     CADA cuadro para acabar calculando siempre el mismo 0 — tres lecturas
     de layout por cuadro tiradas a la basura, que en gama baja son la
     diferencia entre 60 y 45 fps. */
  var entradas = [];
  var reinicios = [];
  var pedido = false;
  /* Medidas comunes, tomadas una sola vez por cuadro: window.innerHeight y
     window.scrollY también son lecturas de layout, y antes cada bloque las
     pedía por su cuenta varias veces. */
  var ctx = { y: 0, alto: 0, ancho: 0 };

  function medir() {
    ctx.y = window.scrollY;
    ctx.alto = window.innerHeight || 1;
    ctx.ancho = window.innerWidth || 1;
  }

  function correr() {
    pedido = false;
    medir();

    var i, e;
    for (i = 0; i < entradas.length; i++) {
      e = entradas[i];
      if (e.activo && e.leer) e.leer(ctx);
    }
    for (i = 0; i < entradas.length; i++) {
      e = entradas[i];
      if (e.activo && e.escribir) e.escribir(ctx);
    }
  }

  function pedir() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(correr);
  }

  /* ---- DESLIZAMIENTO PROPIO, Y ABORTABLE -------------------------------
     window.scrollTo({behavior:'smooth'}) NO se puede cancelar: una vez
     lanzado sigue hasta el final aunque el visitante vuelva a tocar la
     pantalla, y su gesto y el del navegador se pelean por el mismo scroll.
     Eso era exactamente lo que hacía que las asistencias de scroll se
     sintieran como si la página tuviera vida propia — y por lo que hubo que
     apagarlas en táctil.

     Aquí el recorrido se anima a mano, cuadro a cuadro, y CUALQUIER gesto
     del visitante (rueda, dedo, tecla, arrastre de la barra) lo aborta en
     el acto. Con eso la página puede volver a acompañar el scroll sin
     quitarle nunca el mando a quien está leyendo. ---------------------- */
  var deslizamiento = null;
  var bloqueadoHasta = 0;
  /* Ventana de gracia justo después de lanzar un recorrido a propósito. La
     necesita cualquier control que navegue desde un evento de puntero -las
     marcas de progreso de Testimonios son el caso- porque el orden real de
     los eventos es: el listener del BOTÓN corre primero (está en el destino)
     y solo después el de window (que está en la fase de burbuja). O sea que
     el propio toque que pide el recorrido llegaría a abortar() un instante
     después de haberlo lanzado, y lo mataría antes del primer cuadro.
     90 ms cubren la ráfaga de un solo gesto -pointerdown, touchstart y el
     mousedown de compatibilidad- sin llegar a ignorar un gesto de verdad:
     un dedo no vuelve a tocar la pantalla tan rápido. */
  var inmuneHasta = 0;

  function abortar() {
    if (Date.now() < inmuneHasta) return;
    document.documentElement.classList.remove('smilers-deslizando');
    if (deslizamiento) {
      deslizamiento.vivo = false;
      /* Y ADEMÁS el imán se aparta un rato. Sin esto, interrumpir un
         encuadre no servía de nada: el gesto lo paraba en seco, sí, pero
         al detenerse el scroll el imán volvía a engancharse y terminaba
         igual el recorrido — medido, se quedaba quieto 0.7s y luego
         completaba los 397px él solo. Que es exactamente la sensación de
         página con vida propia que se quería quitar. Si el visitante
         interrumpió el encuadre es que no lo quería: se le deja el mando. */
      bloqueadoHasta = Date.now() + 1400;
    }
    deslizamiento = null;
  }

  /* "salida" cambia la curva. Sin ella se usa easeInOutCubic, que sale de
     quieto y llega a quieto: es lo que quiere el imán, que actúa cuando el
     visitante YA se ha detenido y no debe notar el empujón. Con ella se usa
     easeOutCubic, que arranca a toda velocidad y frena al final: es lo que
     quiere un control que se acaba de pulsar, donde el movimiento tiene que
     empezar en el mismo instante del toque. Con la curva de entrada suave,
     una pulsación tardaba ~100 ms en producir movimiento visible aunque el
     recorrido hubiera arrancado en el primer cuadro. */
  function deslizarA(destino, duracion, salida) {
    abortar();
    inmuneHasta = Date.now() + 90;   // ver el comentario de "inmuneHasta"
    var inicio = window.scrollY;
    var salto = destino - inicio;
    if (Math.abs(salto) < 2) return;
    document.documentElement.classList.add('smilers-deslizando');
    var d = duracion || 620;
    var t0 = 0;
    var mio = { vivo: true };
    deslizamiento = mio;

    function paso(ahora) {
      if (!mio.vivo) return;
      if (!t0) t0 = ahora;
      var t = Math.min(1, (ahora - t0) / d);
      var e = salida
        /* easeOutCubic: todo el movimiento al principio. */
        ? 1 - Math.pow(1 - t, 3)
        /* easeInOutCubic: sale de quieto y llega a quieto, sin tirón en
           ninguna de las dos puntas. */
        : (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      /* Sin "behavior": la hoja tiene apagado el scroll suave mientras dura
         el recorrido (ver html.smilers-deslizando en estilos.css), así que
         cada scrollTo se aplica en el acto y lo que se ve es exactamente la
         curva que calcula este bucle.

         Aquí antes iba behavior:'auto' pensando que eso forzaba el salto
         inmediato, y era al revés: "auto" significa "usa el scroll-behavior
         del elemento", y el de html es "smooth". O sea que cada cuadro
         lanzaba su propia animación del navegador hacia el punto siguiente y
         lo que salía era un arrastre gomoso que tardaba ~700 ms en empezar a
         moverse -medido-. Es lo que hacía que tocar una marca de Testimonios
         en el teléfono se sintiera como que no había pasado nada. */
      window.scrollTo(0, Math.round(inicio + salto * e));
      if (t < 1) requestAnimationFrame(paso);
      else if (deslizamiento === mio) {
        deslizamiento = null;
        document.documentElement.classList.remove('smilers-deslizando');
      }
    }
    requestAnimationFrame(paso);
  }

  /* ---- IMÁN DE SECCIONES: quién decide adónde ir al detenerse ----------
     Un solo detector de "el scroll ya paró" para todo el sitio, en vez de
     un temporizador por efecto. Cada bloque registra una función que
     recibe la dirección y devuelve la Y a la que le gustaría llevar la
     página, o null si no le toca. Gana la primera que conteste, así que el
     orden de registro es el orden de prioridad y nunca hay dos imanes
     tirando a la vez. */
  var quietos = [];
  var idle = null;
  var direccion = 'down';
  var ultimaDireccionArriba = false;
  var yPrevia = window.scrollY;

  /* Tope común, en fracción de pantalla. Sube de .55 a .9 para que el imán
     sirva de verdad en el gesto para el que se pide: el deslizón rápido que
     va pasando de sección en sección. Con .55, entrar en Tratamientos con un
     flick te dejaba a dos tercios de pantalla del encuadre y el ajuste que
     faltaba se descartaba por pasarse del tope — o sea que el imán solo
     funcionaba si ya habías parado casi encima. Sigue habiendo tope, y sigue
     siendo lo que distingue "terminar de encuadrar" de "llevarte a otro
     sitio": por encima de una pantalla, el imán no toca nada. */
  var SALTO_MAXIMO = .9;

  function alDetenerse() {
    idle = null;
    if (deslizamiento) return;
    if (Date.now() < bloqueadoHasta) return;
    /* SOLO HACIA ABAJO. Subiendo, el visitante está volviendo sobre algo que
       ya vio -a releer una cita, a mirar otra vez una foto- y que la página
       le complete el encuadre ahí se siente como que le quita el mando en el
       momento en que más control quiere. Bajando es al revés: viene
       descubriendo, y terminar de encuadrar la sección a la que llegaba es
       ayuda. Esta única línea cubre todos los imanes del sitio, incluido el
       de testimonios, que vive en otro archivo. */
    if (direccion !== 'down') return;
    for (var i = 0; i < quietos.length; i++) {
      var respuesta = quietos[i](direccion);
      if (respuesta === null || respuesta === undefined) continue;

      /* La respuesta puede ser una Y a secas o {y, maximo}: hay imanes que
         necesitan un tope de salto propio (ver el de testimonios, donde
         entre el centro de una meseta y el de la siguiente hay media
         pantalla larga y el tope común descartaba SIEMPRE el ajuste). */
      var destino = typeof respuesta === 'number' ? respuesta : respuesta.y;
      var tope = (typeof respuesta === 'object' && respuesta.maximo) || SALTO_MAXIMO;
      if (typeof destino !== 'number' || !isFinite(destino)) continue;

      var salto = destino - window.scrollY;
      /* Un imán termina de encuadrar; no te lleva a otra parte de la
         página. Si el ajuste que falta es mayor que su tope, es que el
         visitante quería estar donde está. */
      if (Math.abs(salto) > 4 && Math.abs(salto) < window.innerHeight * tope) {
        /* Recorrido más largo y más plano que antes (era 300 + salto*.75 con
           tope en 820 ms). Ahora que el tope de salto llega a 0.9 de pantalla,
           un encuadre puede ser de 700-800 px, y a la velocidad vieja eso se
           sentía como un tirón: la página salía disparada. Con 1150 ms de
           techo el mismo recorrido se lee como que la sección "se acomoda
           sola", que es lo que se pide — atraer suavemente, no arrastrar. */
        deslizarA(destino, Math.min(1150, 420 + Math.abs(salto) * .95));
      }
      return;
    }
  }

  function alScroll() {
    var y = window.scrollY;
    if (y > yPrevia + 1) direccion = 'down';
    else if (y < yPrevia - 1) direccion = 'up';
    yPrevia = y;
    /* El scroll-snap de Tratamientos solo puede tirar BAJANDO, y el navegador
       no tiene forma de saber el sentido del gesto. Se lo decimos nosotros:
       mientras se sube, esta clase apaga el snap desde la hoja. Se escribe
       solo cuando cambia, para no tocar el DOM en cada cuadro de scroll. */
    var arriba = (direccion === 'up');
    if (arriba !== ultimaDireccionArriba) {
      ultimaDireccionArriba = arriba;
      document.documentElement.classList.toggle('smilers-arriba', arriba);
    }
    pedir();
    if (idle) clearTimeout(idle);
    idle = setTimeout(alDetenerse, 220);
  }

  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', function () {
    for (var i = 0; i < reinicios.length; i++) reinicios[i]();
    pedir();
  });

  /* El gesto del visitante siempre gana. */
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (evt) {
    window.addEventListener(evt, abortar, { passive: true });
  });

  return {
    /* leer/escribir pueden ser null si un efecto solo hace una de las dos
       cosas (el botón "volver arriba", por ejemplo, no mide nada).

       "opciones.guarda" es el elemento que decide si al efecto le toca
       trabajar: mientras esté a más de una pantalla de distancia, la entrada
       queda dormida y no cuesta ni una lectura de layout. Solo tiene sentido
       para efectos cuyo estado depende de UNA sección concreta -el hero cine,
       los testimonios, el cierre-: los globales (navbar, botón subir) se
       registran sin guarda y corren siempre.

       "opciones.alCambiarVisibilidad(dentro)" avisa de ese cambio, que es el
       momento correcto para pedir y soltar el will-change de las piezas que
       ese efecto anima. */
    registrar: function (leer, escribir, alRedimensionar, opciones) {
      var e = { leer: leer || null, escribir: escribir || null, activo: true };
      entradas.push(e);
      if (alRedimensionar) reinicios.push(alRedimensionar);

      var guarda = opciones && opciones.guarda;
      if (!guarda || typeof IntersectionObserver !== 'function') return;

      e.activo = false;
      new IntersectionObserver(function (registros) {
        var dentro = registros[registros.length - 1].isIntersecting;
        if (dentro === e.activo) return;

        /* Tanto al entrar como al salir se corre UN cuadro completo con la
           entrada despierta: al entrar, para que el primer fotograma visible
           no sea el estado viejo; al salir, para dejar escrito el estado
           final (progreso clavado en 0 o en 1) antes de dejar de mirarla.
           Sin ese cuadro de cierre, una sección que se abandona muy rápido
           se quedaba congelada a media transición. */
        e.activo = true;
        medir();
        if (e.leer) e.leer(ctx);
        if (e.escribir) e.escribir(ctx);
        e.activo = dentro;

        if (opciones.alCambiarVisibilidad) opciones.alCambiarVisibilidad(dentro);
      }, { rootMargin: '100% 0px' }).observe(guarda);
    },
    /* fn(direccion) -> Y deseada, o null. Ver el comentario del imán. */
    alDetenerse: function (fn) { quietos.push(fn); },
    deslizarA: deslizarA,
    abortarDeslizamiento: abortar,
    pedir: pedir
  };
})();
window.SmilersScroll = SmilersScroll;


/* Ejecutamos todo cuando el DOM esté listo */
document.addEventListener('DOMContentLoaded', function () {

  /* ===== 2. NAVBAR: fija SIEMPRE, y solo se compacta al bajar ============
     - Umbrales distintos para activar (80px) y desactivar (40px) el modo
       compacto: si usaramos uno solo, el scroll natural del mouse/dedo hace
       que la clase entre y salga varias veces por segundo justo en ese punto,
       y el logo (que cambia de tamaño con .con-scroll) tiembla.
     - YA NO SE ESCONDE AL BAJAR. Antes la barra se retiraba con la direccion
       del scroll (.navbar-oculto) porque era transparente: escondida o no,
       sobre el lienzo onix no cambiaba gran cosa. Con el degradado negro que
       lleva ahora es una barra de verdad, y una barra de verdad que aparece
       y desaparece sola es justo lo que hace que el menu se sienta a dos
       gestos de distancia. Se queda clavada arriba en todo el recorrido.
     - rAF evita correr la lectura/escritura de estilos mas de una vez por
       frame; sin esto, cada evento "scroll" (docenas por segundo) fuerza
       su propio recalculo. */
  const navbar = document.getElementById('navbarPrincipal');
  // Declarado aquí (antes de usarse en controlarNavbar) para que el menú
  // hamburguesa (sección 3, más abajo) y el auto-hide del navbar compartan
  // una sola referencia: mientras el menú está abierto, el navbar (con la
  // X dentro) se queda congelado en su sitio, sin importar si algún scroll
  // residual se cuela pese al overflow:hidden del body.
  const menu = document.getElementById('menuPrincipal');

  /* Solo ESCRIBE (clases). La posición de scroll se la pasa el planificador
     ya medida, así que este bloque no consulta el layout ni una vez. */
  function controlarNavbar(ctx) {
    if (menu.classList.contains('menu-abierto')) return;

    const y = ctx.y;

    if (y > 80) {
      navbar.classList.add('con-scroll');
    } else if (y < 40) {
      navbar.classList.remove('con-scroll');
    }
  }

  SmilersScroll.registrar(null, controlarNavbar);
  SmilersScroll.pedir(); // por si la página carga ya desplazada


  /* ===== 3. MENÚ HAMBURGUESA (pantalla completa, todos los dispositivos) ==
     Implementación propia (no el Collapse de Bootstrap): el panel ahora
     cubre todo el viewport (ver estilos.css), así que bloqueamos el scroll
     del body mientras está abierto — evita que el fondo se desplace detrás
     del desenfoque — y controlarNavbar() (sección 2) se congela mientras
     "menu-abierto" siga puesto, así que la X nunca se mueve ni desaparece
     mientras el panel sigue desplegado. ("menu" ya se declaró en la
     sección 2, para que controlarNavbar() lo pueda leer.) ============= */
  const botonMenu = document.querySelector('.navbar-toggler');
  const enlacesMenu = document.querySelectorAll('#menuPrincipal .nav-link, #menuPrincipal .btn');

  function alternarMenu(forzarCerrado) {
    const abierto = menu.classList.contains('menu-abierto');
    const nuevoEstado = forzarCerrado ? false : !abierto;
    menu.classList.toggle('menu-abierto', nuevoEstado);
    botonMenu.setAttribute('aria-expanded', String(nuevoEstado));
    document.body.style.overflow = nuevoEstado ? 'hidden' : '';
  }

  if (botonMenu) {
    botonMenu.addEventListener('click', function () { alternarMenu(); });
  }

  enlacesMenu.forEach(function (enlace) {
    enlace.addEventListener('click', function () { alternarMenu(true); });
  });


  /* ===== 4. BOTÓN "VOLVER ARRIBA" ===================================== */
  const btnSubir = document.getElementById('btnSubir');
  let btnSubirVisible = null;

  /* Va en la fase de ESCRITURA del planificador: no mide nada (la posición
     se la dan hecha) y la clase solo se toca cuando el estado cambia de
     verdad, no en cada uno de los cientos de eventos de scroll. */
  SmilersScroll.registrar(null, function (ctx) {
    const debeVerse = ctx.y > 400;
    if (debeVerse === btnSubirVisible) return;
    btnSubirVisible = debeVerse;
    btnSubir.classList.toggle('visible', debeVerse);
  });

  btnSubir.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  /* ===== 5. ANIMACIÓN DE APARICIÓN AL HACER SCROLL ====================
     Bidireccional: aparece con un pequeño escalonado al bajar y se retira
     al subir. Se guarda el temporizador pendiente por elemento para poder
     cancelarlo si el usuario invierte el scroll antes de que llegue a
     dispararse.
     Umbral con "histéresis" (threshold: [0, 0.15]) + un pequeño "debounce"
     al ocultar: en un scroll lento la relación de intersección de un
     elemento puede rebotar un par de veces justo alrededor del 0% o el 15%
     en fracciones de segundo — con solo la histéresis eso todavía alcanzaba
     a quitar y volver a poner "visible" varias veces seguidas, viéndose
     como un parpadeo/glitch en el párrafo. Ahora "ocultar" no pasa de
     inmediato: espera 400ms, y si el elemento vuelve a cruzar el 15% en ese
     lapso (el rebote), el ocultamiento se cancela y el texto ni se entera. */
  const elementosRevelar = document.querySelectorAll('.revelar');
  const temporizadoresOcultarRevelar = new WeakMap(); // "ocultar" pendiente (debounce)

  /* will-change promueve el elemento a su propia capa de composición, y en
     la portada hay 29 .revelar: sostener todas esas capas a la vez es
     memoria de vídeo que se le quita al scroll. Por eso la hoja de estilos
     YA NO lo declara (lo hacía, y las capas nacían con la página); se pide
     aquí justo antes de revelar u ocultar cada pieza y se suelta en cuanto
     su transición termina — que es el único momento correcto: hacerlo desde
     ".visible" lo quitaría justo cuando la animación arranca. */
  const CAPA_REVELAR = 'transform, opacity';

  function soltarCapa(evento) {
    if (evento.target !== this) return;      // no por las transiciones de los hijos
    this.style.willChange = 'auto';
  }

  elementosRevelar.forEach(function (el) {
    el.addEventListener('transitionend', soltarCapa);
  });

  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        /* AVISO para quien añada variantes de .revelar: no escondas el
           elemento observado con clip-path. Un clip-path sobre el propio
           elemento deja su intersectionRatio en 0 aunque esté a la vista, y
           esta comparación deja de cumplirse para siempre. Le pasó a
           .revelar--velo: las fotos del mosaico de Nosotros no aparecían
           nunca. La solución está en el CSS — el recorte se aplica al hijo,
           no al elemento observado. */
        const razon = entrada.intersectionRatio;

        if (razon >= 0.15) {
          const ocultarPendiente = temporizadoresOcultarRevelar.get(entrada.target);
          if (ocultarPendiente) {
            clearTimeout(ocultarPendiente);
            temporizadoresOcultarRevelar.delete(entrada.target);
          }

          if (!entrada.target.classList.contains('visible')) {
            /* Sin escalonado propio. Antes esto esperaba "indice * 100 ms",
               donde indice era la posición del elemento DENTRO DEL LOTE que
               el observador entregara en ese momento: un número que cambia
               según cuántos elementos crucen el umbral a la vez y en qué
               orden los reporte el navegador. Con hasta 25 .revelar en la
               portada eso son esperas de hasta 2.5s, distintas en cada
               pasada, que se sumaban encima de los retrasos que el CSS ya
               define — de ahí que la cascada se viera a destiempo. El
               escalonado ahora es solo el del CSS (--retraso en línea y las
               reglas .row > .revelar:nth-child), que es fijo y está escrito
               a propósito. */
            entrada.target.style.willChange = CAPA_REVELAR;
            entrada.target.classList.add('visible');
          }
        } else if (razon === 0) {
          if (!temporizadoresOcultarRevelar.has(entrada.target)) {
            const idOcultar = setTimeout(function () {
              entrada.target.style.willChange = CAPA_REVELAR;  // la salida también la necesita
              entrada.target.classList.remove('visible');
              temporizadoresOcultarRevelar.delete(entrada.target);
            }, 400);
            temporizadoresOcultarRevelar.set(entrada.target, idOcultar);
          }
        }
      });
    }, { threshold: [0, 0.15], rootMargin: '0px 0px -8% 0px' });

    elementosRevelar.forEach(function (el) { observador.observe(el); });
  } else {
    // Fallback para navegadores antiguos: se muestra todo directamente
    elementosRevelar.forEach(function (el) { el.classList.add('visible'); });
  }


  /* ===== 5b. TRANSICIÓN "CIERRE" ENTRE SECCIONES ======================
     Cada .cortina cubre su sección con un plano que se desvanece/desenfoca
     (ver .cortina-panel en estilos.css). Bidireccional: se cierra de nuevo
     si la sección sale de pantalla, y se reabre al volver a entrar.
     data-retraso-ms (opcional, ej. la intro de Especialidades) hace que se
     quede quieta ese tiempo antes de abrirse, en vez de abrirse de inmediato.
     Misma histéresis + debounce que en .revelar (ver comentario arriba):
     solo se abre al cruzar el umbral, y "cerrar" espera 400ms por si el
     rebote de un scroll lento la hace cruzar el umbral de nuevo enseguida
     — así un scroll lento no la abre y cierra de golpe varias veces. */
  const cortinas = document.querySelectorAll('.cortina');
  const retrasosCortina = new WeakMap();  // "abrir" pendiente (data-retraso-ms)
  const cierresCortina = new WeakMap();   // "cerrar" pendiente (debounce)

  if ('IntersectionObserver' in window) {
    const obsCortinas = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.intersectionRatio === 0) {
          const pendiente = retrasosCortina.get(entrada.target);
          if (pendiente) {
            clearTimeout(pendiente);
            retrasosCortina.delete(entrada.target);
          }

          if (!cierresCortina.has(entrada.target)) {
            const idCierre = setTimeout(function () {
              entrada.target.classList.remove('abierta');
              cierresCortina.delete(entrada.target);
            }, 400);
            cierresCortina.set(entrada.target, idCierre);
          }
          return;
        }

        if (entrada.intersectionRatio < 0.1) return;

        const cierrePendiente = cierresCortina.get(entrada.target);
        if (cierrePendiente) {
          clearTimeout(cierrePendiente);
          cierresCortina.delete(entrada.target);
        }

        if (entrada.target.classList.contains('abierta')) return;

        const retraso = Number(entrada.target.dataset.retrasoMs || 0);
        const pendiente = retrasosCortina.get(entrada.target);
        if (retraso > 0) {
          if (pendiente) clearTimeout(pendiente);
          const id = setTimeout(function () {
            entrada.target.classList.add('abierta');
          }, retraso);
          retrasosCortina.set(entrada.target, id);
        } else {
          entrada.target.classList.add('abierta');
        }
      });
    }, { threshold: [0, 0.1], rootMargin: '0px 0px -5% 0px' });

    cortinas.forEach(function (el) { obsCortinas.observe(el); });
  } else {
    cortinas.forEach(function (el) { el.classList.add('abierta'); });
  }


  /* ===== 5c. EFECTOS LIGADOS AL SCROLL =================================
     Un SOLO listener y un SOLO requestAnimationFrame para los dos efectos
     que dependen de la posición de scroll en la portada. Antes eran dos
     bloques con su propio listener y su propio rAF: cada uno leía
     getBoundingClientRect por su cuenta, o sea dos rondas de cálculo de
     layout por cuadro, que en móvil es justo lo que hace que el scroll se
     "trabe". Aquí se leen todas las cajas primero y se escriben todos los
     estilos después, que es el orden que evita el layout thrashing.

     a) data-parallax="N" — la pieza se desplaza N píxeles en vertical a lo
        largo de su recorrido por la pantalla. Con valores de distinto signo
        y magnitud, las piezas del mosaico de "Nosotros" se separan unos
        píxeles y se vuelven a alinear, que es lo que da la profundidad.
        Solo en escritorio con puntero fino: en táctil el scroll no emite
        eventos de forma continua (iOS los agrupa), así que el paralaje se
        ve a saltos en vez de fluido — mejor no tenerlo que tenerlo mal.
        Por eso esas piezas entran con .revelar--velo (clip-path) y no con
        la variante normal: si usaran transform, el valor inline de aquí lo
        pisaría a media animación.

     b) data-escena-salida — la ENTRADA de una sección ya la resuelve
        .revelar pieza por pieza; la salida no existía, la sección
        simplemente se iba hacia arriba. Ahora se retira (se desvanece y
        sube) según cuánto le queda de pantalla a su borde inferior. Sin
        escalado a propósito: un scale sobre un bloque de texto obliga al
        navegador a rasterizarlo a otro tamaño y en iOS deja el texto
        borroso hasta que la capa se recompone.

     El listener es passive y está limitado a un rAF por cuadro. =========== */
  const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const haceParallax = punteroFino && window.matchMedia('(min-width: 992px)').matches;
  const piezasParallax = haceParallax ? document.querySelectorAll('[data-parallax]') : [];
  /* La salida de escena la pinta el CSS solo con puntero fino (ver
     .escena-salida en estilos.css): en táctil ni siquiera hace falta
     calcular las variables. */
  const escenasSalida = punteroFino ? document.querySelectorAll('[data-escena-salida]') : [];

  if ((piezasParallax.length || escenasSalida.length)
      && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    /* Las medidas de la fase de lectura se dejan aquí y la fase de escritura
       las consume. Antes las dos fases vivían dentro de la misma función y
       eso ya evitaba el thrashing DENTRO de este bloque; ahora, al pasar por
       el planificador, tampoco lo provoca con los demás efectos del sitio. */
    const escrituras = [];

    function leerEfectosScroll(ctx) {
      const alto = ctx.alto;
      const tramoSalida = alto * 0.5;   // el retiro ocupa la mitad baja de la pantalla
      escrituras.length = 0;

      piezasParallax.forEach(function (pieza) {
        const caja = pieza.getBoundingClientRect();
        if (caja.bottom < -220 || caja.top > alto + 220) return;
        // -1 = el centro entra por abajo; 0 = a media pantalla; 1 = sale por arriba
        const progreso = ((caja.top + caja.height / 2) / alto - 0.5) * -2;
        const fuerza = Number(pieza.dataset.parallax || 0);
        escrituras.push([pieza, 'parallax', progreso * fuerza]);
      });

      escenasSalida.forEach(function (escena) {
        const caja = escena.getBoundingClientRect();
        if (caja.top > alto || caja.bottom < -100) return;
        escrituras.push([escena, 'salida', Math.min(1, Math.max(0, caja.bottom / tramoSalida))]);
      });
    }

    function escribirEfectosScroll() {
      escrituras.forEach(function (orden) {
        const el = orden[0];
        if (orden[1] === 'parallax') {
          el.style.transform = 'translate3d(0,' + orden[2].toFixed(2) + 'px,0)';
        } else {
          // Redondeado a dos decimales: mientras la sección esté entera en
          // pantalla el factor se queda en 1 y deja de escribirse.
          const f = Number(orden[2].toFixed(2));
          if (el.__escenaF === f) return;
          el.__escenaF = f;
          el.style.setProperty('--escena-op', String(f));
          el.style.setProperty('--escena-y', (-(1 - f) * 55).toFixed(1) + 'px');
        }
      });
    }

    SmilersScroll.registrar(leerEfectosScroll, escribirEfectosScroll);
    SmilersScroll.pedir();
  }


  /* ===== 6. CONTADORES ANIMADOS DE ESTADÍSTICAS =======================
     Se reproduce cada vez que la franja entra en pantalla (no solo la
     primera): al salir, el número vuelve a 0 para que el próximo ingreso
     se sienta igual de impactante. "runId" por elemento invalida cualquier
     rAF de una corrida anterior que siga en el aire (ej. si el usuario
     entra y sale muy rápido) para que dos animaciones no escriban a la vez
     sobre el mismo número. ==================================================== */
  const contadores = document.querySelectorAll('[data-contador]');
  const runIdContador = new WeakMap();

  function animarContador(elemento) {
    const idPropio = (runIdContador.get(elemento) || 0) + 1;
    runIdContador.set(elemento, idPropio);

    const objetivo = parseInt(elemento.dataset.contador, 10);
    const duracion = 1600;              // milisegundos
    const inicio = performance.now();

    function paso(ahora) {
      if (runIdContador.get(elemento) !== idPropio) return; // otra corrida la reemplazó
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      elemento.textContent = Math.floor(progreso * objetivo).toLocaleString('es-MX');
      if (progreso < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  if ('IntersectionObserver' in window) {
    const obsContadores = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          animarContador(entrada.target);
        } else {
          runIdContador.set(entrada.target, (runIdContador.get(entrada.target) || 0) + 1);
          entrada.target.textContent = '0';
        }
      });
    }, { threshold: 0.5 });

    contadores.forEach(function (c) { obsContadores.observe(c); });
  }


  /* ===== 6b. SELECTOR DE MAPA (MATRIZ / SUCURSAL) EN EL FOOTER ========= */
  const mapaTabs = document.querySelectorAll('.mapa-tab');
  const mapaIframes = document.querySelectorAll('.mapa-iframe');

  mapaTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const sede = tab.dataset.mapa;

      mapaTabs.forEach(function (t) {
        t.classList.toggle('activo', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      mapaIframes.forEach(function (frame) {
        frame.classList.toggle('activo', frame.dataset.mapa === sede);
      });
    });
  });


  /* ===== 7. FORMULARIO DEL FOOTER -> API DE WHATSAPP ==================
     Captura Nombre y Mensaje, valida, arma el texto y abre wa.me
     ==================================================================== */
  const formulario = document.getElementById('formWhatsapp');
  const aviso = document.getElementById('formAviso');

  if (formulario) {
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault(); // evita que la página se recargue

      const campoNombre = document.getElementById('nombre');
      const campoMensaje = document.getElementById('mensaje');

      const nombre = campoNombre.value.trim();
      const mensaje = campoMensaje.value.trim();

      // --- Limpiamos estados previos ---
      campoNombre.classList.remove('error');
      campoMensaje.classList.remove('error');
      aviso.className = 'form-aviso';
      aviso.textContent = '';

      // --- Validación simple ---
      let hayErrores = false;

      if (nombre.length < 2) {
        campoNombre.classList.add('error');
        hayErrores = true;
      }
      if (mensaje.length < 5) {
        campoMensaje.classList.add('error');
        hayErrores = true;
      }

      if (hayErrores) {
        aviso.classList.add('error');
        aviso.textContent = 'Por favor completa tu nombre y un mensaje válido.';
        return;
      }

      // --- Construcción del mensaje preescrito ---
      // %0A = salto de línea codificado para URL
      const texto =
        '¡Hola Smilers Dental Clinique! 👋\n\n' +
        'Mi nombre es: ' + nombre + '\n' +
        'Mensaje: ' + mensaje + '\n\n' +
        'Enviado desde el sitio web.';

      // encodeURIComponent codifica espacios, saltos de línea, emojis y acentos
      const url = 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto);

      // --- Abrimos WhatsApp en una pestaña nueva ---
      window.open(url, '_blank');

      // --- Confirmación visual y reseteo del formulario ---
      aviso.classList.add('exito');
      aviso.textContent = '¡Listo! Abrimos WhatsApp para enviar tu mensaje.';
      formulario.reset();

      // El aviso desaparece después de 6 segundos
      setTimeout(function () {
        aviso.className = 'form-aviso';
        aviso.textContent = '';
      }, 6000);
    });
  }


  /* ===== 8. AÑO AUTOMÁTICO EN EL FOOTER =============================== */
  const anio = document.getElementById('anioActual');
  if (anio) anio.textContent = new Date().getFullYear();


  /* ===== 9. GALERÍA: FILTROS POR CATEGORÍA (solo en galeria.html) ===== */
  const botonesFiltro = document.querySelectorAll('.filtro-btn');
  const itemsGaleria = document.querySelectorAll('.item-galeria-grande');

  if (botonesFiltro.length && itemsGaleria.length) {
    botonesFiltro.forEach(function (boton) {
      boton.addEventListener('click', function () {
        botonesFiltro.forEach(function (b) { b.classList.remove('activo'); });
        boton.classList.add('activo');

        const categoria = boton.dataset.filtro;

        itemsGaleria.forEach(function (item) {
          item.classList.remove('aparecer');
          const coincide = categoria === 'todos' || item.dataset.categoria === categoria;

          if (coincide) {
            item.classList.add('mostrar');
            // Pequeño retardo para permitir la transición de opacidad/escala
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { item.classList.add('aparecer'); });
            });
          } else {
            item.classList.remove('mostrar');
          }
        });
      });
    });
  }


  /* ===== 10. GALERÍA: LIGHTBOX con el modal de Bootstrap =============== */
  const modalLightboxEl = document.getElementById('modalLightbox');
  const disparadoresLightbox = document.querySelectorAll('[data-lightbox-src]');

  if (modalLightboxEl && disparadoresLightbox.length) {
    const imagenModal = modalLightboxEl.querySelector('img');
    const leyendaModal = modalLightboxEl.querySelector('.lightbox-leyenda');
    const modalBootstrap = new bootstrap.Modal(modalLightboxEl);

    disparadoresLightbox.forEach(function (disparador) {
      disparador.addEventListener('click', function (evento) {
        evento.preventDefault();
        imagenModal.src = disparador.dataset.lightboxSrc;
        imagenModal.alt = disparador.dataset.lightboxAlt || '';
        leyendaModal.textContent = disparador.dataset.lightboxAlt || '';
        modalBootstrap.show();
      });
    });
  }


  /* ===== 11. COMPARADOR ANTES / DESPUÉS =================================
     El cursor "raya" la imagen: en mouse basta con pasar por encima
     (sin necesidad de mantener el clic); en táctil se arrastra con el dedo.
     El <input type="range"> queda sincronizado para teclado/lectores de
     pantalla.
     ======================================================================== */
  document.querySelectorAll('[data-comparador]').forEach(function (contenedor) {
    const marco = contenedor.querySelector('.comparador-marco');
    const rango = contenedor.querySelector('.comparador-rango');
    if (!marco || !rango) return;

    function fijarPosicion(porcentaje) {
      const acotado = Math.min(100, Math.max(0, porcentaje));
      marco.style.setProperty('--pos', acotado + '%');
      rango.value = acotado;
    }

    function porcentajeDesdeEvento(evento) {
      const rect = marco.getBoundingClientRect();
      const x = evento.clientX - rect.left;
      return (x / rect.width) * 100;
    }

    marco.addEventListener('pointerdown', function (evento) {
      fijarPosicion(porcentajeDesdeEvento(evento));
    });
    marco.addEventListener('pointermove', function (evento) {
      // En mouse reacciona con solo pasar el cursor; en táctil/pluma
      // solo mientras hay contacto (pressure > 0).
      if (evento.pointerType === 'mouse' || evento.pressure > 0) {
        fijarPosicion(porcentajeDesdeEvento(evento));
      }
    });

    rango.addEventListener('input', function () {
      fijarPosicion(Number(rango.value));
    });
  });


  /* ===== 11b. ACORDEÓN DE TRATAMIENTOS (solo móvil, tratamientos.html) ===
     En escritorio/tablet el botón está oculto por CSS y esto no hace nada.
     En móvil, cada bloque abre/cierra de forma independiente (no exclusiva,
     se pueden tener varios abiertos a la vez). */
  document.querySelectorAll('.acordeon-tratamiento-boton').forEach(function (boton) {
    var panel = document.getElementById(boton.getAttribute('aria-controls'));
    if (!panel) return;

    boton.addEventListener('click', function () {
      var abierto = panel.classList.toggle('abierta');
      boton.setAttribute('aria-expanded', String(abierto));
    });

    /* SI SE LLEGA ENLAZADO A ESTE TRATAMIENTO, SE ABRE SOLO.
       El acordeón de la portada manda a #periodoncia, #endodoncia y los otros
       siete. En escritorio da igual -el panel está siempre abierto y el botón
       ni se ve-, pero en móvil el visitante aterrizaba en la fila cerrada del
       tratamiento que acababa de elegir y tenía que volver a tocarla: dos
       gestos para una cosa que ya había pedido. Mismo criterio que la pregunta
       enlazada de FAQ, en la sección 13. */
    if (window.location.hash && window.location.hash.slice(1) === panel.id.replace(/^panel-/, '')) {
      panel.classList.add('abierta');
      boton.setAttribute('aria-expanded', 'true');
    }
  });


  /* ===== 12. PARALAJE SUAVE DE FORMAS DECORATIVAS AL MOVER EL CURSOR ===== */
  const formasParallax = document.querySelectorAll('.forma-parallax');

  if (formasParallax.length && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
      && window.matchMedia('(pointer: fine)').matches) {
    let ultimoFrame = null;

    document.addEventListener('mousemove', function (evento) {
      if (ultimoFrame) return; // limita a 1 actualización por frame
      ultimoFrame = requestAnimationFrame(function () {
        const xRelativo = (evento.clientX / window.innerWidth) - 0.5;
        const yRelativo = (evento.clientY / window.innerHeight) - 0.5;

        formasParallax.forEach(function (forma) {
          const intensidad = Number(forma.dataset.intensidad || 18);
          forma.style.transform = 'translate(' + (xRelativo * intensidad) + 'px, ' + (yRelativo * intensidad) + 'px)';
        });

        ultimoFrame = null;
      });
    });
  }


  /* ===== 12b. ACORDEÓN DE ESPECIALIDADES ==============================
     Puerto en JS puro de un acordeón de imágenes: el panel activo (hover,
     foco de teclado, o tap) se expande y muestra título + descripción.
     En pantallas sin hover confiable (táctiles), el primer tap solo activa
     el panel (sin navegar); un segundo tap sobre el panel ya activo sí
     sigue el enlace — así se puede "ojear" cada especialidad antes de
     entrar a su tratamiento. ======================================== */
  (function () {
    var galeria = document.getElementById('acordeonEspecialidades');
    if (!galeria) return;

    var paneles = Array.prototype.slice.call(galeria.querySelectorAll('.ag-panel'));
    if (!paneles.length) return;

    var tieneHoverFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function activar(panel) {
      paneles.forEach(function (p) {
        var activo = p === panel;
        p.classList.toggle('ag-panel--activo', activo);
        if (activo) p.setAttribute('aria-current', 'true');
        else p.removeAttribute('aria-current');
      });
    }

    paneles.forEach(function (panel, indice) {
      // El listener de "focus" solo se ata en dispositivos con hover fino
      // (mouse/trackpad): en táctil, un tap dispara "focus" ANTES que
      // "click", así que si activara el panel aquí, el click de abajo ya
      // lo encontraba "activo" y navegaba de una vez en el primer toque
      // en vez de solo revelarlo — justo el bug reportado. En touch, el
      // propio click de abajo es el único que decide.
      if (tieneHoverFino) {
        panel.addEventListener('mouseenter', function () { activar(panel); });
        panel.addEventListener('focus', function () { activar(panel); });
      }

      panel.addEventListener('click', function (evento) {
        // En dispositivos sin hover fino, el primer tap solo revela el
        // panel; hace falta un segundo tap (ya activo) para navegar.
        if (!tieneHoverFino && !panel.classList.contains('ag-panel--activo')) {
          evento.preventDefault();
          activar(panel);
        }
      });

      panel.addEventListener('keydown', function (evento) {
        var siguiente = null;
        if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
          siguiente = paneles[(indice + 1) % paneles.length];
        } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
          siguiente = paneles[(indice - 1 + paneles.length) % paneles.length];
        }
        if (siguiente) {
          evento.preventDefault();
          activar(siguiente);
          siguiente.focus();
        }
      });
    });
  })();


  /* ===== 12b-bis. EL CARRUSEL DEL HERO SE PARA FUERA DE PANTALLA =======
     Bootstrap lo deja ciclando para siempre: cada 4.2s dispara un crossfade
     de 1.9s entre dos fotos a pantalla completa con filtro, y lo sigue
     haciendo aunque uno esté leyendo el pie de página. Con el observador se
     detiene al salir de vista y retoma al volver. ==================== */
  (function () {
    var heroCarrusel = document.getElementById('heroCarrusel');
    if (!heroCarrusel || !window.bootstrap || !('IntersectionObserver' in window)) return;

    var instancia = bootstrap.Carousel.getOrCreateInstance(heroCarrusel);

    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) instancia.cycle();
        else instancia.pause();
      });
    }, { rootMargin: '100px 0px' }).observe(heroCarrusel);
  })();


  /* ===== 12c. MARQUEE DE LA BANDA CTA ==================================
     Arma en JS las columnas de la cinta (en vez de fijas en el HTML): con
     un set fijo de 4 columnas el ancho no alcanzaba a cubrir pantallas
     anchas, y a mitad del loop (translateX acercándose a -50%) se veía un
     hueco negro antes de que la copia siguiente entrara por la derecha —
     las fotos "desaparecían" un instante en vez de desplazarse siempre
     continuas. Aquí se mide el ancho real de la ventana y se repiten las
     columnas las veces que hagan falta para que el set (mitad de la
     cinta) sea SIEMPRE más ancho que la pantalla, con margen de sobra —
     condición necesaria para que el truco "duplicar + trasladar -50%" del
     CSS (@keyframes banda-cta-marquee) haga un loop sin costura en
     cualquier monitor. Corre una sola vez al cargar: un carrusel de fondo
     no necesita recalcularse en cada resize. */
  (function () {
    var cinta = document.getElementById('bandaCtaMasonryCinta');
    if (!cinta) return;

    /* Las URLs vienen del atributo data-fotos del HTML, no de una lista aquí.
       Dos razones: (1) el sellado de versión recorre los HTML, así que ahí
       las URLs llevan su "?v=hash" y una foto reemplazada llega de verdad
       al visitante pese al "immutable" del CDN; (2) las columnas miden
       190-220px, así que se listan directamente las variantes de 480px
       (imagenes/*-480.webp) — pedir el original de 1920 era decodificar
       ~10 MB de mapa de bits por foto para pintarla del tamaño de un pulgar,
       y aquí hay doce columnas duplicadas, detrás de un velo oscuro.
       Se agrupan de tres en tres: cada grupo es una columna de la cinta. */
    var fotos = (cinta.dataset.fotos || '')
      .split(',')
      .map(function (u) { return u.trim(); })
      .filter(Boolean);
    if (!fotos.length) return;

    var grupos = [];
    for (var g = 0; g < fotos.length; g += 3) grupos.push(fotos.slice(g, g + 3));

    function crearColumna(grupo) {
      var col = document.createElement('div');
      col.className = 'banda-cta-masonry__col';
      grupo.forEach(function (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        col.appendChild(img);
      });
      return col;
    }

    // Ancho de columna + gap: coincide con .banda-cta-masonry__col en
    // estilos.css (190px + 6px de gap; 220px + 6px desde el breakpoint lg).
    var anchoColumna = window.matchMedia('(min-width: 992px)').matches ? 226 : 196;
    // 1.6x el ancho de ventana: margen de sobra para que un resize
    // moderado (o un monitor más ancho de lo esperado) no vuelva a dejar
    // el set corto, sin necesidad de escuchar "resize" para un fondo
    // puramente decorativo.
    var anchoNecesario = window.innerWidth * 1.6;

    var set = [];
    var anchoSet = 0;
    var indice = 0;
    while (anchoSet < anchoNecesario) {
      set.push(grupos[indice % grupos.length]);
      anchoSet += anchoColumna;
      indice++;
    }

    // Set A + copia idéntica A': el mismo truco de loop sin costura,
    // ahora con un set garantizado más ancho que la pantalla.
    set.concat(set).forEach(function (grupo) {
      cinta.appendChild(crearColumna(grupo));
    });

    /* La cinta se para cuando la banda no está en pantalla. Es una capa de
       composición de varias pantallas de ancho, llena de fotos, animándose
       sin parar: mantenerla viva mientras uno está leyendo la portada le
       roba trabajo al scroll sin que nadie la vea. animation-play-state
       congela el fotograma actual, así que al volver retoma donde iba en
       lugar de saltar al principio. */
    if ('IntersectionObserver' in window) {
      cinta.style.animationPlayState = 'paused';
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          cinta.style.animationPlayState = entrada.isIntersecting ? 'running' : 'paused';
        });
      }, { rootMargin: '200px 0px' }).observe(cinta.parentNode || cinta);
    }
  })();


  /* ===== 13. FAQ: abre automáticamente la pregunta enlazada por #hash === */
  if (window.location.hash) {
    const objetivo = document.querySelector(window.location.hash);
    if (objetivo && objetivo.classList.contains('accordion-collapse')) {
      const colapsable = new bootstrap.Collapse(objetivo, { toggle: true });
      objetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }


  /* ===== 14. CARRUSEL DEL HERO =============================================
     Sin puntos ni flechas visibles: el fondo es puramente el video/las fotos
     en blanco y negro. Aquí solo queda la preferencia de movimiento.

     AQUÍ HABÍA un "destello" dorado que barría el hero en cada cambio de
     foto. Retirado por encargo junto con las partículas de 14b: el banner
     pasa a una estética sobria, sin efectos de luz.
     ======================================================================== */
  const heroCarrusel = document.getElementById('heroCarrusel');

  if (heroCarrusel) {
    /* WCAG 2.2.2 (Pausar, detener, ocultar): el carrusel se auto-avanza cada
       5,5 s. Quien ha pedido menos movimiento en su sistema no debe recibir
       contenido que cambia solo; el carrusel se detiene en el primer slide y
       los puntos siguen funcionando para navegarlo a mano. */
    var menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

    function aplicarPreferenciaMovimiento() {
      var instancia = bootstrap.Carousel.getInstance(heroCarrusel)
                   || new bootstrap.Carousel(heroCarrusel);
      if (menosMovimiento.matches) {
        instancia.pause();
      } else {
        instancia.cycle();
      }
    }

    aplicarPreferenciaMovimiento();
    menosMovimiento.addEventListener('change', aplicarPreferenciaMovimiento);
  }


  /* ===== 14b. (RETIRADO) HERO: partículas doradas ========================
     Aquí vivía un <canvas> que dibujaba motas de luz dorada alrededor del
     wordmark: nacían junto a la palabra, subían despacio y se apagaban. Se
     retira por encargo -"los destellos se ven muy exagerados"- y con él se
     va lo más caro que tenía la portada en el arranque: un lienzo que se
     borraba y se repintaba en cada cuadro mientras el carrusel hacía
     crossfade y el ken-burns escalaba la foto.

     Si algún día se quiere recuperar, está entero en el historial de git
     (commit 456ec7f, "destellos contenidos y toque instantaneo").
     ======================================================================== */


  /* ===== 14c. HERO CINE: pin + fundido controlado por scroll ============
     Imita el mecanismo del banner de depaudental.com: el hero queda fijo
     en pantalla (position:sticky en CSS) mientras el contenedor
     ".hero-cine" (más alto que el viewport) se desplaza detrás; aquí solo
     calculamos qué tan avanzado está ese desplazamiento (0 a 1) y lo
     traducimos en opacidad para fundir la etapa 1 (fotos en B/N) hacia la
     etapa 2 (mosaico + titular). Con prefers-reduced-motion el CSS ya deja
     todo estático y este script ni se ejecuta. ========================= */
  (function () {
    var envoltorio = document.getElementById('heroCine');
    var etapa1 = document.getElementById('heroEtapa1');
    var etapa2 = document.getElementById('heroEtapa2');
    if (!envoltorio || !etapa1 || !etapa2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var heroTitulo = etapa1.querySelector('.hero-titulo');
    var columnas = etapa2.querySelectorAll('.hero-etapa2-col');
    var tagline = etapa2.querySelector('.hero-etapa2-tagline');
    var ultimoProgresoCine = -1;
    /* Lo que mide la fase de lectura y consume la de escritura. */
    var progresoCine = 0;
    var alturaDesplazableCine = 0;

    /* Desenfoque más contenido en táctil: el de 20px se aplica sobre columnas
       de foto a pantalla completa y hay que re-dibujarlas en cada cuadro. */
    var BLUR_SALIDA = window.matchMedia('(hover: none) and (pointer: coarse)').matches ? 8 : 20;

    /* Mismo corte que el @media de estilos.css donde .hero-etapa2 pasa de
       fila flex a rejilla 2x2. Se vuelve a leer al redimensionar. */
    var mqRejilla = window.matchMedia('(max-width: 767.98px)');
    var esRejilla = mqRejilla.matches;

    function acotar(valor) { return Math.min(1, Math.max(0, valor)); }

    /* Escribe una propiedad solo si de verdad cambió. Antes este bloque
       reescribía una decena de estilos por columna en CADA cuadro de scroll
       de TODA la página, incluida la "zona de estancia" del pin en la que
       por definición no se mueve nada; y flexGrow, además, obliga a rehacer
       el layout en cada escritura. Con la caché, mientras el valor no cambia
       no se toca el DOM. */
    var ultimoEstilo = new WeakMap();

    function fijar(el, prop, valor) {
      var previos = ultimoEstilo.get(el);
      if (!previos) { previos = {}; ultimoEstilo.set(el, previos); }
      if (previos[prop] === valor) return;
      previos[prop] = valor;
      el.style[prop] = valor;
    }

    /* FASE DE LECTURA: solo mide. Es la única función de este bloque a la
       que se le permite tocar el layout. */
    function leerCine(ctx) {
      var rect = envoltorio.getBoundingClientRect();
      alturaDesplazableCine = envoltorio.offsetHeight - ctx.alto;
      progresoCine = alturaDesplazableCine > 0
        ? acotar(-rect.top / alturaDesplazableCine)
        : 0;
    }

    /* FASE DE ESCRITURA: solo escribe estilos, con la medida ya tomada. */
    function actualizarCine() {
      var progreso = progresoCine;

      /* Si el progreso no se movió (pin quieto, o la sección ya quedó atrás y
         sigue clavada en 1) no hay nada que escribir. */
      if (progreso === ultimoProgresoCine) return;
      ultimoProgresoCine = progreso;

      // Presupuesto del recorrido (0 a 1), con una zona de "estancia" real
      // en el medio (48%-80%) para que la sección de profesionales se
      // pueda ver completa en vez de que la entrada y la salida se sientan
      // consecutivas: cae el wordmark -> se apaga la etapa 1 -> entra el
      // acordeón de profesionales -> ESTANCIA -> se desenfoca y se suelta.
      // .hero-cine ahora es más alto (ver estilos.css) para que cada tramo
      // tenga suficiente distancia real de scroll y no se sienta atropellado.

      // El wordmark "Smilers" cae y se desvanece primero.
      if (heroTitulo) {
        var caidaTitulo = acotar((progreso - .08) / .30);
        fijar(heroTitulo, 'opacity', String(1 - caidaTitulo));
        fijar(heroTitulo, 'transform', 'translateY(' + (caidaTitulo * 150).toFixed(1) + 'px)');
      }

      // Etapa 1 (fotos) se desvanece justo después, del 24% al 36%.
      var salida1 = acotar((progreso - .24) / .12);
      fijar(etapa1, 'opacity', String(1 - salida1));

      // Etapa 2 entra del 34% al 58%: se alarga a propósito (antes 34%-48%)
      // para que las columnas de profesionales se vean aparecer una por una
      // con calma en vez de sentirse un golpe rápido — más dinámico y legible.
      var entrada2 = acotar((progreso - .34) / .24);

      // ...se queda completa y quieta del 58% al 80% (zona de estancia,
      // sin animación) para poder verla y leer la frase con calma...
      // ...y del 80% al 100% sale escalonada hacia el lado CONTRARIO al que
      // entró (si entró subiendo, sale deslizándose de lado) y se difumina
      // columna por columna, en vez de un corte seco — la sección de abajo
      // (Nosotros, usada como "cuerpo" con más contenido) va apareciendo
      // detrás mientras esto se disuelve.
      var salida2 = acotar((progreso - .80) / .20);
      fijar(etapa2, 'opacity', String(entrada2));

      columnas.forEach(function (col, indice) {
        // Escalonado más marcado entre columnas (antes .12) para que se
        // note claramente cómo van apareciendo una tras otra, no casi juntas.
        var propio = acotar((entrada2 - indice * .16) / (1 - indice * .16 || 1));
        // La salida se escalona en el orden CONTRARIO al de entrada (la
        // última columna en entrar es la primera en irse), para que se
        // sienta como un movimiento distinto y no un simple "reversa".
        var indiceSalida = columnas.length - 1 - indice;
        var salidaPropia = acotar((salida2 - indiceSalida * .15) / (1 - indiceSalida * .15 || 1));

        fijar(col, 'opacity', String(propio * (1 - salidaPropia)));
        fijar(col, 'transform', 'translateY(' + ((1 - propio) * 40).toFixed(1) + 'px) translateX(' + (salidaPropia * -70).toFixed(1) + 'px)');
        // Cadena vacía cuando no hay salida, NO "blur(0px)": dejar la
        // propiedad puesta mantiene viva la capa de filtro.
        fijar(col, 'filter', salidaPropia > 0 ? 'blur(' + (salidaPropia * BLUR_SALIDA).toFixed(1) + 'px)' : '');
        // Efecto acordeón: cada columna arranca angosta y se "despliega"
        // hasta su ancho pleno en vez de solo aparecer en su sitio. Es la
        // única escritura de este bloque que dispara layout, de ahí que se
        // redondee a dos decimales: así deja de escribirse en cuanto la
        // columna llega a su ancho, en vez de en cada cuadro.
        //
        // En móvil ni se escribe: allí .hero-etapa2 es una rejilla 2x2 (ver
        // estilos.css, 5b) y flex-grow no significa nada en grid. Se seguía
        // escribiendo igual, o sea que en el teléfono -el aparato que menos
        // margen tiene- se estaban disparando cuatro recálculos de layout
        // por cuadro durante toda la entrada del mosaico para no mover
        // absolutamente nada en pantalla.
        if (!esRejilla) fijar(col, 'flexGrow', (.12 + propio * .88).toFixed(2));
      });

      if (tagline) {
        var propioTag = acotar((entrada2 - .3) / .7);
        fijar(tagline, 'opacity', String(propioTag * (1 - salida2)));
        fijar(tagline, 'transform', 'translateY(' + ((1 - propioTag) * 24 + salida2 * -30).toFixed(1) + 'px)');
        // Borrosa -> nítida al entrar, y vuelve a desenfocarse al salir.
        var blurTag = Math.max((1 - propioTag) * 16, salida2 * 16);
        fijar(tagline, 'filter', blurTag > .1 ? 'blur(' + blurTag.toFixed(1) + 'px)' : '');
      }
    }

    /* Las cuatro columnas del mosaico piden capa de composición propia
       mientras el hero está en cuadro, y la sueltan al salir. Se hace desde
       aquí y no desde la hoja de estilos por el mismo criterio que .revelar
       (ver estilos.css, sección 13): un will-change permanente sobre cuatro
       fotos a pantalla completa deja esas texturas reservadas en la GPU
       durante toda la visita, incluido el arranque, que es justo el peor
       momento. En un teléfono de gama baja esa reserva es la diferencia
       entre que la entrada de las columnas vaya fluida o a tirones. */
    function pedirCapas(dentro) {
      var valor = dentro ? 'transform, opacity' : '';
      for (var i = 0; i < columnas.length; i++) columnas[i].style.willChange = valor;
      if (heroTitulo) heroTitulo.style.willChange = valor;
      if (tagline) tagline.style.willChange = valor;
    }

    SmilersScroll.registrar(leerCine, actualizarCine, function () {
      esRejilla = mqRejilla.matches;
      ultimoProgresoCine = -1;   // el layout cambió: hay que reescribir aunque el progreso sea el mismo
    }, { guarda: envoltorio, alCambiarVisibilidad: pedirCapas });
    SmilersScroll.pedir();


    /* ===== 14d. IMÁN DE TRATAMIENTOS, SEGUNDO TRAMO ====================
       El anclaje de Tratamientos lo hace ahora el navegador con scroll-snap
       (ver estilos.css, "2b"), que es lo que pedía el encargo y además es
       mejor: se resuelve en el compositor, no aquí.

       PERO NO LLEGA SOLO, y esto hay que medirlo para saberlo. Con
       "proximity" Chromium solo ancla si la posición de snap está a menos de
       0.3 pantallas — unos 270px en una ventana de 900. Medido: parando la
       sección a 380px de encuadrarla, el snap no mueve nada. O sea que cubre
       el último tercio del gesto y nada más.

       Así que este bloque se queda para el tramo largo: cuando el scroll para
       de verdad (220ms) con la sección ya entrando pero lejos de encuadrar,
       termina el encuadre él. Los dos no se pisan: para cuando esto corre, el
       snap ya actuó si le tocaba, y si dejó la sección encuadrada la salida
       temprana de "rect.top <= 4" hace que aquí no se haga nada.

         · CSS  (scroll-snap)  -> últimos ~270px, en el compositor
         · JS   (este bloque)  -> el resto, al detenerse el scroll

       QUÉ SECCIÓN LLEVA IMÁN, Y CUÁL NO
         · Hero: NINGUNO. Es un scrub de 4.6 pantallas; dentro de una
           animación continua no hay "sección siguiente" que encuadrar.
         · Nosotros: NINGUNO, por encargo. Es la sección de leer.
         · Tratamientos: SÍ. Ocupa una pantalla exacta.
         · Testimonios: SÍ, uno por meseta, en testimonios-esfera.js.

       La dirección la comprueba el planificador antes de llamar aquí: solo
       hacia abajo. Con "menos movimiento" no se registra nada.
       ==================================================================== */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var especialidades = document.getElementById('especialidades');

    /* "Ya me ocupé de esta zona": evita que el imán vuelva a tirar en cuanto
       el visitante se detiene otra vez dentro del mismo tramo. Se rearma al
       salir de la sección por completo. */
    var hechoTratamientos = false;

    SmilersScroll.alDetenerse(function () {
      if (!especialidades) return null;
      /* Solo desde 992px, igual que el snap de la hoja: por debajo la sección
         crece con su contenido y no hay una pantalla exacta que encuadrar. */
      if (!window.matchMedia('(min-width: 992px)').matches) return null;

      var rect = especialidades.getBoundingClientRect();
      var alto = window.innerHeight;
      var visible = Math.min(rect.bottom, alto) - Math.max(rect.top, 0);
      var proporcion = visible / rect.height;

      /* Fuera de la sección: se rearma para la próxima pasada. */
      if (proporcion < .06) {
        hechoTratamientos = false;
        return null;
      }
      if (proporcion <= .22 || proporcion >= .96) return null;
      if (hechoTratamientos) return null;
      if (rect.top <= 4) return null;   // ya la pasamos (o ya la encuadró el snap)

      hechoTratamientos = true;
      return rect.top + window.scrollY;
    });

  })();


  /* ===== 14f. DESENFOQUE AL ACERCARSE A TRATAMIENTOS ====================
     Capa fija (.acercamiento-negro) que se desenfoca mientras el acordeón de
     Tratamientos SE ACERCA, y que está apagada del todo cuando la sección ya
     llena la pantalla — antes el máximo caía justo en top≈0, es decir
     exactamente cuando uno está viendo el acordeón: el velo se quedaba
     encima y opacaba todas las fotos. Ahora el pico ocurre a media pantalla
     de distancia y baja a 0 antes de entrar. Como es función continua de la
     posición, se comporta igual subiendo que bajando. */
  (function () {
    var especialidadesOsc = document.getElementById('especialidades');
    var capaNegra = document.getElementById('acercamientoNegro');
    if (!especialidadesOsc || !capaNegra) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var tOsc = 99;   // lo mide la fase de lectura

    function acotarOsc(valor) { return Math.min(1, Math.max(0, valor)); }

    /* Distancia normalizada del borde superior de la sección: 1 = una
       pantalla completa por debajo, 0 = pegado al tope (sección en cuadro). */
    var LEJOS  = 1;    // más allá de esto no hay velo
    var PICO   = .45;  // punto de máximo desenfoque (acercándose)
    var DENTRO = .15;  // a partir de aquí ya estamos "dentro": velo apagado

    /* El backdrop-filter de una capa fija a pantalla completa es de lo más
       caro que se le puede pedir a un móvil: obliga a recomponer TODO lo que
       queda debajo en cada cuadro. Peor aún, en Safari de iOS esa capa se
       queda viva aunque se le ponga "none" y el desenfoque se queda
       encendido sobre toda la página — el bug reportado: la portada entera
       borrosa, con los botones flotantes (z-index 1040, por encima de esta
       capa) como lo único nítido. Así que en pantallas chicas el velo solo
       oscurece, sin desenfocar; y cuando el progreso llega a 0 la capa se
       oculta con visibility, que sí desmonta la capa de composición. */
    var usarDesenfoque = window.matchMedia('(min-width: 992px)').matches;
    var ultimoProgresoOsc = -1;

    function leerAcercamiento(ctx) {
      tOsc = especialidadesOsc.getBoundingClientRect().top / ctx.alto;
    }

    function actualizarAcercamiento() {
      var t = tOsc;
      var progresoOsc;

      if (t >= LEJOS || t <= DENTRO) {
        progresoOsc = 0;                              // lejos, o ya adentro
      } else if (t > PICO) {
        progresoOsc = acotarOsc((LEJOS - t) / (LEJOS - PICO));   // 0 -> 1
      } else {
        progresoOsc = acotarOsc((t - DENTRO) / (PICO - DENTRO)); // 1 -> 0
      }

      /* Fuera de la zona de acercamiento el progreso se queda clavado en 0
         y no hay nada que escribir; sin esta salida temprana el bloque
         tocaba la capa en cada cuadro de scroll de toda la página. */
      if (progresoOsc === ultimoProgresoOsc) return;
      ultimoProgresoOsc = progresoOsc;

      capaNegra.style.opacity = String(progresoOsc * .5);

      if (progresoOsc <= .01) {
        /* Apagado: no basta con "none" en el filtro (ver arriba), hace falta
           sacar la capa del árbol de pintado. */
        capaNegra.style.visibility = 'hidden';
        capaNegra.style.webkitBackdropFilter = 'none';
        capaNegra.style.backdropFilter = 'none';
      } else {
        capaNegra.style.visibility = 'visible';
        if (usarDesenfoque) {
          var desenfoque = 'blur(' + (progresoOsc * 8).toFixed(1) + 'px)';
          capaNegra.style.webkitBackdropFilter = desenfoque;
          capaNegra.style.backdropFilter = desenfoque;
        } else {
          capaNegra.style.webkitBackdropFilter = 'none';
          capaNegra.style.backdropFilter = 'none';
        }
      }
    }

    SmilersScroll.registrar(leerAcercamiento, actualizarAcercamiento, function () {
      usarDesenfoque = window.matchMedia('(min-width: 992px)').matches;
      ultimoProgresoOsc = -1;
    });
    SmilersScroll.pedir();
  })();


  /* ===== 14e. CIERRE CINE: la cortina negra se levanta con el scroll =====
     Simétrico a 14c: en vez de fundir una foto hacia el negro, aquí el
     negro se desvanece para revelar la banda CTA que ya está armada
     debajo. Misma técnica (progreso 0-1 según cuánto se recorrió el pin),
     nada más que aplicada a una sola capa en vez de varias etapas. */
  (function () {
    var envoltorio = document.getElementById('cierreCine');
    var negro = document.getElementById('cierreCineNegro');
    var banda = document.getElementById('bandaCta');
    var contenido = document.querySelector('#bandaCta .banda-cta-contenido');
    if (!envoltorio || !negro) return;

    /* Desenfoque más contenido en táctil: es un filtro sobre una sección a
       pantalla completa y hay que rehacerlo en cada cuadro del revelado. */
    var BLUR_REVELADO = window.matchMedia('(hover: none) and (pointer: coarse)').matches ? 7 : 16;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ultimoProgresoCierre = -1;
    var progresoCierre = 0;   // lo mide la fase de lectura

    function acotar(valor) { return Math.min(1, Math.max(0, valor)); }

    function leerCierre(ctx) {
      var rect = envoltorio.getBoundingClientRect();
      var alturaDesplazable = envoltorio.offsetHeight - ctx.alto;
      progresoCierre = alturaDesplazable > 0 ? acotar(-rect.top / alturaDesplazable) : 0;
    }

    function actualizarCierre() {
      var progreso = progresoCierre;

      /* Mientras el pin no se mueve -o ya quedó atrás, con el progreso
         clavado en 1- no hay nada que escribir. */
      if (progreso === ultimoProgresoCierre) return;
      ultimoProgresoCierre = progreso;

      // 0%-62%: la cortina negra se desvanece, descubriendo la banda CTA.
      // 62%-100%: ya revelada del todo, se sostiene hasta soltar el pin.
      //
      // Ya no hay tramo de espera en negro al principio, y es a propósito.
      // Este pin recibe la pantalla YA en negro: el obturador de Testimonios
      // se cierra del todo un poco antes de soltar su propio pin, así que
      // cuando este empieza no hay nada que "esperar" — el negro con el que
      // arranca la cortina enlaza sin costura con el que acaba de dejar la
      // sección anterior. Todo tramo de espera que se pusiera aquí se
      // SUMARÍA a ese negro heredado, y era lo que hacía que la banda de
      // contacto pareciera no llegar nunca.
      //
      // El reparto ha ido 30/60 sobre 90vh -> 12/72 sobre 50vh -> 0/55 sobre
      // 35vh -> 0/46 sobre 22vh -> 0/62 sobre 6vh. El revelado en vh reales:
      // 27 -> 30 -> 19 -> 10 -> 3.7. Menos distancia, sí, y a propósito: es
      // la contrapartida de que el obturador de Testimonios tarde MÁS en
      // cerrarse. Cerrar despacio se lee como un gesto; abrir despacio, como
      // una espera. Así que el telón baja con calma y lo de detrás aparece de
      // golpe. Su otra mitad es la cola de Testimonios (UNIDADES.cola en
      // testimonios-esfera.js), que bajó de 12 unidades a 2.
      //
      // Y LA CURVA YA NO ES LINEAL. Con 3.7vh de recorrido, un fundido lineal
      // arranca y termina en seco: el negro empieza a levantarse en el primer
      // píxel de scroll con toda su velocidad y se planta de golpe al llegar
      // al final. Smootherstep (6t^5-15t^4+10t^3) deja la primera Y LA
      // SEGUNDA derivada en cero en las dos puntas, así que el difuminado
      // sale de la nada y se posa, sin que se vea el instante en que empieza
      // ni el que acaba. Es la misma curva con la que se cierran las hojas
      // del obturador de arriba, que es lo que encadena los dos gestos.
      // Rápido en distancia, suave en forma: eso es lo que se pidió.
      var t = acotar(progreso / .62);
      var revelado = t * t * t * (t * (t * 6 - 15) + 10);
      negro.style.opacity = String(1 - revelado);

      /* La banda sale del desenfoque a la vez que el negro se levanta: las
         dos hojas de Testimonios entregan la pantalla en negro y de ese
         negro la siguiente sección se va enfocando, en vez de aparecer ya
         nítida detrás de un fundido. */
      if (banda) {
        var desenfoque = (1 - revelado) * BLUR_REVELADO;
        banda.style.filter = desenfoque > .15 ? 'blur(' + desenfoque.toFixed(1) + 'px)' : '';
      }

      if (contenido) {
        contenido.style.opacity = String(revelado);
        contenido.style.transform = 'translateY(' + ((1 - revelado) * 30).toFixed(1) + 'px)';
      }
    }

    /* Guarda: mientras el cierre esté a más de una pantalla, este bloque
       no mide ni escribe nada. Es el efecto que más se notaba dormido de
       balde — vive al final del documento, o sea que durante TODO el
       recorrido de la portada estaba calculando un progreso que valía 0. */
    SmilersScroll.registrar(leerCierre, actualizarCierre, function () {
      ultimoProgresoCierre = -1;
    }, {
      guarda: envoltorio,
      alCambiarVisibilidad: function (dentro) {
        /* La capa negra y el contenido de la banda animan opacidad y
           transform durante todo el revelado; se les da capa propia mientras
           dura y se les quita al salir. Al .banda-cta NO se le pide nada: ya
           lleva un blur() escrito cuadro a cuadro, que crea su propia capa,
           y sumarle will-change solo duplicaría la reserva. */
        var valor = dentro ? 'opacity' : '';
        negro.style.willChange = valor;
        if (contenido) contenido.style.willChange = dentro ? 'opacity, transform' : '';
      }
    });
    SmilersScroll.pedir();
  })();


  /* ===== 15. SPLASH DE BIENVENIDA: CUÁNDO SE RETIRA =====================
     El vídeo NO se arranca aquí: lo pone en marcha el <script> en línea que
     va junto al elemento, al principio del <body> de index.html, para que
     empiece a bajar mientras el navegador todavía lee el HTML. Aquí solo se
     decide cuándo apartar la pantalla.

     POR QUÉ CAMBIÓ ESTA PARTE
     Antes había topes de tiempo fijos contados desde DOMContentLoaded: si a
     los 1200 ms el vídeo no podía reproducirse, fuera; y a los 3800 ms,
     fuera igual. En escritorio nunca se notó, pero en un teléfono con datos
     el vídeo ni siquiera se había empezado a pedir a esa altura (el src se
     asignaba justo aquí, después de Bootstrap y de este mismo archivo), así
     que el primer tope saltaba siempre: la intro no se veía NUNCA en móvil.
     Ahora los seguros cuentan desde que se abrió la página -no desde que
     llegó este script- y, una vez que el clip arranca de verdad, se le deja
     exactamente lo que le falta de duración en vez de un tope arbitrario
     que lo cortaba a la mitad.
     ======================================================================== */
  (function () {
    var splash = document.getElementById('splashInicio');
    if (!splash || document.documentElement.classList.contains('sin-splash')) return;

    try { sessionStorage.setItem('smilersSplashVisto', '1'); } catch (e) {}

    var video = splash.querySelector('video');
    var retirado = false;
    var temporizadores = [];

    function esperar(ms, fn) { temporizadores.push(setTimeout(fn, ms)); }

    function retirarSplash() {
      if (retirado) return;
      retirado = true;
      temporizadores.forEach(clearTimeout);
      splash.classList.add('oculto');
      setTimeout(function () { splash.remove(); }, 700); // = duración del fundido en CSS
    }

    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      retirarSplash();
      return;
    }

    /* Red de seguridad: si el <script> en línea no llegó a correr (por lo que
       sea), el src se pone aquí y no se pierde la intro. */
    if (!video.getAttribute('src')) {
      video.src = window.matchMedia('(max-width: 767.98px)').matches
        ? video.dataset.srcMovil
        : video.dataset.srcEscritorio;
      video.muted = true;
      video.playbackRate = 1.3;
    }

    /* El navegador rechazó el autoplay: no tiene sentido tapar el sitio con
       una pantalla negra que no va a mostrar nada. */
    if (video.dataset.autoplayBloqueado) { retirarSplash(); return; }

    video.addEventListener('ended', retirarSplash);
    video.addEventListener('error', retirarSplash);

    /* Milisegundos transcurridos desde que se abrió la página (no desde que
       corrió este archivo, que es lo que antes descuadraba las cuentas). */
    function desdeLaApertura() {
      return (window.performance && performance.now) ? performance.now() : 0;
    }

    /* Cuando el clip está corriendo de verdad, el splash vive lo que le
       queda de duración más un margen para el fundido. Así no se corta a la
       mitad porque el vídeo empezó tarde. */
    var arranco = false;
    function marcarArranque() {
      if (arranco) return;
      arranco = true;
      var restante = isFinite(video.duration) ? Math.max(0, video.duration - video.currentTime) : 4;
      esperar(restante / (video.playbackRate || 1) * 1000 + 500, retirarSplash);
    }
    video.addEventListener('playing', marcarArranque);
    /* Y 'timeupdate' como red: en un escritorio rápido el clip ya viene
       rodando cuando llega este archivo, o sea que 'playing' YA pasó y no
       vuelve a dispararse nunca. Sin esta segunda vía el seguro de abajo
       daría el vídeo por no arrancado y cortaría la intro a la mitad.
       'timeupdate' en cambio sigue llegando varias veces por segundo
       mientras el clip avanza. */
    video.addEventListener('timeupdate', marcarArranque);

    /* Seguro 1 — arranque. Si a los 2.6 s de abierta la página el vídeo ni
       siquiera ha empezado (conexión muy lenta, navegador in-app que traga
       el autoplay sin avisar), se aparta y se entra al sitio: mejor sin
       intro que esperando. El margen mínimo de 500 ms es para el caso en que
       este archivo llegue tarde y esos 2.6 s ya hayan pasado — el vídeo, que
       se pidió al principio del HTML, entonces ya está a punto de arrancar. */
    esperar(Math.max(500, 2600 - desdeLaApertura()), function () {
      if (!arranco) retirarSplash();
    });

    /* Seguro 2 — tope duro, por si "ended" no llega nunca (p. ej. el clip se
       queda congelado a media reproducción por falta de datos). */
    esperar(Math.max(1000, 9000 - desdeLaApertura()), retirarSplash);

    /* Reintento: normalmente ya está reproduciéndose desde el HTML. Si sigue
       en pausa, se intenta una vez más antes de rendirse. */
    if (video.paused && !video.ended) {
      var intento = video.play();
      if (intento && typeof intento.catch === 'function') intento.catch(retirarSplash);
    }
  })();

});