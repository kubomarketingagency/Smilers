document.addEventListener('DOMContentLoaded', function () {

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Enciende las fotos aplazadas de un trozo de pagina. Van con la direccion
     en `data-src` / `data-srcset` porque `loading="lazy"` no sirve aqui:
     las tomas de un carrusel estan una encima de otra y las capas de la
     escena de Nosotros ocupan la pantalla a la vez, asi que el navegador las
     da todas por visibles y se las bajaba de golpe. El `<source>` va antes
     que el `<img>` en el documento, que es el orden en que hay que
     encenderlos para que el navegador elija bien. */
  function encender(nodo) {
    if (!nodo) return;
    var piezas = nodo.querySelectorAll('img[data-src], img[data-srcset], source[data-srcset]');
    for (var i = 0; i < piezas.length; i++) {
      var p = piezas[i];
      if (p.dataset.srcset) { p.setAttribute('srcset', p.dataset.srcset); delete p.dataset.srcset; }
      if (p.dataset.src) { p.setAttribute('src', p.dataset.src); delete p.dataset.src; }
    }
  }

  /* El resto, cuando el navegador no tenga nada mejor que hacer, y nunca
     antes de que la pagina acabe de cargar: con una red lenta, adelantar
     fotos que no se ven le quita ancho de banda a la que si se esta
     mirando. */
  function enReposo(fn) {
    var luego = function () {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 4000 });
      else setTimeout(fn, 1500);
    };
    if (document.readyState === 'complete') luego();
    else window.addEventListener('load', luego, { once: true });
  }

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
    /* `dormido` lo pone la escena de Nosotros; `visible` lo pone el
       observador de mas abajo. Hacen falta los dos y no uno: dentro del pin
       las capas nunca salen de pantalla —lo que las esconde es la opacidad o
       el recorte—, asi que el observador da por visibles los dos carruseles
       de esa pagina a la vez y desde el primer fotograma. */
    var dormido = false;
    var visible = true;

    var previaToma = null;

    function pintar() {
      encender(tomas[actual]);
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
      encender(tomas[(actual + 1) % tomas.length]);
      if (manual) arrancar();
    }

    /* Una toma esta lista cuando su foto ha llegado entera. Sin esta
       comprobacion el reloj pasaba de toma a su hora aunque la siguiente
       foto siguiera bajando, y con una conexion lenta el hero se quedaba en
       negro cinco segundos: el fondo de la caja, con el texto encima y nada
       detras. En un equipo con buena red no se notaba nunca, y por eso la
       pagina "cargaba bien en unos computadores y en otros no". */
    function lista(toma) {
      var foto = toma.querySelector('img');
      return !foto || (foto.complete && foto.naturalWidth > 0);
    }

    function arrancar() {
      parar();
      if (dormido || !visible || quietud.matches) return;
      /* Solo cuando el carrusel va a correr de verdad: la siguiente toma con
         tiempo de sobra, y las demas en tiempo muerto. Las cintas de Nosotros
         estan dormidas hasta que la escena llega a ellas, asi que hasta
         entonces no piden nada. */
      encender(tomas[(actual + 1) % tomas.length]);
      if (!pedidasTodas) {
        pedidasTodas = true;
        enReposo(function () { tomas.forEach(encender); });
      }
      /* Si la siguiente no ha llegado, se queda en la que hay y lo vuelve a
         mirar en el siguiente tic: mejor una foto un rato mas que un hueco
         negro. Las flechas y los puntos no esperan —ahi manda quien pulsa—. */
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

  /* El riel de puntos que se montaba aqui vive ahora en riel.js, que lo
     comparte con la portada. */
});
