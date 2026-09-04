document.addEventListener('DOMContentLoaded', function () {
  const heroCarrusel = document.getElementById('heroCarrusel');

  if (heroCarrusel) {

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

    var progresoCine = 0;
    var alturaDesplazableCine = 0;

    var BLUR_SALIDA = window.matchMedia('(hover: none) and (pointer: coarse)').matches ? 8 : 20;

    var mqRejilla = window.matchMedia('(max-width: 767.98px)');
    var esRejilla = mqRejilla.matches;

    function acotar(valor) { return Math.min(1, Math.max(0, valor)); }

    var ultimoEstilo = new WeakMap();

    function fijar(el, prop, valor) {
      var previos = ultimoEstilo.get(el);
      if (!previos) { previos = {}; ultimoEstilo.set(el, previos); }
      if (previos[prop] === valor) return;
      previos[prop] = valor;
      el.style[prop] = valor;
    }

    function leerCine(ctx) {
      var rect = envoltorio.getBoundingClientRect();
      alturaDesplazableCine = envoltorio.offsetHeight - ctx.alto;
      progresoCine = alturaDesplazableCine > 0
        ? acotar(-rect.top / alturaDesplazableCine)
        : 0;
    }

    function actualizarCine() {
      var progreso = progresoCine;

      if (progreso === ultimoProgresoCine) return;
      ultimoProgresoCine = progreso;

      if (heroTitulo) {
        var caidaTitulo = acotar((progreso - .08) / .30);
        fijar(heroTitulo, 'opacity', String(1 - caidaTitulo));
        fijar(heroTitulo, 'transform', 'translateY(' + (caidaTitulo * 150).toFixed(1) + 'px)');
      }

      var salida1 = acotar((progreso - .24) / .12);
      fijar(etapa1, 'opacity', String(1 - salida1));

      var entrada2 = acotar((progreso - .34) / .24);

      var salida2 = acotar((progreso - .80) / .20);
      fijar(etapa2, 'opacity', String(entrada2));

      columnas.forEach(function (col, indice) {

        var propio = acotar((entrada2 - indice * .16) / (1 - indice * .16 || 1));

        var indiceSalida = columnas.length - 1 - indice;
        var salidaPropia = acotar((salida2 - indiceSalida * .15) / (1 - indiceSalida * .15 || 1));

        fijar(col, 'opacity', String(propio * (1 - salidaPropia)));
        fijar(col, 'transform', 'translateY(' + ((1 - propio) * 40).toFixed(1) + 'px) translateX(' + (salidaPropia * -70).toFixed(1) + 'px)');

        fijar(col, 'filter', salidaPropia > 0 ? 'blur(' + (salidaPropia * BLUR_SALIDA).toFixed(1) + 'px)' : '');

        if (!esRejilla) fijar(col, 'flexGrow', (.12 + propio * .88).toFixed(2));
      });

      if (tagline) {
        var propioTag = acotar((entrada2 - .3) / .7);
        fijar(tagline, 'opacity', String(propioTag * (1 - salida2)));
        fijar(tagline, 'transform', 'translateY(' + ((1 - propioTag) * 24 + salida2 * -30).toFixed(1) + 'px)');

        var blurTag = Math.max((1 - propioTag) * 16, salida2 * 16);
        fijar(tagline, 'filter', blurTag > .1 ? 'blur(' + blurTag.toFixed(1) + 'px)' : '');
      }
    }

    function pedirCapas(dentro) {
      var valor = dentro ? 'transform, opacity' : '';
      for (var i = 0; i < columnas.length; i++) columnas[i].style.willChange = valor;
      if (heroTitulo) heroTitulo.style.willChange = valor;
      if (tagline) tagline.style.willChange = valor;
    }

    SmilersScroll.registrar(leerCine, actualizarCine, function () {
      esRejilla = mqRejilla.matches;
      ultimoProgresoCine = -1;
    }, { guarda: envoltorio, alCambiarVisibilidad: pedirCapas });
    SmilersScroll.pedir();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var especialidades = document.getElementById('especialidades');

    var hechoTratamientos = false;

    SmilersScroll.alDetenerse(function () {
      if (!especialidades) return null;

      if (!window.matchMedia('(min-width: 992px)').matches) return null;

      var rect = especialidades.getBoundingClientRect();
      var alto = window.innerHeight;
      var visible = Math.min(rect.bottom, alto) - Math.max(rect.top, 0);
      var proporcion = visible / rect.height;

      if (proporcion < .06) {
        hechoTratamientos = false;
        return null;
      }
      if (proporcion <= .22 || proporcion >= .96) return null;
      if (hechoTratamientos) return null;
      if (rect.top <= 4) return null;

      hechoTratamientos = true;
      return rect.top + window.scrollY;
    });

  })();

  (function () {
    var especialidadesOsc = document.getElementById('especialidades');
    var capaNegra = document.getElementById('acercamientoNegro');
    if (!especialidadesOsc || !capaNegra) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var tOsc = 99;

    function acotarOsc(valor) { return Math.min(1, Math.max(0, valor)); }

    var LEJOS  = 1;
    var PICO   = .45;
    var DENTRO = .15;

    var usarDesenfoque = window.matchMedia('(min-width: 992px)').matches;
    var ultimoProgresoOsc = -1;

    function leerAcercamiento(ctx) {
      tOsc = especialidadesOsc.getBoundingClientRect().top / ctx.alto;
    }

    function actualizarAcercamiento() {
      var t = tOsc;
      var progresoOsc;

      if (t >= LEJOS || t <= DENTRO) {
        progresoOsc = 0;
      } else if (t > PICO) {
        progresoOsc = acotarOsc((LEJOS - t) / (LEJOS - PICO));
      } else {
        progresoOsc = acotarOsc((t - DENTRO) / (PICO - DENTRO));
      }

      if (progresoOsc === ultimoProgresoOsc) return;
      ultimoProgresoOsc = progresoOsc;

      capaNegra.style.opacity = String(progresoOsc * .5);

      if (progresoOsc <= .01) {

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

  (function () {
    var envoltorio = document.getElementById('cierreCine');
    var negro = document.getElementById('cierreCineNegro');
    var contenido = document.querySelector('#bandaCta .banda-cta-contenido');
    if (!envoltorio || !negro) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ultimoDesplazado = -1;
    var desplazado = 0;

    function leerCierre() {
      desplazado = -envoltorio.getBoundingClientRect().top;
    }

    var ENTRA = 8;
    var SALE  = 2;
    var revelado = false;

    function actualizarCierre() {
      if (desplazado === ultimoDesplazado) return;
      ultimoDesplazado = desplazado;

      var quiere = revelado ? (desplazado > SALE) : (desplazado >= ENTRA);
      if (quiere === revelado) return;

      revelado = quiere;
      envoltorio.classList.toggle('cc-revelado', revelado);
      envoltorio.classList.toggle('cc-velado', !revelado);
    }

    envoltorio.classList.add('cc-velado');

    SmilersScroll.registrar(leerCierre, actualizarCierre, function () {
      ultimoDesplazado = -1;
    }, {
      guarda: envoltorio,
      alCambiarVisibilidad: function (dentro) {

        var valor = dentro ? 'opacity' : '';
        negro.style.willChange = valor;
        if (contenido) contenido.style.willChange = dentro ? 'opacity, transform' : '';
      }
    });
    SmilersScroll.pedir();
  })();

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
      setTimeout(function () { splash.remove(); }, 700);
    }

    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      retirarSplash();
      return;
    }

    if (!video.getAttribute('src')) {
      video.src = window.matchMedia('(max-width: 767.98px)').matches
        ? video.dataset.srcMovil
        : video.dataset.srcEscritorio;
      video.muted = true;
      video.playbackRate = 1.3;
    }

    if (video.dataset.autoplayBloqueado) { retirarSplash(); return; }

    video.addEventListener('ended', retirarSplash);
    video.addEventListener('error', retirarSplash);

    function desdeLaApertura() {
      return (window.performance && performance.now) ? performance.now() : 0;
    }

    var arranco = false;
    function marcarArranque() {
      if (arranco) return;
      arranco = true;
      var restante = isFinite(video.duration) ? Math.max(0, video.duration - video.currentTime) : 4;
      esperar(restante / (video.playbackRate || 1) * 1000 + 500, retirarSplash);
    }
    video.addEventListener('playing', marcarArranque);

    video.addEventListener('timeupdate', marcarArranque);

    esperar(Math.max(500, 2600 - desdeLaApertura()), function () {
      if (!arranco) retirarSplash();
    });

    esperar(Math.max(1000, 9000 - desdeLaApertura()), retirarSplash);

    if (video.paused && !video.ended) {
      var intento = video.play();
      if (intento && typeof intento.catch === 'function') intento.catch(retirarSplash);
    }
  })();
});
