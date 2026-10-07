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
    var conSplash = !!(splash && video && !document.documentElement.classList.contains('sin-splash'));
    var tipos = window.PerformanceObserver && PerformanceObserver.supportedEntryTypes;
    var conLcp = !!(tipos && tipos.indexOf('largest-contentful-paint') >= 0);
    var pintado = !conLcp;
    var cargado = conSplash;
    function quizas() {
      if (pintado && cargado) requestAnimationFrame(function () { requestAnimationFrame(una); });
    }
    if (conLcp) {
      var obs = new PerformanceObserver(function (lista) {
        var vale = lista.getEntries().some(function (e) { return !conSplash || (e.element && splash.contains(e.element)); });
        if (!vale) return;
        obs.disconnect();
        pintado = true;
        quizas();
      });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
    }
    if (conSplash) {
      if (!conLcp) video.addEventListener('playing', function () { setTimeout(una, 600); }, { once: true });
      document.addEventListener('smilers:splash-fin', una, { once: true });
      setTimeout(una, 2500);
      return;
    }
    var alCargar = function () {
      cargado = true;
      quizas();
      setTimeout(una, 2500);
    };
    if (document.readyState === 'complete') alCargar();
    else window.addEventListener('load', alCargar, { once: true });
  }

  trasLoCritico(function () {
    var diferidas = document.querySelectorAll('[data-diferida]');
    for (var i = 0; i < diferidas.length; i++) encender(diferidas[i]);
  });

  return { encender: encender, enReposo: enReposo, trasLoCritico: trasLoCritico };
})();
