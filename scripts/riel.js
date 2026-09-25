(function () {
  'use strict';

  /* =========================================================================
     El riel de puntos: la navegacion lateral por secciones, en la portada y
     en Tratamientos. Nosotros tiene el suyo en nosotros-cine.js, porque alli
     todas las secciones viven dentro de una misma escena clavada; los tres
     se visten igual (31-riel.css).

     Cada parada es un elemento con `data-pantalla="Nombre"`, en el orden del
     documento. Con `data-pantalla-menor` el punto va mas pequeno: son las
     diez especialidades de Tratamientos, que cuelgan de «Especialidades».

     A donde lleva cada punto: a donde su seccion se ve entera. Por lo
     general es su arranque justo debajo de la barra. Una seccion de una
     pantalla justa (100lvh, como las especialidades de la portada) ya
     cuenta con la barra encima —su rotulo empieza por debajo de ella—, y
     ahi el punto la deja con el techo arriba del todo: debajo de la barra
     le faltaba el ultimo trozo, justo donde van el nombre y la descripcion
     del panel abierto. Y si la seccion vive dentro de una escena clavada
     —ahi el arranque no es donde se ve—, el guion de esa escena le cuelga
     `smilersRiel = { destino, desde }` al elemento: `destino()` es el pixel
     al que hay que ir y `desde()` a partir de donde cuenta como la que se
     esta viendo. Si devuelven otra cosa que un numero (la escena apagada,
     sin animaciones), vale lo de antes.

     El riel no se ve hasta que se llega a la primera parada: en la portada
     la primera es Nosotros, y el hero va sin riel.

     Se lee en cada fotograma del planificador, y solo mientras el riel se
     ve: en el telefono no se monta nada que mirar.
     ========================================================================= */

  var secciones = Array.prototype.slice.call(document.querySelectorAll('[data-pantalla]'));
  if (secciones.length < 2 || typeof SmilersScroll === 'undefined') return;

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cabe = window.matchMedia('(min-width: 768px) and (min-height: 520px)');

  /* El alto de la barra se lee una vez y se guarda: el riel lo usa en cada
     fotograma del scroll y no cambia hasta que cambia la ventana. */
  var barraGuardada = 0;
  function alturaBarra() {
    if (!barraGuardada) {
      barraGuardada = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-navbar')) || 62;
    }
    return barraGuardada;
  }

  function propio(seccion, que) {
    var gancho = seccion.smilersRiel && seccion.smilersRiel[que];
    var valor = gancho ? gancho() : null;
    return typeof valor === 'number' && isFinite(valor) ? valor : null;
  }

  function destinoDe(seccion, barra) {
    var suyo = propio(seccion, 'destino');
    if (suyo !== null) return Math.max(0, Math.round(suyo));
    var arriba = seccion.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(seccion.offsetHeight - SmilersScroll.alto()) < 2) return Math.max(0, Math.round(arriba));
    return Math.max(0, Math.round(arriba - barra));
  }

  var nav = document.createElement('nav');
  nav.className = 'ns-riel-nav ns-riel-nav--oculto';
  nav.setAttribute('aria-label', 'Secciones de la página');
  var lista = document.createElement('ul');
  lista.className = 'ns-riel';

  var botones = secciones.map(function (seccion) {
    var fila = document.createElement('li');
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'ns-riel__boton';
    if (seccion.hasAttribute('data-pantalla-menor')) boton.classList.add('ns-riel__boton--menor');
    boton.dataset.nombre = seccion.dataset.pantalla;
    boton.setAttribute('aria-label', 'Ir a ' + seccion.dataset.pantalla);

    boton.addEventListener('click', function () {
      var destino = destinoDe(seccion, alturaBarra());
      var salto = Math.abs(destino - window.scrollY);
      if (!quietud.matches) {
        SmilersScroll.deslizarA(destino, Math.min(1300, Math.max(600, 420 + salto * 0.08)));
      } else {
        window.scrollTo(0, destino);
      }
    });

    fila.appendChild(boton);
    lista.appendChild(fila);
    return boton;
  });

  nav.appendChild(lista);
  document.body.appendChild(nav);

  var activo = -2;
  var pintado = -2;

  function leer(ctx) {
    if (!cabe.matches) return;
    var barra = alturaBarra();
    var mejor = -1;
    for (var i = 0; i < secciones.length; i++) {
      var desde = propio(secciones[i], 'desde');
      if (desde === null) desde = destinoDe(secciones[i], barra) - ctx.alto * 0.45;
      if (ctx.y >= desde) mejor = i;
    }
    /* Al fondo del todo cuenta la ultima, aunque sea corta y no llegue a
       subir hasta donde contaria. */
    if (ctx.y + window.innerHeight >= document.documentElement.scrollHeight - 2) mejor = secciones.length - 1;
    activo = mejor;
  }

  function escribir() {
    if (activo === pintado) return;
    pintado = activo;
    nav.classList.toggle('ns-riel-nav--oculto', activo < 0);
    botones.forEach(function (boton, i) {
      var es = i === activo;
      boton.classList.toggle('ns-riel__boton--activo', es);
      if (es) boton.setAttribute('aria-current', 'true');
      else boton.removeAttribute('aria-current');
    });
  }

  SmilersScroll.registrar(leer, escribir, function () { pintado = -2; barraGuardada = 0; });
  SmilersScroll.pedir();

  /* Al pasar de telefono a tableta (girarla) el riel aparece sin que haya
     habido scroll: se pide un fotograma para pintarlo ya en su sitio. */
  var alCambiar = function () { pintado = -2; barraGuardada = 0; SmilersScroll.pedir(); };
  if (cabe.addEventListener) cabe.addEventListener('change', alCambiar);
  else if (cabe.addListener) cabe.addListener(alCambiar);
  window.addEventListener('load', alCambiar);
})();
