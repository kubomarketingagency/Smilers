document.addEventListener('DOMContentLoaded', function () {
  const elementosRevelar = document.querySelectorAll('.revelar');
  const temporizadoresOcultarRevelar = new WeakMap();

  const CAPA_REVELAR = 'transform, opacity';

  function soltarCapa(evento) {
    if (evento.target !== this) return;
    this.style.willChange = 'auto';
  }

  const relojesCapa = new WeakMap();
  const TOPE_CAPA = 2200;

  function pedirCapa(el) {
    el.style.willChange = CAPA_REVELAR;
    clearTimeout(relojesCapa.get(el));
    relojesCapa.set(el, setTimeout(function () {
      el.style.willChange = 'auto';
      relojesCapa.delete(el);
    }, TOPE_CAPA));
  }

  elementosRevelar.forEach(function (el) {
    el.addEventListener('transitionend', soltarCapa);
  });

  const modoRevelar = document.body.dataset.revelar;
  const unaVez = modoRevelar === 'una-vez';
  const soloAbajo = modoRevelar === 'al-bajar';

  const EN_PIN = '.pn-pin, .hero-cine-pin, .cierre-cine-pin, .testimonios-pin, ' +
                 '.ns-cine__pin, .ns-cierre__pin, .ns-carta__pin';

  if ('IntersectionObserver' in window) {
    const alCruzar = function (entradas) {
      entradas.forEach(function (entrada) {

        const razon = entrada.intersectionRatio;

        if (razon >= 0.15) {
          const ocultarPendiente = temporizadoresOcultarRevelar.get(entrada.target);
          if (ocultarPendiente) {
            clearTimeout(ocultarPendiente);
            temporizadoresOcultarRevelar.delete(entrada.target);
          }

          if (!entrada.target.classList.contains('visible')) {

            pedirCapa(entrada.target);
            entrada.target.classList.add('visible');
          }
        } else if (razon === 0 && !unaVez) {
          if (soloAbajo && !(entrada.boundingClientRect.top > 0)) return;
          if (!temporizadoresOcultarRevelar.has(entrada.target)) {
            const idOcultar = setTimeout(function () {
              pedirCapa(entrada.target);
              entrada.target.classList.remove('visible');
              temporizadoresOcultarRevelar.delete(entrada.target);
            }, 400);
            temporizadoresOcultarRevelar.set(entrada.target, idOcultar);
          }
        }
      });
    };
    const observador = new IntersectionObserver(alCruzar, { threshold: [0, 0.15], rootMargin: '0px 0px -8% 0px' });
    const observadorClavado = new IntersectionObserver(alCruzar, { threshold: [0, 0.15] });

    elementosRevelar.forEach(function (el) {
      (el.closest(EN_PIN) ? observadorClavado : observador).observe(el);
    });
  } else {

    elementosRevelar.forEach(function (el) { el.classList.add('visible'); });
  }

  const cortinas = document.querySelectorAll('.cortina');
  const retrasosCortina = new WeakMap();
  const cierresCortina = new WeakMap();

  if ('IntersectionObserver' in window) {
    const obsCortinas = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) {
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
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    cortinas.forEach(function (el) { obsCortinas.observe(el); });
  } else {
    cortinas.forEach(function (el) { el.classList.add('abierta'); });
  }

  const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const haceParallax = punteroFino && window.matchMedia('(min-width: 992px)').matches;
  const piezasParallax = haceParallax ? document.querySelectorAll('[data-parallax]') : [];

  if (piezasParallax.length
      && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {

    const escrituras = [];

    function leerEfectosScroll(ctx) {
      const alto = ctx.alto;
      escrituras.length = 0;

      piezasParallax.forEach(function (pieza) {
        const caja = pieza.getBoundingClientRect();
        if (caja.bottom < -220 || caja.top > alto + 220) return;

        const progreso = ((caja.top + caja.height / 2) / alto - 0.5) * -2;
        const fuerza = Number(pieza.dataset.parallax || 0);
        escrituras.push([pieza, progreso * fuerza]);
      });
    }

    function escribirEfectosScroll() {
      escrituras.forEach(function (orden) {
        orden[0].style.transform = 'translate3d(0,' + orden[1].toFixed(2) + 'px,0)';
      });
    }

    SmilersScroll.registrar(leerEfectosScroll, escribirEfectosScroll);
    SmilersScroll.pedir();
  }

  (function () {
    var escena = document.getElementById('pnEscena');
    if (!escena || typeof SmilersScroll === 'undefined') return;

    var viva = false;

    function cabe() {
      return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    }

    function piezas(selector) {
      return Array.prototype.slice.call(escena.querySelectorAll(selector));
    }
    var telon = piezas('.pn-telon');
    var contenidos = piezas('.pn-contenido');
    var filo = piezas('.pn-filo');
    var fondoUno = piezas('.pn-fondo--uno');
    var fondoDos = piezas('.pn-fondo--dos');
    var DESTINOS = {
      '--pn-der': telon, '--pn-izq': telon,
      '--pn-op': contenidos, '--pn-desenfoque': contenidos, '--pn-x': contenidos,
      '--pn-filo': filo, '--pn-filo-op': filo,
      '--pn-uno': fondoUno, '--pn-ev-uno': fondoUno,
      '--pn-dos': fondoDos, '--pn-ev-dos': fondoDos
    };

    var escrito = {};
    function pon(nombre, valor) {
      if (escrito[nombre] === valor) return;
      escrito[nombre] = valor;
      DESTINOS[nombre].forEach(function (pieza) { pieza.style.setProperty(nombre, valor); });
    }

    function revisarModo() {
      var quiere = cabe();
      if (quiere === viva) return;
      viva = quiere;
      escena.classList.toggle('pn-escena--viva', viva);

      if (!viva) {
        Object.keys(DESTINOS).forEach(function (nombre) {
          DESTINOS[nombre].forEach(function (pieza) { pieza.style.removeProperty(nombre); });
        });
        escrito = {};
      }
    }

    var progreso = 0;
    var ultimo = -1;

    function leerEscena(ctx) {
      if (!viva) return;
      var caja = escena.getBoundingClientRect();

      var recorrido = caja.height - ctx.alto;
      if (recorrido <= 0) { progreso = 0; return; }
      progreso = Math.min(1, Math.max(0, -caja.top / recorrido));
    }

    function tramo(v, a, b) { return Math.min(1, Math.max(0, (v - a) / (b - a))); }

    function suave(t) { return t * t * (3 - 2 * t); }

    function escribirEscena() {
      if (!viva || progreso === ultimo) return;
      ultimo = progreso;

      var tapa = suave(tramo(progreso, .05, .32));
      var entra = tramo(progreso, .34, .46);
      var abre = suave(tramo(progreso, .70, .97));

      pon('--pn-der', ((1 - tapa) * 100).toFixed(2) + '%');
      pon('--pn-izq', (abre * 100).toFixed(2) + '%');
      pon('--pn-op', entra.toFixed(3));
      pon('--pn-desenfoque', ((1 - entra) * 14).toFixed(1) + 'px');
      pon('--pn-x', (-abre * 12).toFixed(2) + 'vw');

      var cerrando = abre > 0;
      var canto = cerrando ? abre : tapa;
      pon('--pn-filo', (canto * 100).toFixed(2) + '%');
      pon('--pn-filo-op', canto > 0 && canto < 1 ? '1' : '0');

      var segundo = progreso >= .5 ? 1 : 0;
      pon('--pn-uno', String(1 - segundo));
      pon('--pn-dos', String(segundo));

      pon('--pn-ev-uno', segundo ? 'none' : 'auto');
      pon('--pn-ev-dos', segundo ? 'auto' : 'none');
    }

    function puntoDeEscena(p) {
      var caja = escena.getBoundingClientRect();
      var recorrido = Math.max(0, caja.height - SmilersScroll.alto());
      return caja.top + window.scrollY + p * recorrido;
    }
    if (fondoDos[0]) {
      fondoDos[0].smilersRiel = {
        destino: function () { return viva ? puntoDeEscena(.99) : null; },
        desde: function () { return viva ? puntoDeEscena(.78) : null; }
      };
    }
    var envoltorio = escena.parentNode && escena.parentNode.closest ? escena.parentNode.closest('[data-pantalla]') : null;
    if (envoltorio) {
      envoltorio.smilersRiel = {
        destino: function () { return viva ? puntoDeEscena(0) : null; }
      };
    }

    revisarModo();

    SmilersScroll.registrar(leerEscena, escribirEscena, function () {
      revisarModo();
      ultimo = -1;
    }, { guarda: escena });

    SmilersScroll.pedir();
  })();
});
