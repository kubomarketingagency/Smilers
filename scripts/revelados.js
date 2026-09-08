document.addEventListener('DOMContentLoaded', function () {
  const elementosRevelar = document.querySelectorAll('.revelar');
  const temporizadoresOcultarRevelar = new WeakMap();

  const CAPA_REVELAR = 'transform, opacity';

  function soltarCapa(evento) {
    if (evento.target !== this) return;
    this.style.willChange = 'auto';
  }

  elementosRevelar.forEach(function (el) {
    el.addEventListener('transitionend', soltarCapa);
  });

  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {

        const razon = entrada.intersectionRatio;

        if (razon >= 0.15) {
          const ocultarPendiente = temporizadoresOcultarRevelar.get(entrada.target);
          if (ocultarPendiente) {
            clearTimeout(ocultarPendiente);
            temporizadoresOcultarRevelar.delete(entrada.target);
          }

          if (!entrada.target.classList.contains('visible')) {

            entrada.target.style.willChange = CAPA_REVELAR;
            entrada.target.classList.add('visible');
          }
        } else if (razon === 0) {
          if (!temporizadoresOcultarRevelar.has(entrada.target)) {
            const idOcultar = setTimeout(function () {
              entrada.target.style.willChange = CAPA_REVELAR;
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

    elementosRevelar.forEach(function (el) { el.classList.add('visible'); });
  }

  const cortinas = document.querySelectorAll('.cortina');
  const retrasosCortina = new WeakMap();
  const cierresCortina = new WeakMap();

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

    /* El telon va tambien en el movil: lo unico que lo apaga es que se haya
       pedido menos movimiento. Antes pedia ademas 992px de ancho. */
    function cabe() {
      return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    }

    var VARIABLES = ['--pn-der', '--pn-izq', '--pn-op', '--pn-desenfoque',
                     '--pn-x', '--pn-filo', '--pn-filo-op', '--pn-uno', '--pn-dos',
                     '--pn-ev-uno', '--pn-ev-dos'];

    function revisarModo() {
      var quiere = cabe();
      if (quiere === viva) return;
      viva = quiere;
      escena.classList.toggle('pn-escena--viva', viva);

      if (!viva) {
        VARIABLES.forEach(function (v) { escena.style.removeProperty(v); });
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

      escena.style.setProperty('--pn-der', ((1 - tapa) * 100).toFixed(2) + '%');
      escena.style.setProperty('--pn-izq', (abre * 100).toFixed(2) + '%');
      escena.style.setProperty('--pn-op', entra.toFixed(3));
      escena.style.setProperty('--pn-desenfoque', ((1 - entra) * 14).toFixed(1) + 'px');
      escena.style.setProperty('--pn-x', (-abre * 12).toFixed(2) + 'vw');

      var cerrando = abre > 0;
      var canto = cerrando ? abre : tapa;
      escena.style.setProperty('--pn-filo', (canto * 100).toFixed(2) + '%');
      escena.style.setProperty('--pn-filo-op', canto > 0 && canto < 1 ? '1' : '0');

      /* El cambiazo de fondo, en el punto medio: ahi el telon tapa la pantalla
         entera (acaba de taparla en .32 y no empieza a abrirse hasta .70), asi
         que el corte no se ve. */
      var segundo = progreso >= .5 ? 1 : 0;
      escena.style.setProperty('--pn-uno', String(1 - segundo));
      escena.style.setProperty('--pn-dos', String(segundo));

      /* Y con el fondo se cambia tambien quien recibe el raton: la pantalla
         que no se ve no puede quedarse robando el clic de la que si. */
      escena.style.setProperty('--pn-ev-uno', segundo ? 'none' : 'auto');
      escena.style.setProperty('--pn-ev-dos', segundo ? 'auto' : 'none');
    }

    revisarModo();

    SmilersScroll.registrar(leerEscena, escribirEscena, function () {
      revisarModo();
      ultimo = -1;
    }, { guarda: escena });

    SmilersScroll.pedir();
  })();
});
