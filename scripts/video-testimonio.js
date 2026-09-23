window.SmilersVideo = (function () {
  'use strict';

  /* =========================================================================
     El video de un testimonio.

     En la pagina no hay ningun <iframe> escrito: hay un enlace a YouTube con
     el fotograma del video detras, y el <iframe> se crea cuando alguien lo
     pulsa. Se hace asi por tres motivos, y los tres importan aqui:

     - El reproductor de YouTube pesa mas que el resto de la portada junta, y
       se descarga aunque nadie le de al play.
     - Deja cookies suyas en cuanto se carga, y este sitio pregunta antes de
       dejar ninguna que no sea necesaria (ver consentimiento.js). Un iframe
       escrito en el HTML se saltaria esa pregunta. Por eso ademas se pide a
       youtube-nocookie.com, que no escribe nada hasta que el video arranca.
     - Sin JS —o con el enlace en un sitio donde no cabe verse— el enlace
       sigue siendo un enlace y lleva al video en YouTube. No se pierde nada.

     Lo que cuelga de aqui son dos sitios con la misma pieza: el circulo de la
     esfera de testimonios, en la portada, y la tarjeta de la lista, que es lo
     que se ve cuando la escena no se enciende. El guion no sabe cual es cual:
     monta el reproductor en el elemento con data-video-hueco que tenga encima
     el enlace pulsado.
     ========================================================================= */

  var PARTIDA = 'https://www.youtube-nocookie.com/embed/';
  /* playsinline para que en un iPhone no se lo lleve el reproductor del
     sistema —dentro del circulo tiene que quedarse— y rel=0 para que al
     terminar ofrezca videos del mismo canal y no del que quiera YouTube. */
  var OPCIONES = '?autoplay=1&rel=0&playsinline=1&modestbranding=1';

  function hueco(enlace) {
    var p = enlace.parentNode;
    while (p && p.nodeType === 1 && !p.hasAttribute('data-video-hueco')) p = p.parentNode;
    return p && p.nodeType === 1 ? p : enlace.parentNode;
  }

  function encender(enlace) {
    var caja = hueco(enlace);
    if (caja.querySelector('iframe')) return;

    var marco = document.createElement('iframe');
    marco.className = 'tst-video__iframe';
    marco.src = PARTIDA + enlace.getAttribute('data-video-id') + OPCIONES;
    marco.title = enlace.getAttribute('data-video-titulo') || 'Video';
    marco.setAttribute('frameborder', '0');
    marco.setAttribute('allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    marco.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    marco.setAttribute('allowfullscreen', '');

    caja.appendChild(marco);
    caja.classList.add('tiene-video');
  }

  /* Apagar es quitar el iframe, no pausarlo: mientras exista sigue siendo el
     reproductor de YouTube con sus cookies y su sonido, y si el circulo ya no
     esta en pantalla nadie podria pararlo. Quien lo llama es la escena de
     testimonios, cuando la esfera se lleva el circulo del video. */
  function apagar(caja) {
    if (!caja) return false;
    var marco = caja.querySelector('iframe');
    if (!marco) return false;
    marco.parentNode.removeChild(marco);
    caja.classList.remove('tiene-video');
    return true;
  }

  document.addEventListener('click', function (evento) {
    var destino = evento.target;
    if (!destino || destino.nodeType !== 1 || !destino.closest) return;
    var enlace = destino.closest('[data-video-id]');
    if (!enlace) return;

    /* Si el enlace no tiene donde verse, el video tampoco: la lista de
       testimonios queda reducida a un pixel cuando la escena esta encendida
       (es la que leen los lectores de pantalla), y montar ahi el reproductor
       seria sonido sin imagen. Ahi el enlace hace lo que dice y abre YouTube. */
    if (enlace.getBoundingClientRect().width < 40) return;

    evento.preventDefault();
    encender(enlace);
  });

  return { encender: encender, apagar: apagar };
})();
