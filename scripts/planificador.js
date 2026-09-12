var SmilersScroll = (function () {

  var entradas = [];
  var reinicios = [];
  var pedido = false;

  var ctx = { y: 0, alto: 0, ancho: 0 };

  /* El alto es el de la pantalla grande (con la barra del navegador
     escondida), el mismo que el `100lvh` de los pines de las escenas. En el
     telefono la barra aparece y se esconde con el scroll e innerHeight cambia
     cada vez: medir con el descuadraba las escenas a mitad del gesto. Se
     mide con una pieza de 100lvh (100vh donde no hay lvh, que ahi ya es la
     pantalla grande), la primera vez que hace falta y cuando cambia la
     ventana. */
  var sonda = null;
  var altoGrande = 0;

  function medirAlto() {
    if (!sonda) {
      sonda = document.createElement('div');
      sonda.setAttribute('aria-hidden', 'true');
      sonda.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
      document.body.appendChild(sonda);
    }
    altoGrande = sonda.offsetHeight || window.innerHeight || 1;
  }

  function alto() {
    if (!altoGrande) medirAlto();
    return altoGrande;
  }

  function medir() {
    ctx.y = window.scrollY;
    ctx.alto = alto();
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
  /* Se toma en el primer scroll y no aqui: leer scrollY mientras la pagina
     aun no esta maquetada obliga al navegador a maquetarla entera a
     destiempo, y en un telefono eso eran 128ms con la pagina congelada. */
  var yPrevia = null;

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
    if (yPrevia === null) yPrevia = y;
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
    /* Si solo se ha movido la barra del navegador, la pantalla grande sigue
       igual y no hay nada que recalcular. */
    var altoAntes = altoGrande, anchoAntes = ctx.ancho;
    medirAlto();
    if (altoGrande === altoAntes && (window.innerWidth || 1) === anchoAntes) { pedir(); return; }
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
    alto: alto,
    deslizarA: deslizarA,
    abortarDeslizamiento: abortar,
    pedir: pedir
  };
})();
window.SmilersScroll = SmilersScroll;
