window.SmilersVideo = (function () {
  'use strict';

  /* =========================================================================
     Los videos de los testimonios.

     Los ocho testimonios de la portada son videos verticales de YouTube. En la
     pagina no hay ningun <iframe> escrito: el reproductor se crea la primera
     vez que la esfera se para en un testimonio, y a partir de ahi es SIEMPRE
     EL MISMO. Al cambiar de testimonio no se tira y se hace otro: se le pide
     el video nuevo (`loadVideoById`).

     Eso ultimo no es una optimizacion, es lo que hace que se vea bien. Creando
     un reproductor por testimonio, a partir del segundo YouTube servia la
     **interfaz de Shorts** —su logotipo, el boton de me gusta, el de
     compartir, el canal y el titulo—, y en el telefono la servia desde el
     primero. Con un solo reproductor que cambia de video, no aparece.

     LO QUE SE VE ES EL VIDEO Y NADA MAS. El reproductor trae encima su
     titulo, su canal, la marca de agua y los mandos, y al pausar saca ademas
     la rejilla de videos relacionados. Se quita con tres cosas:

     - Los parametros: `controls=0` (sin barra de mandos), `modestbranding=1`,
       `rel=0`, `disablekb=1`, `fs=0` e `iv_load_policy=3`.
     - Un escudo transparente por delante del iframe (ver el CSS). Lo de
       arriba lo quita de la vista, pero YouTube vuelve a sacar el titulo en
       cuanto el raton pasa por encima y a pausar con el clic —y pausado se ve
       todo—. El escudo se come el raton y el dedo, asi que YouTube no se
       entera de que hay nadie ahi.
     - El fotograma por delante siempre que el video no este rodando: entre
       que se pide y arranca, y en cada salto, YouTube ensena lo suyo.

     Ojo con `loop=1&playlist=ID`, que es la forma documentada de repetir: en
     un video subido como Short le cambia la cara al reproductor y saca la
     interfaz de Shorts entera. Se probo y se descarto. La vuelta la da el
     guion, rebobinando medio segundo antes del final (`vigilar`).

     EL SONIDO EMPIEZA APAGADO, y no por gusto: ningun navegador deja que un
     video arranque solo con sonido. Quien quiera oirlo pulsa el boton, y a
     partir de ahi los demas ya salen sonando, porque la eleccion se recuerda
     mientras dure la visita.

     Se pide a `youtube-nocookie.com`, que es el dominio que YouTube mantiene
     para no dejar nada en el navegador hasta que el video arranca. Aqui
     arranca solo, asi que se deja constancia en la politica de privacidad.
     ========================================================================= */

  var API = 'https://www.youtube.com/iframe_api';
  var SERVIDOR = 'https://www.youtube-nocookie.com';
  var PARAMETROS = {
    autoplay: 1,
    mute: 1,
    controls: 0,
    modestbranding: 1,
    rel: 0,
    playsinline: 1,
    disablekb: 1,
    fs: 0,
    iv_load_policy: 3
  };
  var MARGEN = 0.45;

  var conSonido = false;
  var apiPedida = false;
  var enEspera = [];
  var cajas = [];

  function conApi(fn) {
    if (window.YT && window.YT.Player) { fn(); return; }
    enEspera.push(fn);
    if (apiPedida) return;
    apiPedida = true;
    /* La API avisa por una funcion global. Si algo mas la hubiera puesto, se
       llama tambien: aqui no la usa nadie, pero pisarla sin mirar es como se
       rompen las paginas ajenas. */
    var antes = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof antes === 'function') antes();
      var cola = enEspera;
      enEspera = [];
      for (var i = 0; i < cola.length; i++) cola[i]();
    };
    var guion = document.createElement('script');
    guion.src = API;
    guion.async = true;
    document.head.appendChild(guion);
  }

  /* Se pide en cuanto la seccion esta cerca y no cuando hace falta: la primera
     vez la API tarda medio segundo largo en llegar, y ese medio segundo se
     veria como un hueco donde tendria que haber un video. */
  function preparar() { conApi(function () {}); }

  function pintarBoton(caja) {
    var boton = caja && caja.querySelector('[data-video-son]');
    if (!boton) return;
    boton.classList.toggle('esta-callado', !conSonido);
    boton.setAttribute('aria-pressed', conSonido ? 'true' : 'false');
    boton.setAttribute('aria-label', conSonido ? 'Quitar el sonido' : 'Activar el sonido');
  }

  /* El fotograma por delante un momento. Rebobinar le hace ensenar un
     instante su glifo; cambiar de video le hace ensenar el titulo y el canal
     encima, y eso dura casi dos segundos. De ahi las dos cifras. */
  function taparUnMomento(caja, cuanto) {
    caja.classList.add('saltando');
    clearTimeout(caja.__volver);
    caja.__volver = setTimeout(function () {
      caja.classList.remove('saltando');
    }, cuanto || 700);
  }

  /* La vuelta se da ANTES de que el video acabe. Dejar que llegue al final
     tiene un precio: YouTube saca su pantalla de despedida y, en un video
     subido como Short, la interfaz de Shorts entera; y una vez que la saca ya
     no la suelta aunque el video vuelva a rodar. */
  function vigilar(caja) {
    if (caja.__vigia) return;
    caja.__vigia = setInterval(function () {
      var r = caja.__reproductor;
      if (!r || !r.getDuration) return;
      /* El fotograma se aparta solo mientras el video RUEDA de verdad, y eso
         se mira aqui y no en `onStateChange`: los avisos de la API llegan
         tarde o no llegan —al rebobinar, al cambiar de video, al volver de
         una pausa— y en ese hueco YouTube ensena su titulo y su canal. Mirarlo
         cada dos por tres no cuesta nada y no se escapa ninguno. */
      /* No basta con preguntar el estado: hay veces en que dice que esta
         rodando (1) y el video esta quieto —iOS con el ahorro de energia
         puesto para la reproduccion y YouTube no se entera—, y ahi se queda
         su glifo de pausa en medio de la cara. Asi que se mira el reloj: si
         no avanza en tres vueltas seguidas, esta parado, diga lo que diga. */
      var estado = r.getPlayerState ? r.getPlayerState() : -1;
      var reloj = r.getCurrentTime ? r.getCurrentTime() : 0;
      if (estado === 1 && Math.abs(reloj - (caja.__reloj || 0)) < 0.01) {
        caja.__quieto = (caja.__quieto || 0) + 1;
      } else {
        caja.__quieto = 0;
      }
      caja.__reloj = reloj;
      var rodando = estado === 1 && caja.__quieto < 3;
      /* Pausado a mano: ni se le ruega que arranque ni se le rebobina. El
         fotograma se queda delante —que es lo que tapa lo que YouTube saca
         en cuanto un video se para— y encima queda el play de la casa. */
      if (caja.__pausa) {
        caja.classList.remove('video-listo');
        caja.classList.add('video-parado');
        return;
      }
      caja.classList.toggle('video-listo', !!(rodando && caja.__video));
      /* Y si esta parado de verdad, sale el boton de play de la casa. */
      caja.classList.toggle('video-parado', !!(caja.__video && !rodando));
      /* El fotograma se aparta EN CUANTO el video rueda de verdad, sin
         esperar a que se cumpla el plazo de `taparUnMomento`: ese plazo es un
         tope, no un tiempo de espera. Con los dos segundos fijos del cambio
         de video, cada testimonio empezaba dos segundos tarde aunque YouTube
         estuviera dando desde el primero. */
      if (rodando && reloj > 0.25 && caja.classList.contains('saltando')) {
        clearTimeout(caja.__volver);
        caja.classList.remove('saltando');
      }
      if (!caja.__video) return;
      /* Antes de rendirse se le pide un par de veces mas. No lo pausa nadie
         de aqui —soltar un video pausado es justo lo que hace salir el
         titulo—, pero el navegador si lo para por su cuenta cuando el iframe
         lleva un rato sin verse. Si a la tercera sigue parado, se deja: quien
         no deja arrancar un video solo no va a cambiar de idea, y para eso
         esta el boton. */
      if (!rodando && (caja.__ruegos || 0) < 3) {
        caja.__ruegos = (caja.__ruegos || 0) + 1;
        taparUnMomento(caja, 900);
        r.playVideo();
        return;
      }
      if (rodando) caja.__ruegos = 0;
      var largo = r.getDuration();
      if (!(largo > 0) || r.getCurrentTime() < largo - MARGEN) return;
      taparUnMomento(caja);
      r.seekTo(0, true);
    }, 180);
  }

  function montar(caja, id, quien) {
    if (!caja || !id) return;
    if (caja.__video === id) return;
    caja.__video = id;
    caja.__ruegos = 0;
    caja.__quieto = 0;
    /* Cada testimonio empieza solo, aunque el anterior se dejara pausado. */
    caja.__pausa = false;
    caja.classList.add('tiene-video');
    pintarBoton(caja);

    var r = caja.__reproductor;
    if (r && r.loadVideoById) {
      /* Si el que ya tiene cargado es este, no se vuelve a pedir ni se toca:
         estaba rodando, callado, detras del telon. Pedirlo otra vez —o
         siquiera pausarlo y soltarlo— hace que YouTube ensene su titulo y su
         canal encima un par de segundos. */
      if (caja.__cargado !== id) {
        caja.__cargado = id;
        taparUnMomento(caja, 2000);
        r.loadVideoById(id);
      } else if (r.getPlayerState && r.getPlayerState() !== 1) {
        taparUnMomento(caja, 1400);
        r.playVideo();
      }
      if (conSonido) r.unMute(); else r.mute();
      return;
    }
    if (caja.__creando) return;
    caja.__creando = true;

    var semilla = document.createElement('div');
    caja.appendChild(semilla);

    conApi(function () {
      /* Una copia y no el objeto de arriba: la API escribe dentro del que se
         le pasa (le mete lo suyo, `enablejsapi` y demas). */
      var suyos = {};
      for (var clave in PARAMETROS) {
        if (Object.prototype.hasOwnProperty.call(PARAMETROS, clave)) suyos[clave] = PARAMETROS[clave];
      }
      caja.__reproductor = new window.YT.Player(semilla, {
        host: SERVIDOR,
        videoId: caja.__video || id,
        playerVars: suyos,
        events: {
          onReady: function (ev) {
            var marco = ev.target.getIframe();
            if (marco) {
              marco.className = 'tst-video__iframe';
              marco.setAttribute('title', 'Testimonio en video');
              marco.setAttribute('tabindex', '-1');
            }
            if (conSonido) ev.target.unMute(); else ev.target.mute();
            /* La esfera puede haberse llevado el testimonio mientras llegaba
               la API: entonces se queda quieto, esperando al siguiente. */
            caja.__cargado = caja.__video || id;
            if (caja.__video) ev.target.playVideo(); else ev.target.pauseVideo();
            vigilar(caja);
          },
          /* El fotograma se quita cuando el video esta DANDO (1), no cuando el
             reproductor esta listo: entre una cosa y otra YouTube ensena su
             titulo y su canal. Mientras no rueda, delante va el fotograma. */
          onStateChange: function (ev) {
            /* 0 = terminado, y aqui no deberia llegar nunca: la vuelta se da
               antes (ver `vigilar`). Si llega, se da igual. */
            if (ev.data === 0) { ev.target.seekTo(0, true); ev.target.playVideo(); }
          }
        }
      });
      if (cajas.indexOf(caja) < 0) cajas.push(caja);
    });
  }

  /* Apagar es callar y tapar, no pausar ni tirar el reproductor.

     Tirarlo obligaba a crear otro para el testimonio siguiente, y de ahi
     salia la interfaz de Shorts. Pausarlo y volver a soltarlo tambien tiene
     precio: YouTube ensena su titulo y su canal un par de segundos cada vez
     que se le suelta, y eso pasaba en cada giro de la esfera. Rodando y
     callado detras del telon no pasa nada de eso, y el telon —la tarjeta
     entera— esta escondido.

     Quien lo para de verdad es `parar`, cuando la seccion deja la pantalla:
     ahi ya no hay giro que estropear. */
  function apagar(caja) {
    if (!caja || !caja.__video) return false;
    caja.__video = null;
    caja.__pausa = false;
    caja.classList.remove('tiene-video', 'video-listo', 'saltando', 'video-parado');
    clearTimeout(caja.__volver);
    var r = caja.__reproductor;
    if (r && r.mute) { try { r.mute(); } catch (e) {} }
    return true;
  }

  function parar(caja) {
    if (!caja) return;
    apagar(caja);
    var r = caja.__reproductor;
    if (r && r.pauseVideo) { try { r.pauseVideo(); } catch (e) {} }
  }

  /* El fotograma de cada video, el mismo que lleva su tarjeta en la esfera. */
  function poner(caja, foto) {
    var img = caja && caja.querySelector('[data-video-poster]');
    if (img && foto && img.getAttribute('src') !== foto) img.setAttribute('src', foto);
  }

  /* PAUSA Y SIGUE, con el dedo o con el raton.

     Quien recoge el toque es el escudo, la capa que ya estaba por delante del
     reproductor para que YouTube no viera el raton: ahi el clic no llega a
     YouTube —que pausaria por su cuenta y sacaria su interfaz entera— sino
     aqui. Y el play de la casa, que ya salia cuando el video se quedaba
     parado por su cuenta, sirve ademas para volver a soltarlo.

     Pausar a mano es lo unico que para un video dentro de la escena: mientras
     `__pausa` este puesto, el vigia no le ruega que arranque. Al cambiar de
     testimonio se olvida, que es lo que hace que el siguiente empiece solo.

     El gesto tiene que ser de verdad ademas por iOS: con el ahorro de energia
     puesto no deja arrancar ningun video que no pida el dedo. */
  function alternar(caja) {
    var r = caja && caja.__reproductor;
    if (!r || !r.playVideo) return;
    if (caja.__pausa) {
      caja.__pausa = false;
      caja.__ruegos = 0;
      caja.__quieto = 0;
      taparUnMomento(caja, 900);
      try { if (conSonido) r.unMute(); else r.mute(); } catch (e) {}
      r.playVideo();
      return;
    }
    caja.__pausa = true;
    clearTimeout(caja.__volver);
    caja.classList.add('saltando', 'video-parado');
    caja.classList.remove('video-listo');
    try { r.pauseVideo(); } catch (e) {}
  }

  document.addEventListener('click', function (evento) {
    var destino = evento.target;
    if (!destino || destino.nodeType !== 1 || !destino.closest) return;
    var mando = destino.closest('[data-video-play], [data-video-toque]');
    if (!mando) return;
    evento.preventDefault();
    var marco = mando.closest('.tst-video__marco') || mando.parentNode;
    var caja = marco && marco.querySelector('[data-video-hueco]');
    if (caja) alternar(caja);
  });

  document.addEventListener('click', function (evento) {
    var destino = evento.target;
    if (!destino || destino.nodeType !== 1 || !destino.closest) return;
    var boton = destino.closest('[data-video-son]');
    if (!boton) return;
    evento.preventDefault();
    conSonido = !conSonido;
    for (var i = 0; i < cajas.length; i++) {
      var r = cajas[i].__reproductor;
      if (r && r.unMute) { if (conSonido) r.unMute(); else r.mute(); }
      pintarBoton(cajas[i]);
    }
    pintarBoton(boton.parentNode);
  });

  return {
    preparar: preparar,
    montar: montar,
    apagar: apagar,
    parar: parar,
    poner: poner
  };
})();
