(function () {
  'use strict';

  /* El aviso de cookies y los pixeles de publicidad (Meta y Google Ads).

     Lo que manda aqui es la Ley Organica de Proteccion de Datos Personales del
     Ecuador: nada de terceros se carga sin permiso. Los dos pixeles NO estan en
     el HTML. No hay un <script> de Meta ni de Google en ninguna pagina, ni
     bloqueado ni esperando: el codigo que los pide se escribe en la pagina solo
     despues de que la persona pulse "Aceptar". Si rechaza, cierra el aviso o no
     hace nada, no se pide nada a Meta ni a Google.

     El aviso es CookieConsent (vanilla-cookieconsent 3, de Orest Bida, licencia
     MIT), servido desde el propio dominio: la libreria y los textos van en
     paquetes/aviso-cookies.js (vendor/cookieconsent/ + consentimiento-aviso.js)
     y su hoja en terceros/cookieconsent/. Gratis, sin cuenta, sin llamar a
     ningun servidor ajeno y sin cookies propias salvo la que guarda la
     decision (`cc_cookie`). Y no se descarga al abrir la
     pagina: solo cuando hace falta preguntar —la primera visita— o cuando
     alguien pulsa "Preferencias de cookies" en el pie. Quien ya decidio no lo
     descarga nunca: su decision se lee aqui mismo de la cookie.

     Cuando pregunta: en la portada, cuando el video de bienvenida ha terminado
     y se ha ido (hero.js avisa con `smilers:splash-fin`); en las demas
     paginas, cuando se retira la cortina de entrada. Y siempre con la pagina ya
     cargada y el navegador libre, que en un telefono no le quite ni un
     fotograma a lo que se esta viendo. */

  /* ---- Lo unico que hay que rellenar -------------------------------------
     Mientras los dos esten vacios no pasa nada: ni aviso, ni boton en el pie,
     ni pixeles. Es el interruptor general. */
  var AJUSTES = {
    // Meta (Facebook / Instagram): el ID numerico del pixel, p. ej. '123456789012345'.
    metaPixel: '',
    // Google Ads: el ID de la cuenta, p. ej. 'AW-123456789'.
    googleAds: '',
    // Opcional. La conversion "Contacto" de Google Ads, p. ej. 'AW-123456789/AbCdEfGhIj'.
    // Se envia al pulsar WhatsApp, llamar o escribir por correo.
    googleAdsContacto: '',
    // Subirla (2, 3...) vuelve a preguntar a todo el mundo: hay que hacerlo si
    // se anade otro servicio que use cookies.
    revision: 1
  };

  var activo = !!(AJUSTES.metaPixel || AJUSTES.googleAds);
  var raiz = document.documentElement;
  var botonesPreferencias = document.querySelectorAll('[data-preferencias-cookies]');

  if (!activo) return;

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');
  var CATEGORIA = 'publicidad';

  /* ---- La decision guardada -------------------------------------------- */

  /* Lee la cookie de CookieConsent sin cargarlo. Devuelve true (acepto la
     publicidad), false (la rechazo) o null (no hay decision valida: nunca
     contesto, caduco, o la revision ha cambiado). */
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

  /* ---- Los pixeles --------------------------------------------------------
     Son los fragmentos oficiales de Meta y de Google, escritos como funcion
     para poder llamarlos tarde. Nada de esto corre hasta `activarPixeles()`. */

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
    /* Modo de consentimiento de Google: se declara lo que se acepto. Solo se
       llega aqui con la publicidad aceptada, y la analitica no se usa. */
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
    if (pixelesActivos) return;
    pixelesActivos = true;
    if (AJUSTES.metaPixel) cargarMeta(AJUSTES.metaPixel);
    if (AJUSTES.googleAds) cargarGoogleAds(AJUSTES.googleAds);
  }

  /* La conversion que le importa a una clinica: que alguien la contacte. Se
     avisa a Meta y a Google de que se pulso WhatsApp, llamar o escribir, y
     por que canal, nada mas. Nunca el nombre ni el mensaje del formulario:
     lo que alguien le cuenta a su dentista no sale de la conversacion. */
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

  /* ---- CookieConsent, cuando haga falta ---------------------------------- */

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

  /* El aviso vive en su propio paquete (consentimiento-aviso.js): la
     configuracion y los textos solo se descargan cuando hace falta ensenarlos. */
  function arrancar(mostrar) {
    if (arrancado) return Promise.resolve(window.CookieConsent);
    arrancado = true;
    return window.SmilersAvisoCookies.arrancar({
      revision: AJUSTES.revision,
      categoria: CATEGORIA,
      mostrar: mostrar,
      alAceptar: activarPixeles
    });
  }

  /* ---- Cuando preguntar --------------------------------------------------- */

  /* Con la pagina cargada y el navegador libre. */
  function enReposo(fn) {
    var luego = function () {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
      else setTimeout(fn, 300);
    };
    if (document.readyState === 'complete') luego();
    else window.addEventListener('load', luego, { once: true });
  }

  /* Espera a que la bienvenida se haya ido. En la portada es el video; en
     las demas, la cortina de entrada, que dura 1,6s clavados (15-lienzo-
     claro.css) y no sale si se llega con ancla o con menos movimiento. */
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
      /* Por si el video no llegara a avisar: el splash mas largo se retira
         a los 9s. */
      setTimeout(una, 12000);
      return;
    }
    var cortina = document.querySelector('.ns-umbral');
    var conCortina = cortina && !raiz.classList.contains('sin-umbral') && !quietud.matches;
    setTimeout(una, conCortina ? 1800 : 400);
  }

  /* ---- Adelante ------------------------------------------------------------ */

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
    /* Ya acepto en otra visita: los pixeles, sin aviso y sin libreria. */
    enReposo(activarPixeles);
  } else if (decision === null) {
    trasLaBienvenida(function () {
      cargarLibreria().then(function () { return arrancar(true); }).catch(function () {});
    });
  }
  /* decision === false: rechazo. No se carga nada. */
})();
