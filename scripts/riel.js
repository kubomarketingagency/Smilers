(function () {
  'use strict';

  var secciones = Array.prototype.slice.call(document.querySelectorAll('[data-pantalla]'));
  if (secciones.length < 2 || typeof SmilersScroll === 'undefined') return;

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cabe = window.matchMedia('(min-width: 768px) and (min-height: 520px)');

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

  var alCambiar = function () { pintado = -2; barraGuardada = 0; SmilersScroll.pedir(); };
  if (cabe.addEventListener) cabe.addEventListener('change', alCambiar);
  else if (cabe.addListener) cabe.addListener(alCambiar);
  window.addEventListener('load', alCambiar);
})();
