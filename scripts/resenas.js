(function () {
  'use strict';

  var caja = document.querySelector('[data-resenas]');
  if (!caja) return;

  var pista = caja.querySelector('[data-resenas-pista]');
  var marcos = Array.prototype.slice.call(pista.querySelectorAll('.rs-marco'));
  var total = marcos.length;
  if (total < 2) return;

  var puntera = caja.querySelector('[data-resenas-puntos]');
  var previa = caja.querySelector('[data-resenas-previa]');
  var siguiente = caja.querySelector('[data-resenas-siguiente]');
  var seccion = caja.closest('section') || caja;

  var INTERVALO = 12000;
  var actual = 0;
  var reloj = null;
  var enPantalla = false;
  var encima = false;
  var enfocado = false;
  var cargadas = false;
  var lado = .72;
  var hueco = 40;
  var anchos = [];

  var puntos = marcos.map(function (marco, indice) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'rs-punto';
    boton.setAttribute('aria-label', 'Reseña ' + (indice + 1) + ' de ' + total);
    boton.addEventListener('click', function () { ir(indice, true); });
    if (puntera) puntera.appendChild(boton);
    marco.addEventListener('click', function () {
      if (indice !== actual) ir(indice, true);
    });
    return boton;
  });

  function distancia(indice) {
    var d = ((indice - actual) % total + total) % total;
    if (d > total / 2) d -= total;
    return d;
  }

  function medir() {
    var estilo = getComputedStyle(caja);
    var valor = parseFloat(estilo.getPropertyValue('--rs-lado'));
    lado = isFinite(valor) && valor > 0 ? valor : .72;
    valor = parseFloat(getComputedStyle(pista).columnGap);
    hueco = isFinite(valor) ? valor : 40;
    anchos = marcos.map(function (marco) { return marco.offsetWidth; });
    pintar();
  }

  function posiciones() {
    var x = [];
    x[actual] = 0;
    var borde = anchos[actual] / 2;
    for (var k = 1; k <= Math.floor(total / 2); k++) {
      var i = (actual + k) % total;
      x[i] = borde + hueco + lado * anchos[i] / 2;
      borde = x[i] + lado * anchos[i] / 2;
    }
    borde = -anchos[actual] / 2;
    for (k = 1; k < Math.ceil(total / 2); k++) {
      var j = (actual - k + total) % total;
      x[j] = borde - hueco - lado * anchos[j] / 2;
      borde = x[j] - lado * anchos[j] / 2;
    }
    return x;
  }

  function pintar() {
    var x = anchos.length ? posiciones() : [];
    if (anchos.length) caja.style.setProperty('--rs-medio', (anchos[actual] / 2).toFixed(1) + 'px');
    marcos.forEach(function (marco, indice) {
      var d = distancia(indice);
      var lejos = Math.abs(d);
      marco.style.setProperty('--tx', (x[indice] || 0).toFixed(1) + 'px');
      marco.classList.toggle('rs-marco--centro', d === 0);
      marco.classList.toggle('rs-marco--lejos', lejos > 2);
      marco.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
    });
    puntos.forEach(function (punto, indice) {
      var activo = indice === actual;
      punto.classList.toggle('rs-punto--activo', activo);
      punto.setAttribute('aria-current', activo ? 'true' : 'false');
    });
  }

  function parar() {
    if (reloj) { clearInterval(reloj); reloj = null; }
  }

  function arrancar() {
    parar();
    if (!enPantalla || encima || enfocado) return;
    reloj = setInterval(function () { ir(actual + 1); }, INTERVALO);
  }

  function ir(indice, manual) {
    actual = ((indice % total) + total) % total;
    pintar();
    if (manual) arrancar();
  }

  function cargar() {
    if (cargadas) return;
    cargadas = true;
    if (window.SmilersDiferidas) window.SmilersDiferidas.encender(pista);
    else marcos.forEach(function (marco) {
      var img = marco.querySelector('img');
      if (img && img.dataset.srcset) img.setAttribute('srcset', img.dataset.srcset);
      if (img && img.dataset.src) img.setAttribute('src', img.dataset.src);
    });
  }

  if (previa) previa.addEventListener('click', function () { ir(actual - 1, true); });
  if (siguiente) siguiente.addEventListener('click', function () { ir(actual + 1, true); });

  caja.addEventListener('pointerenter', function (e) {
    if (e.pointerType !== 'mouse') return;
    encima = true;
    parar();
  });
  caja.addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse') return;
    encima = false;
    arrancar();
  });
  caja.addEventListener('focusin', function (e) {
    var visible = false;
    try { visible = e.target.matches(':focus-visible'); } catch (error) {}
    if (!visible) return;
    enfocado = true;
    parar();
  });
  caja.addEventListener('focusout', function () {
    if (!enfocado) return;
    enfocado = false;
    arrancar();
  });

  var inicio = null;
  pista.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    inicio = { x: e.clientX, y: e.clientY };
  });
  pista.addEventListener('pointerup', function (e) {
    if (!inicio) return;
    var dx = e.clientX - inicio.x;
    var dy = e.clientY - inicio.y;
    inicio = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) ir(actual + (dx < 0 ? 1 : -1), true);
  });
  pista.addEventListener('pointercancel', function () { inicio = null; });

  medir();
  if ('ResizeObserver' in window) new ResizeObserver(medir).observe(pista);
  else window.addEventListener('resize', medir);

  if (!('IntersectionObserver' in window)) {
    cargar();
    enPantalla = true;
    arrancar();
    return;
  }

  new IntersectionObserver(function (entradas) {
    if (entradas.some(function (e) { return e.isIntersecting; })) cargar();
  }, { rootMargin: '1000px 0px' }).observe(seccion);

  new IntersectionObserver(function (entradas) {
    var dentro = entradas[entradas.length - 1].isIntersecting;
    if (dentro === enPantalla) return;
    enPantalla = dentro;
    if (enPantalla) arrancar(); else parar();
  }, { threshold: .35 }).observe(caja);
})();
