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

  const escenasSalida = punteroFino ? document.querySelectorAll('[data-escena-salida]') : [];

  if ((piezasParallax.length || escenasSalida.length)
      && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {

    const escrituras = [];

    function leerEfectosScroll(ctx) {
      const alto = ctx.alto;
      const tramoSalida = alto * 0.5;
      escrituras.length = 0;

      piezasParallax.forEach(function (pieza) {
        const caja = pieza.getBoundingClientRect();
        if (caja.bottom < -220 || caja.top > alto + 220) return;

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
});
