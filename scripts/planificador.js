var SmilersScroll = (function () {

  var entradas = [];
  var reinicios = [];
  var pedido = false;

  var ctx = { y: 0, alto: 0, ancho: 0 };

  function medir() {
    ctx.y = window.scrollY;
    ctx.alto = window.innerHeight || 1;
    ctx.ancho = window.innerWidth || 1;
  }

  function correr() {
    pedido = false;
    medir();

    var i, e;
    for (i = 0; i < entradas.length; i++) {
      e = entradas[i];
      if (e.activo && e.leer) e.leer(ctx);
    }
    for (i = 0; i < entradas.length; i++) {
      e = entradas[i];
      if (e.activo && e.escribir) e.escribir(ctx);
    }
  }

  function pedir() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(correr);
  }

  var deslizamiento = null;
  var bloqueadoHasta = 0;

  var inmuneHasta = 0;

  function abortar() {
    if (Date.now() < inmuneHasta) return;
    document.documentElement.classList.remove('smilers-deslizando');
    if (deslizamiento) {
      deslizamiento.vivo = false;

      bloqueadoHasta = Date.now() + 1400;
    }
    deslizamiento = null;
  }

  function deslizarA(destino, duracion, salida) {
    abortar();
    inmuneHasta = Date.now() + 90;
    var inicio = window.scrollY;
    var salto = destino - inicio;
    if (Math.abs(salto) < 2) return;
    document.documentElement.classList.add('smilers-deslizando');
    var d = duracion || 620;
    var t0 = 0;
    var mio = { vivo: true };
    deslizamiento = mio;

    function paso(ahora) {
      if (!mio.vivo) return;
      if (!t0) t0 = ahora;
      var t = Math.min(1, (ahora - t0) / d);
      var e = salida

        ? 1 - Math.pow(1 - t, 3)

        : (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

      window.scrollTo(0, Math.round(inicio + salto * e));
      if (t < 1) requestAnimationFrame(paso);
      else if (deslizamiento === mio) {
        deslizamiento = null;
        document.documentElement.classList.remove('smilers-deslizando');
      }
    }
    requestAnimationFrame(paso);
  }

  var quietos = [];
  var idle = null;
  var direccion = 'down';
  var ultimaDireccionArriba = false;
  var yPrevia = window.scrollY;

  var SALTO_MAXIMO = .9;

  function alDetenerse() {
    idle = null;
    if (deslizamiento) return;
    if (Date.now() < bloqueadoHasta) return;

    if (direccion !== 'down') return;
    for (var i = 0; i < quietos.length; i++) {
      var respuesta = quietos[i](direccion);
      if (respuesta === null || respuesta === undefined) continue;

      var destino = typeof respuesta === 'number' ? respuesta : respuesta.y;
      var tope = (typeof respuesta === 'object' && respuesta.maximo) || SALTO_MAXIMO;
      if (typeof destino !== 'number' || !isFinite(destino)) continue;

      var salto = destino - window.scrollY;

      if (Math.abs(salto) > 4 && Math.abs(salto) < window.innerHeight * tope) {

        deslizarA(destino, Math.min(1150, 420 + Math.abs(salto) * .95));
      }
      return;
    }
  }

  function alScroll() {
    var y = window.scrollY;
    if (y > yPrevia + 1) direccion = 'down';
    else if (y < yPrevia - 1) direccion = 'up';
    yPrevia = y;

    var arriba = (direccion === 'up');
    if (arriba !== ultimaDireccionArriba) {
      ultimaDireccionArriba = arriba;
      document.documentElement.classList.toggle('smilers-arriba', arriba);
    }
    pedir();
    if (idle) clearTimeout(idle);
    idle = setTimeout(alDetenerse, 220);
  }

  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', function () {
    for (var i = 0; i < reinicios.length; i++) reinicios[i]();
    pedir();
  });

  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (evt) {
    window.addEventListener(evt, abortar, { passive: true });
  });

  return {

    registrar: function (leer, escribir, alRedimensionar, opciones) {
      var e = { leer: leer || null, escribir: escribir || null, activo: true };
      entradas.push(e);
      if (alRedimensionar) reinicios.push(alRedimensionar);

      var guarda = opciones && opciones.guarda;
      if (!guarda || typeof IntersectionObserver !== 'function') return;

      e.activo = false;
      new IntersectionObserver(function (registros) {
        var dentro = registros[registros.length - 1].isIntersecting;
        if (dentro === e.activo) return;

        e.activo = true;
        medir();
        if (e.leer) e.leer(ctx);
        if (e.escribir) e.escribir(ctx);
        e.activo = dentro;

        if (opciones.alCambiarVisibilidad) opciones.alCambiarVisibilidad(dentro);
      }, { rootMargin: '100% 0px' }).observe(guarda);
    },

    alDetenerse: function (fn) { quietos.push(fn); },
    deslizarA: deslizarA,
    abortarDeslizamiento: abortar,
    pedir: pedir
  };
})();
window.SmilersScroll = SmilersScroll;
