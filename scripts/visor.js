(function () {
  'use strict';

  /* =========================================================================
     El visor de las fotos de cada especialidad (Tratamientos).

     Cada foto del mosaico es un enlace a su version grande: sin este guion,
     pulsarla abre la foto sola en el navegador, que tambien sirve. Con el, se
     abre dentro del visor de la Galeria —el mismo marcado y los mismos
     estilos— y se puede pasar a las otras fotos de la misma especialidad con
     las flechas, con el teclado o deslizando el dedo.

     No usa el guion de Bootstrap. En la Galeria el visor es un `Modal` de
     Bootstrap, pero esta pagina no carga ese guion y eran 60 KB para abrir
     una foto. Aqui se hace a mano lo poco que hacia falta: poner y quitar
     `show` (las transiciones son las del CSS de Bootstrap, que si esta), el
     velo de detras, el bloqueo del scroll y el foco.
     ========================================================================= */

  var visor = document.getElementById('modalLightbox');
  if (!visor || !visor.classList.contains('visor')) return;

  var foto = visor.querySelector('.lightbox-img');
  var leyenda = visor.querySelector('.lightbox-leyenda');
  var cuenta = visor.querySelector('.visor__cuenta');
  var botonCerrar = visor.querySelector('[data-visor-cerrar]');
  var botonAnt = visor.querySelector('[data-visor-ant]');
  var botonSig = visor.querySelector('[data-visor-sig]');

  var grupo = [];
  var indice = 0;
  var abierto = false;
  var velo = null;
  var foco = null;
  var relojCierre = 0;

  /* Lo que dura la salida en el CSS de Bootstrap: .3s el dialogo y .15s el
     velo. Hasta entonces no se quita nada, que se veria el corte. */
  var SALIDA = 300;

  function reflujo(el) { return el.offsetHeight; }

  function pintar(nuevo) {
    indice = (nuevo + grupo.length) % grupo.length;
    var pieza = grupo[indice];
    var miniatura = pieza.querySelector('img');
    var texto = miniatura ? miniatura.alt : '';
    var varias = grupo.length > 1;

    visor.classList.add('cargando');
    foto.onload = foto.onerror = function () { visor.classList.remove('cargando'); };
    foto.src = pieza.getAttribute('href');
    foto.alt = texto;
    leyenda.textContent = texto;
    cuenta.textContent = varias ? (indice + 1) + ' / ' + grupo.length : '';
    botonAnt.hidden = !varias;
    botonSig.hidden = !varias;

    /* La siguiente y la anterior, ya pedidas: pasar de una a otra no espera. */
    if (varias) {
      [indice + 1, indice - 1].forEach(function (i) {
        var vecina = grupo[(i + grupo.length) % grupo.length];
        new Image().src = vecina.getAttribute('href');
      });
    }
  }

  function abrir(piezas, desde) {
    clearTimeout(relojCierre);
    grupo = piezas;
    foco = document.activeElement;
    esconderPuntero();
    pintar(desde);

    if (!abierto) {
      abierto = true;
      /* El scroll se bloquea como lo hace Bootstrap: sin barra, y con su
         ancho devuelto en relleno para que la pagina no salte de lado. */
      var barra = window.innerWidth - document.documentElement.clientWidth;
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      if (barra > 0) document.body.style.paddingRight = barra + 'px';

      if (!velo) {
        velo = document.createElement('div');
        velo.className = 'modal-backdrop fade visor-velo';
        document.body.appendChild(velo);
      }
      visor.style.display = 'block';
      visor.removeAttribute('aria-hidden');
      reflujo(visor);
      visor.classList.add('show');
      velo.classList.add('show');
      document.addEventListener('keydown', teclado);
    }
    botonCerrar.focus({ preventScroll: true });
  }

  function cerrar() {
    if (!abierto) return;
    abierto = false;
    visor.classList.remove('show');
    if (velo) velo.classList.remove('show');
    document.removeEventListener('keydown', teclado);
    relojCierre = setTimeout(function () {
      visor.style.display = 'none';
      visor.setAttribute('aria-hidden', 'true');
      foto.removeAttribute('src');
      if (velo) { velo.remove(); velo = null; }
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
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
    var pieza = ev.target.closest && ev.target.closest('.tz-mosaico__pieza');
    if (!pieza) return;
    /* Con Ctrl o Cmd, o con la rueda, se respeta abrir la foto aparte. */
    if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    ev.preventDefault();
    var piezas = Array.prototype.slice.call(pieza.parentNode.querySelectorAll('.tz-mosaico__pieza'));
    abrir(piezas, piezas.indexOf(pieza));
  });

  botonCerrar.addEventListener('click', cerrar);
  botonAnt.addEventListener('click', function () { pintar(indice - 1); });
  botonSig.addEventListener('click', function () { pintar(indice + 1); });

  /* Fuera de la foto se cierra, como en la Galeria: el clic que cae en el
     fondo del visor o en la caja del dialogo, no en su contenido. */
  visor.addEventListener('click', function (ev) {
    if (ev.target === visor || ev.target.classList.contains('modal-dialog')) cerrar();
  });

  /* Y en el telefono se pasa de foto deslizando el dedo sobre ella. Solo un
     gesto claramente de lado: uno vertical es alguien que quiere cerrar o
     que se equivoco, y no cambia nada. */
  var inicioX = 0;
  var inicioY = 0;
  foto.parentNode.addEventListener('pointerdown', function (ev) {
    inicioX = ev.clientX;
    inicioY = ev.clientY;
  });
  foto.parentNode.addEventListener('pointerup', function (ev) {
    var dx = ev.clientX - inicioX;
    var dy = ev.clientY - inicioY;
    if (grupo.length < 2 || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    pintar(dx < 0 ? indice + 1 : indice - 1);
  });

  /* EL PUNTERO «VER». Con raton, al pasar por una foto el puntero se vuelve
     un circulo claro que lo dice, y la sigue con un pelo de retraso. Es lo
     que sustituye a la lupa de oro que llevaba cada foto encima: la foto
     queda limpia y el aviso aparece solo donde esta la mano. En una pantalla
     tactil no hay puntero que cambiar y cada foto lleva su aviso fijo (el
     30). Sin este guion queda el puntero de lupa del navegador. */
  var puntero = null;
  var dentro = false;
  var ratonX = 0;
  var ratonY = 0;
  var punteroX = 0;
  var punteroY = 0;
  var relojPuntero = 0;
  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    var pieza = debajo && debajo.closest && debajo.closest('.tz-mosaico__pieza');
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
    puntero.textContent = 'Ver';
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
