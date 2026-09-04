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

    function pintar() {
      tomas.forEach(function (toma, indice) {
        var activa = indice === actual;
        toma.classList.toggle('crsl__toma--activa', activa);
        toma.setAttribute('aria-hidden', activa ? 'false' : 'true');
      });
      puntos.forEach(function (punto, indice) {
        var activo = indice === actual;

        if (activo) {
          punto.classList.remove('crsl__punto--activo');

          void punto.offsetWidth;
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
      if (quietud.matches) return;
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
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) arrancar();
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
  }

  document.querySelectorAll('[data-carrusel]').forEach(montarCarrusel);

  (function () {
    var pantallas = Array.prototype.slice.call(document.querySelectorAll('.ns-pantalla'));
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
