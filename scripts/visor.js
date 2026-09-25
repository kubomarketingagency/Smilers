(function () {
  'use strict';

  /* =========================================================================
     El visor de fotos: el de la Galeria y el de las fotos de cada
     especialidad (Tratamientos). Uno solo para las dos paginas, con su
     marcado (`#visorFotos`) y sus estilos (33-visor.css).

     Abre la foto a pantalla entera sobre un velo casi negro, y la descubre
     como entran las fotos del collage: una cortina de oro la tapa y se retira
     hacia el otro lado, la foto se asienta desde un poco mas cerca y el filo
     de oro se dibuja alrededor, con el marco desplazado detras. Debajo, su
     leyenda; arriba, la cuenta («02 / 05») y la X, en una barra propia que
     tapa la de la pagina en vez de montarse encima de ella.

     Se pasa de foto con las flechas, con el teclado o deslizando el dedo, y
     cada cambio vuelve a pasar la cortina: la foto nueva se pide antes, se
     cambia mientras la cortina la tapa y aparece ya cargada.

     Que se abre y en que grupo:
       - En Tratamientos, cada foto del collage (`.tz-mosaico__pieza`, un
         enlace a su version grande) con las demas de su especialidad.
       - En la Galeria, cada foto (`.galeria-item-lb`, con la grande en
         `data-lightbox-src` y la leyenda en `data-lightbox-alt`) con todas las
         que deja a la vista el filtro que este puesto.

     Sin este guion, la de Tratamientos abre la foto sola en el navegador,
     que tambien sirve. La Galeria usaba el `Modal` de Bootstrap: eran 60 KB
     de guion solo para esto, y ya no los carga.
     ========================================================================= */

  var visor = document.getElementById('visorFotos');
  if (!visor) return;

  var PIEZAS = '.tz-mosaico__pieza, .galeria-item-lb';

  var marco = visor.querySelector('.visor__marco');
  var foto = visor.querySelector('.visor__foto');
  var leyenda = visor.querySelector('.visor__leyenda');
  var cuenta = visor.querySelector('.visor__cuenta');
  var botonCerrar = visor.querySelector('[data-visor-cerrar]');
  var botonAnt = visor.querySelector('[data-visor-ant]');
  var botonSig = visor.querySelector('[data-visor-sig]');
  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

  var grupo = [];
  var indice = 0;
  var abierto = false;
  var foco = null;
  var relojCierre = 0;
  var turno = 0;

  /* Lo que duran la salida del visor y la primera mitad de la cortina, las
     mismas cifras que el CSS. */
  var SALIDA = 420;
  var TAPA = 430;

  function fuenteDe(pieza) {
    return pieza.getAttribute('data-lightbox-src') || pieza.getAttribute('href');
  }
  function textoDe(pieza) {
    var escrito = pieza.getAttribute('data-lightbox-alt');
    if (escrito) return escrito;
    var miniatura = pieza.querySelector('img');
    return miniatura ? miniatura.alt : '';
  }
  /* Las del collage van con las de su especialidad; las de la Galeria, con
     todas las que el filtro deja a la vista (una escondida no tiene cajas). */
  function grupoDe(pieza) {
    var lista = pieza.classList.contains('tz-mosaico__pieza')
      ? pieza.parentNode.querySelectorAll('.tz-mosaico__pieza')
      : document.querySelectorAll('.galeria-item-lb');
    return Array.prototype.filter.call(lista, function (el) {
      return el === pieza || el.getClientRects().length > 0;
    });
  }
  function dos(n) { return (n < 10 ? '0' : '') + n; }

  /* Pide la foto y avisa cuando esta, o a los 1,6 segundos si no llega: no
     se deja a nadie mirando una cortina de oro indefinidamente. */
  function precargar(fuente, listo) {
    var imagen = new Image();
    var hecho = false;
    function fin() {
      if (hecho) return;
      hecho = true;
      listo();
    }
    imagen.onload = imagen.onerror = fin;
    imagen.src = fuente;
    if (imagen.complete) fin();
    setTimeout(fin, 1600);
  }

  function escribir() {
    var pieza = grupo[indice];
    var texto = textoDe(pieza);
    foto.src = fuenteDe(pieza);
    foto.alt = texto;
    leyenda.textContent = texto;
    cuenta.textContent = grupo.length > 1 ? dos(indice + 1) + ' / ' + dos(grupo.length) : '';
  }

  function reiniciar(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }

  function pintar(nuevo, primera) {
    var n = grupo.length;
    indice = (nuevo + n) % n;
    var mio = ++turno;
    var varias = n > 1;
    botonAnt.hidden = !varias;
    botonSig.hidden = !varias;
    visor.classList.add('visor--cargando');

    precargar(fuenteDe(grupo[indice]), function () {
      if (mio !== turno) return;
      visor.classList.remove('visor--cargando');

      /* Sin animaciones, el cambio es de golpe. */
      if (quietud.matches) {
        escribir();
        marco.classList.remove('visor--oculta');
        return;
      }

      /* La primera vez la foto se pone ya, escondida, para que el marco tome
         su medida antes de que llegue la cortina; en los cambios, la de antes
         se queda a la vista hasta que la cortina la tapa. */
      if (primera) {
        marco.classList.add('visor--oculta');
        escribir();
      }
      marco.classList.remove('visor--destapa');
      reiniciar(marco, 'visor--tapa');
      setTimeout(function () {
        if (mio !== turno) return;
        if (!primera) escribir();
        marco.classList.remove('visor--oculta', 'visor--tapa');
        reiniciar(marco, 'visor--destapa');
      }, TAPA);
    });

    /* La siguiente y la anterior, ya pedidas: pasar de una a otra no espera. */
    if (varias) {
      [indice + 1, indice - 1].forEach(function (i) {
        new Image().src = fuenteDe(grupo[(i + n) % n]);
      });
    }
  }

  function abrir(piezas, desde) {
    clearTimeout(relojCierre);
    grupo = piezas;
    foco = document.activeElement;
    esconderPuntero();

    if (!abierto) {
      abierto = true;
      /* El scroll se bloquea sin que la pagina salte de lado: el ancho de la
         barra que se quita se devuelve en relleno. */
      var barra = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.classList.add('visor-abierto');
      if (barra > 0) document.body.style.paddingRight = barra + 'px';
      visor.hidden = false;
      void visor.offsetWidth;
      visor.classList.add('visor--abierto');
      document.addEventListener('keydown', teclado);
    }
    pintar(desde, true);
    botonCerrar.focus({ preventScroll: true });
  }

  function cerrar() {
    if (!abierto) return;
    abierto = false;
    turno++;
    visor.classList.remove('visor--abierto');
    document.removeEventListener('keydown', teclado);
    relojCierre = setTimeout(function () {
      visor.hidden = true;
      marco.classList.remove('visor--tapa', 'visor--destapa', 'visor--oculta');
      foto.removeAttribute('src');
      leyenda.textContent = '';
      cuenta.textContent = '';
      document.documentElement.classList.remove('visor-abierto');
      document.body.style.paddingRight = '';
      if (foco && foco.focus) foco.focus({ preventScroll: true });
    }, SALIDA);
  }

  /* El teclado: Esc cierra, las flechas pasan de foto y el tabulador no sale
     del visor, que detras esta la pagina entera y no se ve. */
  function teclado(ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); cerrar(); return; }
    if (ev.key === 'ArrowRight' && grupo.length > 1) { ev.preventDefault(); pintar(indice + 1); return; }
    if (ev.key === 'ArrowLeft' && grupo.length > 1) { ev.preventDefault(); pintar(indice - 1); return; }
    if (ev.key !== 'Tab') return;
    var botones = [botonCerrar, botonAnt, botonSig].filter(function (b) { return !b.hidden; });
    var i = botones.indexOf(document.activeElement);
    ev.preventDefault();
    var siguiente = ev.shiftKey ? i - 1 : i + 1;
    botones[(siguiente + botones.length) % botones.length].focus();
  }

  document.addEventListener('click', function (ev) {
    var pieza = ev.target.closest && ev.target.closest(PIEZAS);
    if (!pieza) return;
    /* En el collage cada foto es un enlace de verdad: con Ctrl o Cmd, o con
       la rueda, se respeta abrirla aparte. Las de la Galeria no llevan
       direccion (`#`), asi que ahi no hay nada que respetar. */
    var esEnlace = pieza.classList.contains('tz-mosaico__pieza');
    if (esEnlace && (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey)) return;
    ev.preventDefault();
    var piezas = grupoDe(pieza);
    abrir(piezas, Math.max(0, piezas.indexOf(pieza)));
  });

  botonCerrar.addEventListener('click', cerrar);
  botonAnt.addEventListener('click', function () { pintar(indice - 1); });
  botonSig.addEventListener('click', function () { pintar(indice + 1); });

  /* Fuera de la foto se cierra: el clic que cae en el velo, en la barra o
     en el aire de alrededor, no en la foto ni en la leyenda. */
  visor.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t === visor || t.hasAttribute('data-visor-fondo')
        || t.classList.contains('visor__escena') || t.classList.contains('visor__barra')) {
      cerrar();
    }
  });

  /* Y en el telefono se pasa de foto deslizando el dedo. Solo un gesto
     claramente de lado: uno vertical es alguien que quiere cerrar o que se
     equivoco, y no cambia nada. */
  var inicioX = 0;
  var inicioY = 0;
  marco.addEventListener('pointerdown', function (ev) {
    inicioX = ev.clientX;
    inicioY = ev.clientY;
  });
  marco.addEventListener('pointerup', function (ev) {
    var dx = ev.clientX - inicioX;
    var dy = ev.clientY - inicioY;
    if (grupo.length < 2 || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    pintar(dx < 0 ? indice + 1 : indice - 1);
  });

  /* EL PUNTERO «VER». Con raton, al pasar por una foto que se abre el
     puntero se vuelve un circulo negro que se desvanece hacia fuera, con la
     palabra en oro y un brillo que la recorre, y sigue a la mano con un pelo
     de retraso. Es lo que sustituye a las lupas que llevaba cada foto: la
     foto queda limpia y el aviso aparece solo donde esta la mano. En una
     pantalla tactil no hay puntero que cambiar: en el collage cada foto lleva
     su aviso fijo y en la Galeria las esquinas de oro (el 30 y el 15). Sin
     este guion queda la lupa del navegador (`cursor: zoom-in`). */
  var puntero = null;
  var dentro = false;
  var ratonX = 0;
  var ratonY = 0;
  var punteroX = 0;
  var punteroY = 0;
  var relojPuntero = 0;

  function esconderPuntero() {
    if (!puntero || !dentro) return;
    dentro = false;
    puntero.classList.remove('tz-puntero--visible', 'tz-puntero--pulsa');
  }

  function seguir() {
    relojPuntero = 0;
    var paso = quietud.matches ? 1 : 0.3;
    punteroX += (ratonX - punteroX) * paso;
    punteroY += (ratonY - punteroY) * paso;
    puntero.style.transform = 'translate3d(' + punteroX.toFixed(1) + 'px,' + punteroY.toFixed(1) + 'px,0)';
    if (Math.abs(ratonX - punteroX) > 0.3 || Math.abs(ratonY - punteroY) > 0.3) {
      relojPuntero = requestAnimationFrame(seguir);
    }
  }

  /* Mira que hay debajo del raton: al moverlo, y tambien al hacer scroll con
     el quieto, que la foto pasa por debajo sin que el raton se mueva. */
  function revisar(debajo) {
    var pieza = debajo && debajo.closest && debajo.closest(PIEZAS);
    if (!pieza || abierto) { esconderPuntero(); return; }
    if (!dentro) {
      dentro = true;
      punteroX = ratonX;
      punteroY = ratonY;
      puntero.classList.add('tz-puntero--visible');
    }
    if (!relojPuntero) relojPuntero = requestAnimationFrame(seguir);
  }

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    puntero = document.createElement('span');
    puntero.className = 'tz-puntero';
    puntero.setAttribute('aria-hidden', 'true');
    var palabra = document.createElement('span');
    palabra.className = 'tz-puntero__txt';
    palabra.textContent = 'Ver';
    puntero.appendChild(palabra);
    document.body.appendChild(puntero);
    document.documentElement.classList.add('con-puntero');

    document.addEventListener('pointermove', function (ev) {
      if (ev.pointerType !== 'mouse') return;
      ratonX = ev.clientX;
      ratonY = ev.clientY;
      revisar(ev.target);
    }, { passive: true });

    var relojScroll = 0;
    window.addEventListener('scroll', function () {
      if (!dentro || relojScroll) return;
      relojScroll = requestAnimationFrame(function () {
        relojScroll = 0;
        revisar(document.elementFromPoint(ratonX, ratonY));
      });
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', esconderPuntero);
    document.addEventListener('pointerdown', function () {
      if (dentro) puntero.classList.add('tz-puntero--pulsa');
    });
    document.addEventListener('pointerup', function () {
      if (puntero) puntero.classList.remove('tz-puntero--pulsa');
    });
  }
})();
