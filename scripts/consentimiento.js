(function () {
  'use strict';

  /* El aviso de cookies y los pixeles de publicidad (Meta y Google Ads).

     Los dos pixeles NO estan en el HTML. No hay un <script> de Meta ni de
     Google en ninguna pagina, ni bloqueado ni esperando: el codigo que los
     pide lo escribe este guion, y solo cuando la politica de `antesDeDecidir`
     se lo permite.

     Esa politica es la decision del cliente y esta en un solo sitio, abajo.
     Hoy vale 'activo': mientras la persona no responda al aviso, los pixeles
     miden. En cuanto pulsa "Rechazar" se apagan, se borran sus cookies y la
     pagina se recarga sin ellos; y si ya habia rechazado en otra visita, aqui
     no se carga absolutamente nada. Poner 'espera' devuelve el guion al
     comportamiento estricto —nada hasta que alguien acepte— sin tocar nada
     mas. La pagina de privacidad cuenta exactamente esto, y las dos cosas
     tienen que seguir diciendo lo mismo: si se cambia el interruptor, se
     cambia la seccion 7 de privacidad.

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

  /* =========================================================================
     ===  AQUI  ==============================================================
     ===  Es el unico sitio del proyecto donde se escriben el pixel de Meta
     ===  y la etiqueta de Google. No hay que tocar ningun HTML: los
     ===  identificadores se escriben aqui, se guarda, se corre
     ===
     ===      node herramientas/construir.js
     ===
     ===  y con eso las seis paginas quedan midiendo.
     ===
     ===  Vacios —como estan ahora— el aviso de cookies sale igual, el boton
     ===  de la esquina funciona igual y la decision de cada visitante queda
     ===  guardada: lo unico que no ocurre es la llamada a Meta y a Google,
     ===  porque todavia no hay a quien llamar. El dia que se rellenen, quien
     ===  ya dijo que no sigue diciendo que no.
     ========================================================================= */
  var AJUSTES = {
    /* META (Facebook / Instagram)
       Donde sale: Administrador de eventos -> Origenes de datos. Es el numero
       largo que hay bajo el nombre del pixel, sin letras ni espacios.
       Ejemplo:  metaPixel: '123456789012345'
       (El token de la API de Conversiones NO va aqui: ese es de servidor y
        este guion corre en el navegador.) */
    metaPixel: '',

    /* GOOGLE ADS
       Donde sale: Google Ads -> Herramientas -> Administrador de datos ->
       Tu etiqueta de Google. Es el identificador con su prefijo, tal cual:
       'AW-...' si viene de Ads, 'GT-...' si es una etiqueta de Google, y
       tambien vale un 'G-...' de Analytics.
       Ejemplo:  googleAds: 'AW-123456789' */
    googleAds: '',

    /* LA CONVERSION DE CONTACTO — opcional, y solo de Google Ads.
       Donde sale: Google Ads -> Objetivos -> Conversiones -> la accion que se
       quiera contar -> "Configurar con la etiqueta". Son dos trozos separados
       por una barra: el identificador de la cuenta y la etiqueta.
       Ejemplo:  googleAdsContacto: 'AW-123456789/AbCdEfGhIj'
       Con esto puesto, cada vez que alguien pulse WhatsApp, llame o escriba
       un correo se cuenta como conversion. A Meta se le avisa igual (evento
       'Contact') sin necesidad de configurar nada. Nunca se envia el nombre
       ni el mensaje: solo por que canal se contacto. */
    googleAdsContacto: '',
    /* Que pasa mientras la persona no ha contestado al aviso:
         'activo' — los pixeles miden desde la primera pagina. Es lo que hay
                    hoy. Rechazar los apaga y borra sus cookies.
         'espera' — no se carga nada de Meta ni de Google hasta que alguien
                    pulse "Aceptar". Es lo mas conservador.
       Cambiar esto obliga a cambiar la seccion 7 de privacidad.html, que lo
       cuenta tal cual. */
    antesDeDecidir: 'activo',
    // Subirla (2, 3...) vuelve a preguntar a todo el mundo: hay que hacerlo si
    // se anade otro servicio que use cookies.
    revision: 1
  };

  /* Si hay a quien llamar. El aviso NO depende de esto: sale igual, porque lo
     que pregunta es si se permite la publicidad, y esa respuesta hay que
     tenerla guardada antes de que exista el primer pixel. Lo que depende de
     esto es unicamente que se pida el guion de Meta o el de Google. */
  var hayPixeles = !!(AJUSTES.metaPixel || AJUSTES.googleAds);
  var raiz = document.documentElement;
  var botonesPreferencias = document.querySelectorAll('[data-preferencias-cookies]');

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
    /* Modo de consentimiento de Google, declarado antes de pedir su guion,
       que es el unico momento en que sirve de algo. A esta funcion solo se
       llega cuando la publicidad puede correr —aceptada, o todavia sin
       contestar con la politica en 'activo'—, asi que se declara concedida;
       si luego alguien rechaza, `apagarPixeles()` manda el `update` a denied
       y recarga. La analitica no se usa en este sitio y va siempre denegada. */
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

  /* ---- Apagarlos ----------------------------------------------------------
     Un guion que ya esta en la pagina no se puede descargar: `fbq` y `gtag`
     siguen ahi hasta que la pagina se recarga. Asi que apagar es borrar sus
     cookies y recargar, que es tambien lo que hace CookieConsent cuando
     alguien retira un permiso que habia dado. La diferencia es que aqui hay
     que hacerlo tambien cuando nunca hubo permiso —con `antesDeDecidir` en
     'activo', los pixeles corren antes de que nadie diga nada— y eso la
     libreria no lo contempla: para ella no ha cambiado ninguna categoria. */

  function borrarCookiesDePublicidad() {
    var nombres = document.cookie.split(';')
      .map(function (trozo) { return trozo.split('=')[0].trim(); })
      .filter(function (nombre) { return /^_fbp$|^_fbc$|^_gcl_/.test(nombre); });
    if (!nombres.length) return;

    /* Meta y Google las escriben en el dominio y, a veces, en el dominio de
       segundo nivel. Se borra en los dos, y sin dominio, que es un tercer
       sitio donde pueden estar. */
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
    /* Decirselo a Google antes de irnos: si algo suyo sigue en cola, que sepa
       que ya no tiene permiso. */
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
    }
    borrarCookiesDePublicidad();
    /* La decision ya esta guardada en `cc_cookie` cuando se llega aqui, asi
       que al volver a cargar no se pide nada y el aviso no reaparece. */
    location.reload();
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
      /* El aviso dice una cosa u otra segun lo que este pasando de verdad:
         si los pixeles ya estan midiendo, o si todavia no hay ninguno. */
      yaMiden: pixelesActivos,
      hayPixeles: hayPixeles,
      alAceptar: activarPixeles,
      alRechazar: apagarPixeles
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
     las demas, la cortina de entrada, que dura 2,8s clavados (15-lienzo-
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
    setTimeout(una, conCortina ? 3000 : 400);
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
    /* Todavia no ha contestado. Con la politica en 'activo' los pixeles
       arrancan ya, en cuanto el navegador esta libre, y el aviso sale
       despues, con la bienvenida retirada: el orden importa poco para lo que
       se mide y mucho para lo que se ve. */
    if (AJUSTES.antesDeDecidir === 'activo') enReposo(activarPixeles);
    trasLaBienvenida(function () {
      cargarLibreria().then(function () { return arrancar(true); }).catch(function () {});
    });
  }
  /* decision === false: rechazo en otra visita. No se carga nada, ni pixeles
     ni libreria, y no se vuelve a preguntar hasta que caduque su decision. */
})();
