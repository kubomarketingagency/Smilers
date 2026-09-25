window.SmilersVideo = (function () {
  'use strict';

  /* =========================================================================
     Los videos de los testimonios.

     Los ocho testimonios de la portada son videos verticales de YouTube. En la
     pagina no hay ningun <iframe> escrito: el reproductor se crea la primera
     vez que alguien le da al play, y a partir de ahi es SIEMPRE EL MISMO. Al
     cambiar de testimonio no se tira y se hace otro: se le pide el video
     nuevo (`loadVideoById`).

     CADA VIDEO EMPIEZA EN PAUSA. Cuando la esfera se para en un testimonio
     sale su fotograma con el play de la casa encima, y el aro respira
     despacio (13-testimonios.css); rueda cuando se pulsa. Hasta ese primer
     play no se pide nada a YouTube: ni su API ni el reproductor. Es lo que
     dice la politica de privacidad («No se carga solo»), y es ademas lo que
     deja girar la esfera sin cargar con un reproductor entero —su iframe es
     un megabyte largo de guion que en el telefono corre en el mismo hilo que
     la pagina—. Mientras se pide, el play lleva un filo de oro que gira.

     Lo de un solo reproductor no es una optimizacion, es lo que hace que se
     vea bien. Creando uno por testimonio, a partir del segundo YouTube servia
     la **interfaz de Shorts** —su logotipo, el boton de me gusta, el de
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
       que se pide y arranca, en cada salto y mientras esta en pausa, YouTube
       ensena lo suyo.

     Ojo con `loop=1&playlist=ID`, que es la forma documentada de repetir: en
     un video subido como Short le cambia la cara al reproductor y saca la
     interfaz de Shorts entera. Se probo y se descarto. La vuelta la da el
     guion, rebobinando medio segundo antes del final (`vigilar`).

     EL SONIDO EMPIEZA APAGADO: el play lo pulsa la pagina y no el iframe, y
     un video que arranca asi solo puede hacerlo callado (en iOS, siempre).
     Quien quiera oirlo pulsa el boton, y a partir de ahi los demas ya salen
     sonando, porque la eleccion se recuerda mientras dure la visita.

     Se pide a `youtube-nocookie.com`, que es el dominio que YouTube mantiene
     para no dejar nada en el navegador hasta que el video arranca.
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
  /* Lo que se espera a que un video pedido ruede antes de darlo por parado y
     devolver el play: la primera vez hay que traer la API y el reproductor
     entero, y en una conexion lenta eso son varios segundos. */
  var ESPERA = 9000;

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

  function pintarBoton(caja) {
    var boton = caja && caja.querySelector('[data-video-son]');
    if (!boton) return;
    boton.classList.toggle('esta-callado', !conSonido);
    boton.setAttribute('aria-pressed', conSonido ? 'true' : 'false');
    boton.setAttribute('aria-label', conSonido ? 'Quitar el sonido' : 'Activar el sonido');
  }

  /* Los tres estados que ve el CSS, y solo uno a la vez: `video-parado`
     (en pausa: el play y el aro respirando), `video-pidiendo` (se le ha dado
     al play y todavia no rueda: el play con su filo girando) y `video-listo`
     (rueda: se aparta el fotograma). */
  function ponerEstado(caja, estado) {
    caja.classList.toggle('video-parado', estado === 'parado');
    caja.classList.toggle('video-pidiendo', estado === 'pidiendo');
    caja.classList.toggle('video-listo', estado === 'listo');
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
      /* En pausa no hay nada que mirar: el fotograma esta delante y encima el
         play de la casa. */
      if (caja.__pausa || !caja.__video) return;
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

      if (!rodando) {
        /* Se le pidio y no rueda. Si esta cargando (3) o arrancando (-1) se
           le deja; si esta quieto (pausado por el navegador, que para los
           iframes que llevan un rato sin verse, o sin arrancar) se le vuelve
           a pedir un par de veces. Y si pasado el plazo sigue sin rodar se
           deja en pausa, con el play fuera: quien no deja arrancar un video
           solo (iOS con el ahorro de energia puesto) no va a cambiar de idea,
           y para eso esta el boton. */
        ponerEstado(caja, 'pidiendo');
        if (Date.now() - (caja.__pedido || 0) > ESPERA) {
          caja.__pausa = true;
          ponerEstado(caja, 'parado');
          return;
        }
        if (estado !== 3 && estado !== -1 && (caja.__ruegos || 0) < 3) {
          caja.__ruegos = (caja.__ruegos || 0) + 1;
          r.playVideo();
        }
        return;
      }

      /* Rueda. El plazo cuenta desde la ultima vez que rodo: si luego se
         queda cargando a medias, se le vuelve a esperar entero. */
      caja.__pedido = Date.now();
      caja.__rodo = true;
      caja.__ruegos = 0;
      ponerEstado(caja, 'listo');
      /* El fotograma se aparta EN CUANTO el video rueda de verdad, sin
         esperar a que se cumpla el plazo de `taparUnMomento`: ese plazo es un
         tope, no un tiempo de espera. */
      if (reloj > 0.25 && caja.classList.contains('saltando')) {
        clearTimeout(caja.__volver);
        caja.classList.remove('saltando');
      }
      var largo = r.getDuration();
      if (!(largo > 0) || reloj < largo - MARGEN) return;
      taparUnMomento(caja);
      r.seekTo(0, true);
    }, 180);
  }

  /* El reproductor, la primera vez que se le da al play. Hasta aqui no se ha
     pedido nada a YouTube. */
  function crear(caja) {
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
      var id = caja.__video;
      caja.__reproductor = new window.YT.Player(semilla, {
        host: SERVIDOR,
        videoId: id,
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
            caja.__cargado = id;
            /* Mientras llegaba, la esfera puede haberse llevado el testimonio
               o quien miraba puede haberlo vuelto a pausar: entonces se queda
               quieto. Y si ya toca otro, se le pide ese. */
            if (caja.__pausa || !caja.__video) {
              ev.target.pauseVideo();
            } else if (caja.__video !== id) {
              caja.__cargado = caja.__video;
              ev.target.loadVideoById(caja.__video);
            } else {
              ev.target.playVideo();
            }
            vigilar(caja);
          },
          /* 0 = terminado, y aqui no deberia llegar nunca: la vuelta se da
             antes (ver `vigilar`). Si llega, se da igual. */
          onStateChange: function (ev) {
            if (ev.data === 0) { ev.target.seekTo(0, true); ev.target.playVideo(); }
          }
        }
      });
      if (cajas.indexOf(caja) < 0) cajas.push(caja);
    });
  }

  /* Un testimonio nuevo delante: su fotograma, el play y nada mas. */
  function montar(caja, id) {
    if (!caja || !id) return;
    if (caja.__video === id) return;
    caja.__video = id;
    caja.__pausa = true;
    caja.classList.add('tiene-video');
    caja.classList.remove('saltando');
    clearTimeout(caja.__volver);
    ponerEstado(caja, 'parado');
    pintarBoton(caja);
  }

  /* Apagar es dejarlo quieto y tapado: la tarjeta entera se esconde con la
     esfera girando, y ahi no hay nada que ver. En pausa y tapado por el
     fotograma, YouTube no ensena nada al soltarlo luego. */
  function apagar(caja) {
    if (!caja || !caja.__video) return false;
    caja.__video = null;
    caja.__pausa = true;
    caja.classList.remove('tiene-video', 'video-listo', 'video-pidiendo', 'saltando', 'video-parado');
    clearTimeout(caja.__volver);
    var r = caja.__reproductor;
    if (r && r.pauseVideo) { try { r.pauseVideo(); } catch (e) {} }
    return true;
  }

  /* Cuando la seccion deja la pantalla. */
  function parar(caja) { apagar(caja); }

  /* El fotograma de cada video, el mismo que lleva su tarjeta en la esfera. */
  function poner(caja, foto) {
    var img = caja && caja.querySelector('[data-video-poster]');
    if (img && foto && img.getAttribute('src') !== foto) img.setAttribute('src', foto);
  }

  /* Por si el reproductor no llega nunca (sin red, o YouTube bloqueado): ahi
     no hay vigia que lo mire, y el filo giraria para siempre. Pasado el
     plazo sin haber rodado, vuelve el play. */
  function plazo(caja) {
    clearTimeout(caja.__plazo);
    caja.__plazo = setTimeout(function () {
      if (caja.__pausa || !caja.__video || caja.__rodo) return;
      caja.__pausa = true;
      ponerEstado(caja, 'parado');
      var r = caja.__reproductor;
      if (r && r.pauseVideo) { try { r.pauseVideo(); } catch (e) {} }
    }, ESPERA);
  }

  /* PLAY Y PAUSA, con el dedo o con el raton.

     Quien recoge el toque es el escudo, la capa que ya estaba por delante del
     reproductor para que YouTube no viera el raton: ahi el clic no llega a
     YouTube —que pausaria por su cuenta y sacaria su interfaz entera— sino
     aqui. Y el play de la casa hace lo mismo.

     Un toque cambia entre «quiero verlo» y «no»: en pausa lo suelta, y
     rodando o pidiendose lo para. Al cambiar de testimonio vuelve a pausa. */
  function alternar(caja) {
    if (!caja || !caja.__video) return;
    if (caja.__pausa) {
      caja.__pausa = false;
      caja.__ruegos = 0;
      caja.__quieto = 0;
      caja.__pedido = Date.now();
      caja.__rodo = false;
      ponerEstado(caja, 'pidiendo');
      plazo(caja);
      var r = caja.__reproductor;
      if (!r) { crear(caja); return; }
      if (!r.playVideo) return; /* se esta creando: al llegar, rueda */
      try { if (conSonido) r.unMute(); else r.mute(); } catch (e) {}
      /* Si el que tiene cargado es otro, se le pide este (y arranca solo);
         si es este, sigue por donde se quedo. */
      if (caja.__cargado !== caja.__video) {
        caja.__cargado = caja.__video;
        taparUnMomento(caja, 2000);
        r.loadVideoById(caja.__video);
      } else {
        taparUnMomento(caja, 900);
        r.playVideo();
      }
      return;
    }
    caja.__pausa = true;
    clearTimeout(caja.__volver);
    caja.classList.add('saltando');
    ponerEstado(caja, 'parado');
    var rep = caja.__reproductor;
    if (rep && rep.pauseVideo) { try { rep.pauseVideo(); } catch (e) {} }
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
    montar: montar,
    apagar: apagar,
    parar: parar,
    poner: poner
  };
})();
