window.SmilersDiferidas = (function () {

  function encender(nodo) {
    if (!nodo) return;
    var piezas = [nodo].concat(Array.prototype.slice.call(nodo.querySelectorAll('img, source')));
    for (var i = 0; i < piezas.length; i++) {
      var p = piezas[i];
      if (!p.dataset) continue;
      if (p.dataset.srcset) { p.setAttribute('srcset', p.dataset.srcset); delete p.dataset.srcset; }
      if (p.dataset.src) { p.setAttribute('src', p.dataset.src); delete p.dataset.src; }
    }
  }

  function enReposo(fn) {
    var luego = function () {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 4000 });
      else setTimeout(fn, 1500);
    };
    if (document.readyState === 'complete') luego();
    else window.addEventListener('load', luego, { once: true });
  }

  function trasLoCritico(fn) {
    var hecho = false;
    function una() {
      if (hecho) return;
      hecho = true;
      fn();
    }
    ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (tipo) {
      window.addEventListener(tipo, una, { once: true, passive: true });
    });
    var splash = document.getElementById('splashInicio');
    var video = document.getElementById('splashVideo');
    if (splash && video && !document.documentElement.classList.contains('sin-splash')) {
      var tipos = window.PerformanceObserver && PerformanceObserver.supportedEntryTypes;
      if (tipos && tipos.indexOf('largest-contentful-paint') >= 0) {
        var obs = new PerformanceObserver(function (lista) {
          var pintado = lista.getEntries().some(function (e) { return e.element && splash.contains(e.element); });
          if (pintado) { obs.disconnect(); setTimeout(una, 0); }
        });
        obs.observe({ type: 'largest-contentful-paint', buffered: true });
      } else {
        video.addEventListener('playing', function () { setTimeout(una, 600); }, { once: true });
      }
      document.addEventListener('smilers:splash-fin', una, { once: true });
      setTimeout(una, 2500);
      return;
    }
    if (document.readyState === 'complete') setTimeout(una, 0);
    else window.addEventListener('load', una, { once: true });
  }

  trasLoCritico(function () {
    var diferidas = document.querySelectorAll('[data-diferida]');
    for (var i = 0; i < diferidas.length; i++) encender(diferidas[i]);
  });

  return { encender: encender, enReposo: enReposo, trasLoCritico: trasLoCritico };
})();
