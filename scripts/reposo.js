(function () {
  'use strict';

  /* =========================================================================
     Las animaciones infinitas duermen mientras no se ven.

     El brillo que recorre la franja de oro del onix, los destellos de la
     carta de Nosotros, las rayas de «El proceso», la cinta de Tratamientos,
     el latido del circulo de Testimonios... Son animaciones sin fin, y el
     navegador las sigue moviendo aunque esten a diez pantallas: medido en
     reposo, arriba del todo de la Galeria, la FAQ, Tratamientos o Nosotros,
     la pagina recalculaba estilos (y repintaba, las de `background-position`)
     unas 60 veces por segundo por una franja que no estaba en pantalla. Ese
     trabajo compite con el scroll.

     Aqui el elemento de cada animacion infinita lleva `data-reposo` mientras
     esta fuera de la pantalla (con un margen de media pantalla, para que
     nunca se la vea quieta), y el 11 pone en pausa lo que lleva ese
     atributo, sus ::before y ::after incluidos. Lo que se ve no cambia:
     dentro de la pantalla todo corre igual, y fuera no hay nada que ver.

     Es un atributo y no `pause()` a proposito: la pausa por la API se queda
     con la animacion y el CSS ya no la puede parar, y la cinta de
     Tratamientos se para con el raton encima (`animation-play-state` en el
     21). Con el atributo, las dos pausas conviven.

     Las encuentra solas, sin lista: las que ya corren al cargar y las que
     empiezan despues (`animationstart`), como las que se encienden con una
     clase o con `:has()`. Solo vigila las infinitas; las de una vez acaban
     solas.

     Y lo mismo para lo atado al scroll que no se ve: los collages de
     Tratamientos llevan `data-cerca` solo mientras estan a menos de media
     pantalla, y la deriva de sus fotos (30-mosaico.css) solo existe con el.
     ========================================================================= */

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

  /* El elemento de una animacion es el suyo, o el dueno de su ::before o
     su ::after. */
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
  /* Y otra vez al poco: algunas se encienden con la entrada de la pagina. */
  setTimeout(revisarTodas, 2500);
})();
