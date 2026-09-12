document.addEventListener('DOMContentLoaded', function () {

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

  function montarCarrusel(caja) {
    var tomas = Array.prototype.slice.call(caja.querySelectorAll('.crsl__toma'));
    if (tomas.length < 2) return;

    var mandos  = caja.querySelector('.crsl__mandos');
    var puntera = caja.querySelector('.crsl__puntos');
    var intervalo = Number(caja.dataset.intervalo || 5200);
    var actual = tomas.findIndex(function (t) { return t.classList.contains('crsl__toma--activa'); });
    if (actual < 0) actual = 0;

    caja.style.setProperty('--crsl-intervalo', intervalo + 'ms');

    var puntos = [];
    if (puntera) {
      tomas.forEach(function (toma, indice) {
        var punto = document.createElement('button');
        punto.type = 'button';
        punto.className = 'crsl__punto';
        punto.setAttribute('aria-label', 'Imagen ' + (indice + 1) + ' de ' + tomas.length);
        punto.addEventListener('click', function () { ir(indice, true); });
        puntera.appendChild(punto);
        puntos.push(punto);
      });
    }

    var reloj = null;
    /* `dormido` lo pone la escena de Nosotros; `visible` lo pone el
       observador de mas abajo. Hacen falta los dos y no uno: dentro del pin
       las capas nunca salen de pantalla —lo que las esconde es la opacidad o
       el recorte—, asi que el observador da por visibles los dos carruseles
       de esa pagina a la vez y desde el primer fotograma. */
    var dormido = false;
    var visible = true;

    var previaToma = null;

    function pintar() {
      // La toma que acaba de salir se marca aparte: asi el carrusel del hero
      // puede sacarla por un lado mientras la nueva entra por el otro.
      var saliente = previaToma;
      tomas.forEach(function (toma, indice) {
        var activa = indice === actual;
        toma.classList.toggle('crsl__toma--saliente', !activa && toma === saliente);
        toma.classList.toggle('crsl__toma--activa', activa);
        toma.setAttribute('aria-hidden', activa ? 'false' : 'true');
      });
      previaToma = tomas[actual];
      puntos.forEach(function (punto, indice) {
        var activo = indice === actual;

        if (activo) {
          /* Reiniciar su barra obliga a maquetar en medio, y solo hace falta
             si el punto ya estaba encendido; si no, encenderlo basta. */
          if (punto.classList.contains('crsl__punto--activo')) {
            punto.classList.remove('crsl__punto--activo');
            void punto.offsetWidth;
          }
          punto.classList.add('crsl__punto--activo');
        } else {
          punto.classList.remove('crsl__punto--activo');
        }
        punto.setAttribute('aria-current', activo ? 'true' : 'false');
      });
    }

    function ir(indice, manual) {
      actual = (indice + tomas.length) % tomas.length;
      pintar();
      if (manual) arrancar();
    }

    function arrancar() {
      parar();
      if (dormido || !visible || quietud.matches) return;
      reloj = setInterval(function () { ir(actual + 1); }, intervalo);
    }

    function parar() {
      if (reloj) { clearInterval(reloj); reloj = null; }
    }

    if (mandos) {
      var previa = mandos.querySelector('.crsl__flecha--previa');
      var siguiente = mandos.querySelector('.crsl__flecha--siguiente');
      if (previa) previa.addEventListener('click', function () { ir(actual - 1, true); });
      if (siguiente) siguiente.addEventListener('click', function () { ir(actual + 1, true); });
    }

    caja.addEventListener('mouseenter', parar);
    caja.addEventListener('mouseleave', arrancar);
    caja.addEventListener('focusin', parar);
    caja.addEventListener('focusout', arrancar);

    pintar();

    if ('IntersectionObserver' in window) {
      visible = false;
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          visible = entrada.isIntersecting;
          if (visible) arrancar();
          else parar();
        });
      }, { rootMargin: '80px 0px' }).observe(caja);
    } else {
      arrancar();
    }

    quietud.addEventListener('change', function () {
      if (quietud.matches) parar();
      else arrancar();
    });

    return {
      caja: caja,
      dormir: function () {
        if (dormido) return;
        dormido = true;
        parar();
      },
      despertar: function () {
        if (!dormido) return;
        dormido = false;
        arrancar();
      }
    };
  }

  /* El registro es para Nosotros. Alli las dos cintas viven dentro del pin y
     el observador las da por visibles las dos a la vez durante toda la
     escena: la del hero seguia pasando fotos cuando ya se veia el elenco, y
     la de infraestructura las pasaba desde el primer fotograma detras de un
     `clip-path: inset(100% 0 0 0)`. Dos cruces de imagenes a pantalla
     completa corriendo a la vez, y una de ellas invisible.

     Quien decide ahi es la escena, igual que con el elenco. En Tratamientos
     no hay escena y manda el observador, que es lo correcto: su cinta si
     entra y sale de pantalla de verdad. */
  window.SmilersCarruseles = [];
  document.querySelectorAll('[data-carrusel]').forEach(function (caja) {
    var mando = montarCarrusel(caja);
    if (mando) window.SmilersCarruseles.push(mando);
  });

  (function () {
    /* `[data-pantalla]` ademas de la clase: en Tratamientos las paradas del
       riel son secciones normales —la portada, el triptico, la franja de
       especialidades, el proceso y el cierre—, que no llevan ni quieren
       llevar la puesta en escena de `.ns-pantalla`. Basta con que digan
       como se llaman. */
    var pantallas = Array.prototype.slice.call(
      document.querySelectorAll('.ns-pantalla, [data-pantalla]'));
    if (!pantallas.length || !('IntersectionObserver' in window)) {
      pantallas.forEach(function (p) { p.classList.add('en-pantalla'); });
      return;
    }

    var conNombre = pantallas.filter(function (p) { return p.dataset.pantalla; });
    var botones = [];

    if (conNombre.length > 1) {
      var nav = document.createElement('nav');
      nav.className = 'ns-riel-nav';
      nav.setAttribute('aria-label', 'Secciones de la página');

      var lista = document.createElement('ul');
      lista.className = 'ns-riel';

      conNombre.forEach(function (seccion) {
        var fila = document.createElement('li');
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'ns-riel__boton';
        boton.dataset.nombre = seccion.dataset.pantalla;
        boton.setAttribute('aria-label', 'Ir a ' + seccion.dataset.pantalla);

        boton.addEventListener('click', function () {
          var destino = seccion.getBoundingClientRect().top + window.scrollY - 90;
          if (window.SmilersScroll && !quietud.matches) {
            SmilersScroll.deslizarA(Math.max(0, destino), 760);
          } else {
            window.scrollTo(0, Math.max(0, destino));
          }
        });

        fila.appendChild(boton);
        lista.appendChild(fila);
        botones.push(boton);
      });

      nav.appendChild(lista);
      document.body.appendChild(nav);
    }

    var visibles = new Map();

    function marcarRiel() {
      var mejor = null;
      var mejorRazon = 0;
      conNombre.forEach(function (seccion) {
        var razon = visibles.get(seccion) || 0;
        if (razon > mejorRazon) { mejorRazon = razon; mejor = seccion; }
      });
      botones.forEach(function (boton, indice) {
        boton.classList.toggle('ns-riel__boton--activo', conNombre[indice] === mejor);
      });
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        visibles.set(entrada.target, entrada.intersectionRatio);
        if (entrada.intersectionRatio >= 0.22) entrada.target.classList.add('en-pantalla');
      });
      marcarRiel();
    }, { threshold: [0, 0.22, 0.5, 0.75, 1] });

    pantallas.forEach(function (p) { observador.observe(p); });
  })();
});
