document.addEventListener('DOMContentLoaded', function () {
  const elementosRevelar = document.querySelectorAll('.revelar');
  const temporizadoresOcultarRevelar = new WeakMap();

  const CAPA_REVELAR = 'transform, opacity';

  function soltarCapa(evento) {
    if (evento.target !== this) return;
    this.style.willChange = 'auto';
  }

  /* La capa se pide al empezar y se suelta al acabar la transicion. Pero si
     la transicion no llega a correr —porque la pieza ya estaba en su sitio,
     como las fotos de la Galeria, que el filtro deja a opacidad 1 y sin
     transformar—, `transitionend` no salta nunca y la capa se queda puesta
     para siempre. En la Galeria eran 43 capas del tamano de una foto: el
     navegador se quedaba sin memoria para pintarlas y dejaba filas enteras
     en blanco, que solo se pintaban al pasarles el raton por encima. Asi que
     ademas hay un reloj que la suelta pase lo que pase: la transicion mas
     larga son .7s con hasta ~1s de retraso. */
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

  /* Una pagina puede pedir que lo revelado se quede revelado:
     `<body data-revelar="una-vez">`. Por defecto, lo que sale de pantalla se
     vuelve a esconder y entra otra vez al volver, y en paginas de bloques
     cortos eso da vida. En Tratamientos no: cada especialidad ocupa una
     pantalla entera, y al subir por la pagina uno se encontraba pantallas
     vacias que se volvian a montar delante de el. En un equipo lento eso se
     lee como una pagina que no termina de cargar.

     Y hay un punto medio, `<body data-revelar="al-bajar">`, que es el de
     Tratamientos: lo que sale por ABAJO —porque se ha subido por la pagina y
     ha quedado debajo— se vuelve a esconder, y lo que sale por arriba se
     queda. Asi cada especialidad repite su entrada (la cortina de oro de sus
     fotos) cada vez que se llega a ella bajando, y subiendo no hay pantallas
     vacias: lo que se encuentra uno al subir ya esta montado. */
  const modoRevelar = document.body.dataset.revelar;
  const unaVez = modoRevelar === 'una-vez';
  const soloAbajo = modoRevelar === 'al-bajar';

  /* Lo que vive dentro de una escena clavada se mira contra la pantalla
     entera, sin el 8% de abajo. Ese margen esta para que un bloque entre un
     poco despues de asomar, subiendo ya por la pantalla; pero dentro de un
     pin nada sube: lo que queda en la franja de abajo se queda ahi. En un
     iPhone SE el boton de «Ver la galeria», al pie de la pantalla de las
     sedes de la portada, asomaba 2px por encima de esa raya, no llegaba
     nunca al 15% y se quedaba invisible, con su sitio vacio. */
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

  /* La cortina se abre cuando la seccion ha entrado una decima parte de la
     PANTALLA, no de ella misma. Iba por proporcion de la seccion (el 10%), y
     eso vale para una seccion de una pantalla, pero la de Nosotros de la
     portada es una escena clavada de 300vh (360 en el ordenador): su 10% son
     253px en un telefono, y hasta entonces la escena subia tapada de negro.
     Era el tramo muerto entre el hero y «Quienes somos», un tercio de
     pantalla de scroll sin nada. Ahora la raya esta en el 90% de la
     pantalla, mida lo que mida la seccion. */
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

    /* El telon va tambien en el movil: lo unico que lo apaga es que se haya
       pedido menos movimiento. Antes pedia ademas 992px de ancho. */
    function cabe() {
      return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    }

    /* Cada variable va en la pieza que la usa, no en la escena. Escritas en
       la escena, cada una invalidaba el estilo de sus 160 elementos en cada
       fotograma del barrido —una propiedad personalizada se hereda—, y en un
       telefono ese recalculo era el fotograma entero. El 07 las registra sin
       herencia, asi que escribirlas aqui solo toca a su pieza. */
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

    /* Y solo cuando cambian: el cambiazo de fondo y el interruptor del raton
       cambian una vez en todo el recorrido y se escribian en cada pixel. */
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

      /* El cambiazo de fondo, en el punto medio: ahi el telon tapa la pantalla
         entera (acaba de taparla en .32 y no empieza a abrirse hasta .70), asi
         que el corte no se ve. */
      var segundo = progreso >= .5 ? 1 : 0;
      pon('--pn-uno', String(1 - segundo));
      pon('--pn-dos', String(segundo));

      /* Y con el fondo se cambia tambien quien recibe el raton: la pantalla
         que no se ve no puede quedarse robando el clic de la que si. */
      pon('--pn-ev-uno', segundo ? 'none' : 'auto');
      pon('--pn-ev-dos', segundo ? 'auto' : 'none');
    }

    /* El punto de «Instalaciones» del riel lateral (riel.js). Dentro del pin
       las dos pantallas caen en el mismo sitio del documento, y esta se ve
       entera al final de la escena, con el telon ya abierto: ahi lleva el
       punto, y cuenta como la que se ve desde que el telon empieza a
       abrirse. Con la escena apagada vale su sitio en la pagina. */
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
    /* Y el de «Nosotros», la seccion que envuelve la escena: su primera
       pantalla se ve entera con la escena recien clavada, al principio del
       recorrido y con el telon todavia sin moverse (empieza en .05). Con el
       arranque debajo de la barra, como las demas, la escena aun no se
       habia clavado y le faltaba el trozo de abajo. */
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
