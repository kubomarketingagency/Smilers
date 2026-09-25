window.SmilersVideo = (function () {
  'use strict';

  /* =========================================================================
     Los videos de los testimonios.

     Los ocho testimonios de la portada son videos verticales que viven en el
     propio sitio (`video-testimonios/`, en MP4), como las fotos. Hasta el
     25-9-2026 eran el reproductor de YouTube metido en un iframe, y en el
     telefono eso no daba para lo que la clinica pedia —darle al play y que
     suene, a la primera—, por dos cosas que YouTube no deja arreglar:

     - EL SONIDO. En iOS un video solo puede arrancar sonando si arranca DENTRO
       del toque. El reproductor de YouTube no existia hasta el primer play
       (traerlo antes era cargar un megabyte de guion con la esfera girando, y
       la politica de privacidad dice que no se carga solo), asi que cuando
       llegaba el toque ya habia pasado y el video tenia que arrancar callado.
     - LA ESPERA. Ese primer play pedia la API de YouTube, luego su
       reproductor y luego el video: dos o tres segundos en un telefono con el
       fotograma quieto y un filo girando.

     Con un <video> de la casa las dos se van: el toque llama a `play()` en el
     mismo momento, el navegador lo deja sonar porque lo ha pedido un dedo, y
     el archivo empieza a llegar ahi mismo (va con el indice al principio,
     `faststart`, asi que rueda en cuanto llegan los primeros segundos). Y de
     paso se va todo lo que habia que hacer para esconder la interfaz de
     YouTube: el escudo contra su titulo, la vuelta dada a mano antes del final
     para que no sacara la de Shorts, el vigia que miraba si de verdad rodaba.
     Un <video> sin `controls` no ensena nada mas que el video, y `loop` lo
     repite solo.

     Hay UN SOLO <video> y se reutiliza: al cambiar de testimonio se le cambia
     la fuente. Se crea al montar el primero, en pausa, con `preload=metadata`:
     el navegador pide la cabecera del archivo (unas decenas de KB) y nada
     mas, asi que girar la esfera no descarga videos, pero cuando llega el
     toque ya sabe lo que tiene entre manos. iOS no hace caso de `preload` y
     espera al toque para pedir nada; ahi tampoco hace falta.

     CADA VIDEO EMPIEZA EN PAUSA: con la esfera parada en un testimonio sale su
     fotograma con el play de la casa encima, y el aro respira despacio
     (13-testimonios.css). Rueda cuando se pulsa. Mientras llega el primer
     fotograma, el play lleva un filo de oro que gira.

     EL SONIDO VA PUESTO desde el principio. El boton de al lado lo quita (y lo
     devuelve), y la eleccion se recuerda mientras dure la visita.
     ========================================================================= */

  var conSonido = true;
  var cajas = [];

  function pintarBoton(caja) {
    var boton = caja && caja.parentNode && caja.parentNode.parentNode &&
                caja.parentNode.parentNode.querySelector('[data-video-son]');
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

  /* El <video>, la primera vez que se monta un testimonio. Va por debajo del
     fotograma, que lo tapa hasta que rueda. Los avisos del propio video son
     los que mueven los estados: `playing` es que ya se ve, `waiting` que se
     ha quedado esperando datos (una conexion floja a media reproduccion) y
     `pause` que esta quieto, lo haya parado quien sea. */
  function reproductor(caja) {
    if (caja.__reproductor) return caja.__reproductor;
    var v = document.createElement('video');
    v.className = 'tst-video__clip';
    v.preload = 'metadata';
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('disableremoteplayback', '');
    v.setAttribute('tabindex', '-1');
    v.setAttribute('aria-hidden', 'true');
    v.muted = !conSonido;

    v.addEventListener('playing', function () {
      if (!caja.__pausa) ponerEstado(caja, 'listo');
    });
    v.addEventListener('waiting', function () {
      if (!caja.__pausa) ponerEstado(caja, 'pidiendo');
    });
    v.addEventListener('pause', function () {
      caja.__pausa = true;
      if (caja.__video) ponerEstado(caja, 'parado');
    });
    /* Sin red o con el archivo roto: vuelve el play, y el siguiente toque lo
       intenta otra vez desde el principio. */
    v.addEventListener('error', function () {
      caja.__pausa = true;
      if (caja.__video) ponerEstado(caja, 'parado');
    });

    caja.insertBefore(v, caja.firstChild);
    caja.__reproductor = v;
    if (cajas.indexOf(caja) < 0) cajas.push(caja);
    return v;
  }

  /* Un testimonio nuevo delante: su fotograma, el play y nada mas. */
  function montar(caja, fuente) {
    if (!caja || !fuente) return;
    if (caja.__video === fuente) return;
    caja.__video = fuente;
    caja.__pausa = true;
    caja.classList.add('tiene-video');
    ponerEstado(caja, 'parado');
    pintarBoton(caja);
    var v = reproductor(caja);
    if (!v.paused) v.pause();
    if (v.getAttribute('src') !== fuente) v.setAttribute('src', fuente);
  }

  /* Apagar es dejarlo quieto, tapado y al principio: la tarjeta entera se
     esconde con la esfera girando, y la proxima vez que se vuelva a este
     testimonio empieza desde el principio, como los demas. */
  function apagar(caja) {
    if (!caja || !caja.__video) return false;
    caja.__video = null;
    caja.__pausa = true;
    caja.classList.remove('tiene-video', 'video-listo', 'video-pidiendo', 'video-parado');
    var v = caja.__reproductor;
    if (v) {
      if (!v.paused) v.pause();
      try { v.currentTime = 0; } catch (e) {}
    }
    return true;
  }

  /* Cuando la seccion deja la pantalla. */
  function parar(caja) { apagar(caja); }

  /* El fotograma de cada video, el mismo que lleva su tarjeta en la esfera. */
  function poner(caja, foto) {
    var img = caja && caja.querySelector('[data-video-poster]');
    if (img && foto && img.getAttribute('src') !== foto) img.setAttribute('src', foto);
  }

  /* PLAY Y PAUSA, con el dedo o con el raton.

     Quien recoge el toque es el escudo, la capa transparente que hay por
     delante del video, y el play de la casa hace lo mismo. Un toque cambia
     entre «quiero verlo» y «no»: en pausa lo suelta, y rodando o pidiendose
     lo para. Al cambiar de testimonio vuelve a pausa.

     El `play()` va aqui dentro, sin esperar a nada: es lo que hace que el
     navegador lo deje sonar. Si aun asi lo rechaza (un navegador que no deja
     sonar nada sin permiso de la pagina), se prueba callado, que eso lo deja
     siempre, y el boton del sonido queda a mano para quien lo quiera. */
  function alternar(caja) {
    if (!caja || !caja.__video) return;
    var v = reproductor(caja);
    if (caja.__pausa) {
      caja.__pausa = false;
      ponerEstado(caja, 'pidiendo');
      v.muted = !conSonido;
      var intento = v.play();
      if (intento && intento.catch) {
        intento.catch(function (error) {
          if (caja.__pausa) return;
          if (error && error.name === 'NotAllowedError' && !v.muted) {
            v.muted = true;
            conSonido = false;
            pintarBoton(caja);
            var callado = v.play();
            if (callado && callado.catch) {
              callado.catch(function () { caja.__pausa = true; ponerEstado(caja, 'parado'); });
            }
            return;
          }
          caja.__pausa = true;
          ponerEstado(caja, 'parado');
        });
      }
      return;
    }
    caja.__pausa = true;
    ponerEstado(caja, 'parado');
    v.pause();
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
      var v = cajas[i].__reproductor;
      if (v) v.muted = !conSonido;
      pintarBoton(cajas[i]);
    }
    var marco = boton.parentNode && boton.parentNode.querySelector('[data-video-hueco]');
    if (marco) pintarBoton(marco);
  });

  return {
    montar: montar,
    apagar: apagar,
    parar: parar,
    poner: poner
  };
})();
