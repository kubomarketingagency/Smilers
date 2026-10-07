(function () {
  'use strict';

  var visor = document.getElementById('visorFotos');
  if (!visor) return;

  var PIEZAS = '.tz-mosaico__pieza, .galeria-item-lb';

  var navbar = document.getElementById('navbarPrincipal');
  var hueco = !!(window.CSS && CSS.supports && CSS.supports('scrollbar-gutter', 'stable'));
  var marco = visor.querySelector('.visor__marco');
  var foto = visor.querySelector('.visor__foto');
  var leyenda = visor.querySelector('.visor__leyenda');
  var cuenta = visor.querySelector('.visor__cuenta');
  var botonCerrar = visor.querySelector('[data-visor-cerrar]');
  var botonAnt = visor.querySelector('[data-visor-ant]');
  var botonSig = visor.querySelector('[data-visor-sig]');
  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

  function trozo(clase, texto) {
    var el = document.createElement('span');
    el.className = clase;
    if (texto) el.textContent = texto;
    return el;
  }
  var cuentaActual = trozo('visor__actual');
  var cuentaPista = trozo('visor__pista');
  var cuentaTotal = trozo('visor__total');
  cuentaPista.setAttribute('aria-hidden', 'true');
  cuenta.textContent = '';
  cuenta.hidden = true;
  cuenta.appendChild(cuentaActual);
  cuenta.appendChild(cuentaPista);
  cuenta.appendChild(trozo('visor__oculto', ' de '));
  cuenta.appendChild(cuentaTotal);

  var grupo = [];
  var indice = 0;
  var abierto = false;
  var foco = null;
  var relojCierre = 0;
  var turno = 0;

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
  function grupoDe(pieza) {
    var lista = pieza.classList.contains('tz-mosaico__pieza')
      ? pieza.parentNode.querySelectorAll('.tz-mosaico__pieza')
      : document.querySelectorAll('.galeria-item-lb');
    return Array.prototype.filter.call(lista, function (el) {
      return el === pieza || el.getClientRects().length > 0;
    });
  }
  function dos(n) { return (n < 10 ? '0' : '') + n; }

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
    cuenta.hidden = grupo.length < 2;
    cuentaActual.textContent = dos(indice + 1);
    cuentaTotal.textContent = dos(grupo.length);
    cuenta.style.setProperty('--avance', ((indice + 1) / grupo.length).toFixed(4));
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

      if (quietud.matches) {
        escribir();
        marco.classList.remove('visor--oculta');
        return;
      }

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

    if (varias) {
      [indice + 1, indice - 1].forEach(function (i) {
        new Image().src = fuenteDe(grupo[(i + n) % n]);
      });
    }
  }

  function medirArriba() {
    visor.style.setProperty('--visor-arriba', (navbar ? navbar.offsetHeight : 0) + 'px');
  }

  function abrir(piezas, desde) {
    clearTimeout(relojCierre);
    grupo = piezas;
    foco = document.activeElement;
    esconderPuntero();

    if (!abierto) {
      abierto = true;
      var barra = hueco ? 0 : window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.classList.add('visor-abierto');
      if (barra > 0) {
        document.body.style.paddingRight = barra + 'px';
        if (navbar) navbar.style.paddingRight = barra + 'px';
      }
      medirArriba();
      visor.hidden = false;
      void visor.offsetWidth;
      visor.classList.add('visor--abierto');
      document.addEventListener('keydown', teclado);
      window.addEventListener('resize', medirArriba);
    }
    pintar(desde, true);
    botonCerrar.focus({ preventScroll: true });
  }

  function cerrar(sinFoco) {
    if (!abierto) return;
    abierto = false;
    turno++;
    visor.classList.remove('visor--abierto');
    document.removeEventListener('keydown', teclado);
    window.removeEventListener('resize', medirArriba);
    relojCierre = setTimeout(function () {
      visor.hidden = true;
      marco.classList.remove('visor--tapa', 'visor--destapa', 'visor--oculta');
      foto.removeAttribute('src');
      leyenda.textContent = '';
      cuenta.hidden = true;
      document.documentElement.classList.remove('visor-abierto');
      document.body.style.paddingRight = '';
      if (navbar) navbar.style.paddingRight = '';
      if (!sinFoco && foco && foco.focus) foco.focus({ preventScroll: true });
    }, SALIDA);
  }

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
    var esEnlace = pieza.classList.contains('tz-mosaico__pieza');
    if (esEnlace && (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey)) return;
    ev.preventDefault();
    var piezas = grupoDe(pieza);
    abrir(piezas, Math.max(0, piezas.indexOf(pieza)));
  });

  botonCerrar.addEventListener('click', function () { cerrar(); });

  if (navbar) {
    navbar.addEventListener('click', function () { if (abierto) cerrar(true); }, true);
  }
  botonAnt.addEventListener('click', function () { pintar(indice - 1); });
  botonSig.addEventListener('click', function () { pintar(indice + 1); });

  visor.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t === visor || t.hasAttribute('data-visor-fondo') || t.classList.contains('visor__escena')) {
      cerrar();
    }
  });

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
    var caja = trozo('tz-puntero__caja');
    caja.appendChild(trozo('tz-puntero__txt', 'Ver'));
    puntero.appendChild(caja);
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
