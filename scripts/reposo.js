(function () {
  'use strict';

  if (typeof IntersectionObserver !== 'function' || !document.getAnimations) return;

  var vigilados = new WeakSet();

  function esInfinita(animacion) {
    var efecto = animacion.effect;
    return !!(efecto && efecto.getComputedTiming && efecto.getComputedTiming().iterations === Infinity);
  }

  var observador = new IntersectionObserver(function (registros) {
    registros.forEach(function (registro) {
      if (registro.isIntersecting) registro.target.removeAttribute('data-reposo');
      else registro.target.setAttribute('data-reposo', '');
    });
  }, { rootMargin: '50% 0px' });

  function vigilar(el) {
    if (!el || el.nodeType !== 1 || vigilados.has(el)) return;
    vigilados.add(el);
    observador.observe(el);
  }

  function revisar(animaciones) {
    animaciones.forEach(function (animacion) {
      if (esInfinita(animacion)) vigilar(animacion.effect.target);
    });
  }

  document.addEventListener('animationstart', function (ev) {
    var el = ev.target;
    if (el && el.nodeType === 1 && !vigilados.has(el)) revisar(el.getAnimations({ subtree: true }));
  }, true);

  function revisarTodas() { revisar(document.getAnimations()); }

  var CERCA = '.tz-mosaico';
  var cercania = new IntersectionObserver(function (registros) {
    registros.forEach(function (registro) {
      if (registro.isIntersecting) registro.target.setAttribute('data-cerca', '');
      else registro.target.removeAttribute('data-cerca');
    });
  }, { rootMargin: '50% 0px' });
  Array.prototype.forEach.call(document.querySelectorAll(CERCA), function (el) { cercania.observe(el); });
  if (document.readyState === 'complete') revisarTodas();
  else window.addEventListener('load', revisarTodas);
  setTimeout(revisarTodas, 2500);
})();
