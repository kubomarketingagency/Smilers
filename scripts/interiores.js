document.addEventListener('DOMContentLoaded', function () {

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

  var encender = window.SmilersDiferidas.encender;
  var enReposo = window.SmilersDiferidas.enReposo;

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
    var pedidasTodas = false;
    var dormido = false;
    var visible = true;

    var previaToma = null;

    function pintar() {
      encender(tomas[actual]);
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
      encender(tomas[(actual + 1) % tomas.length]);
      if (manual) arrancar();
    }

    function lista(toma) {
      var foto = toma.querySelector('img');
      return !foto || (foto.complete && foto.naturalWidth > 0);
    }

    function arrancar() {
      parar();
      if (dormido || !visible || quietud.matches) return;
      encender(tomas[(actual + 1) % tomas.length]);
      if (!pedidasTodas) {
        pedidasTodas = true;
        enReposo(function () { tomas.forEach(encender); });
      }
      reloj = setInterval(function () {
        var siguiente = tomas[(actual + 1) % tomas.length];
        encender(siguiente);
        if (lista(siguiente)) ir(actual + 1);
      }, intervalo);
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

  window.SmilersCarruseles = [];
  document.querySelectorAll('[data-carrusel]').forEach(function (caja) {
    var mando = montarCarrusel(caja);
    if (mando) window.SmilersCarruseles.push(mando);
  });

});
