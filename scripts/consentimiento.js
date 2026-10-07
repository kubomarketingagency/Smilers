(function () {
  'use strict';

  var AJUSTES = {
    metaPixel: '',

    googleAds: '',

    googleAdsContacto: '',
    antesDeDecidir: 'activo',
    revision: 1
  };

  var hayPixeles = !!(AJUSTES.metaPixel || AJUSTES.googleAds);
  var raiz = document.documentElement;
  var botonesPreferencias = document.querySelectorAll('[data-preferencias-cookies]');

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');
  var CATEGORIA = 'publicidad';

  function decisionGuardada() {
    var m = document.cookie.match(/(?:^|;)\s*cc_cookie=([^;]+)/);
    if (!m) return null;
    try {
      var d = JSON.parse(decodeURIComponent(m[1]));
      if (d.revision !== AJUSTES.revision) return null;
      if (d.expirationTime && d.expirationTime < Date.now()) return null;
      return Array.isArray(d.categories) && d.categories.indexOf(CATEGORIA) !== -1;
    } catch (e) {
      return null;
    }
  }

  var pixelesActivos = false;

  function pedirGuion(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function cargarMeta(id) {
    if (window.fbq) return;
    var n = window.fbq = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments);
      else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    pedirGuion('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function cargarGoogleAds(id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', id);
    pedirGuion('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
  }

  function activarPixeles() {
    if (pixelesActivos || !hayPixeles) return;
    pixelesActivos = true;
    if (AJUSTES.metaPixel) cargarMeta(AJUSTES.metaPixel);
    if (AJUSTES.googleAds) cargarGoogleAds(AJUSTES.googleAds);
  }

  function borrarCookiesDePublicidad() {
    var nombres = document.cookie.split(';')
      .map(function (trozo) { return trozo.split('=')[0].trim(); })
      .filter(function (nombre) { return /^_fbp$|^_fbc$|^_gcl_/.test(nombre); });
    if (!nombres.length) return;

    var host = location.hostname;
    var dominios = [null, host, '.' + host];
    var punto = host.indexOf('.');
    if (punto !== -1) dominios.push('.' + host.slice(punto + 1));

    nombres.forEach(function (nombre) {
      dominios.forEach(function (dominio) {
        document.cookie = nombre + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
          (dominio ? '; domain=' + dominio : '');
      });
    });
  }

  function apagarPixeles() {
    if (!pixelesActivos) return;
    pixelesActivos = false;
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
    }
    borrarCookiesDePublicidad();
    location.reload();
  }

  function canalDe(href) {
    if (/^https:\/\/(api\.whatsapp\.com|wa\.me)\//.test(href)) return 'WhatsApp';
    if (/^tel:/.test(href)) return 'Llamada';
    if (/^mailto:|^https:\/\/mail\.google\.com\//.test(href)) return 'Correo';
    return null;
  }

  function contarContacto(canal) {
    if (!pixelesActivos) return;
    if (window.fbq) window.fbq('track', 'Contact', { content_category: canal });
    if (window.gtag && AJUSTES.googleAdsContacto) {
      window.gtag('event', 'conversion', {
        send_to: AJUSTES.googleAdsContacto,
        transport_type: 'beacon'
      });
    }
  }

  document.addEventListener('click', function (evento) {
    var enlace = evento.target.closest && evento.target.closest('a[href]');
    if (!enlace) return;
    var canal = canalDe(enlace.getAttribute('href'));
    if (canal) contarContacto(canal);
  }, true);

  var formulario = document.getElementById('formWhatsapp');
  if (formulario) {
    formulario.addEventListener('submit', function () { contarContacto('WhatsApp'); });
  }

  var carga = null;
  var arrancado = false;

  function cargarLibreria() {
    if (carga) return carga;
    var meta = document.querySelector('meta[name="smilers-consentimiento"]');
    carga = new Promise(function (resolver, fallar) {
      if (!meta) { fallar(new Error('sin meta de consentimiento')); return; }
      var hoja = document.createElement('link');
      hoja.rel = 'stylesheet';
      hoja.href = meta.dataset.perezosoCss;
      document.head.appendChild(hoja);
      var guion = document.createElement('script');
      guion.src = meta.dataset.perezosoJs;
      guion.onload = function () { resolver(); };
      guion.onerror = fallar;
      document.head.appendChild(guion);
    });
    return carga;
  }

  function arrancar(mostrar) {
    if (arrancado) return Promise.resolve(window.CookieConsent);
    arrancado = true;
    return window.SmilersAvisoCookies.arrancar({
      revision: AJUSTES.revision,
      categoria: CATEGORIA,
      mostrar: mostrar,
      yaMiden: pixelesActivos,
      hayPixeles: hayPixeles,
      alAceptar: activarPixeles,
      alRechazar: apagarPixeles
    });
  }

  function enReposo(fn) {
    var luego = function () {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
      else setTimeout(fn, 300);
    };
    if (document.readyState === 'complete') luego();
    else window.addEventListener('load', luego, { once: true });
  }

  function trasLaBienvenida(fn) {
    var hecho = false;
    function una() {
      if (hecho) return;
      hecho = true;
      enReposo(fn);
    }
    var splash = document.getElementById('splashInicio');
    if (splash && !raiz.classList.contains('sin-splash') && !window.SmilersSplashTerminado) {
      document.addEventListener('smilers:splash-fin', una, { once: true });
      setTimeout(una, 12000);
      return;
    }
    var cortina = document.querySelector('.ns-umbral');
    var conCortina = cortina && !raiz.classList.contains('sin-umbral') && !quietud.matches;
    setTimeout(una, conCortina ? 3000 : 400);
  }

  Array.prototype.forEach.call(botonesPreferencias, function (boton) {
    boton.hidden = false;
    boton.addEventListener('click', function () {
      cargarLibreria()
        .then(function () { return arrancar(false); })
        .then(function (CC) { CC.showPreferences(); })
        .catch(function () {});
    });
  });

  var decision = decisionGuardada();
  if (decision === true) {
    enReposo(activarPixeles);
  } else if (decision === null) {
    if (AJUSTES.antesDeDecidir === 'activo') enReposo(activarPixeles);
    trasLaBienvenida(function () {
      cargarLibreria().then(function () { return arrancar(true); }).catch(function () {});
    });
  }
})();
