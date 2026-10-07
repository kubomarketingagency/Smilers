window.SmilersVideo = (function () {
  'use strict';

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

  function ponerEstado(caja, estado) {
    caja.classList.toggle('video-parado', estado === 'parado');
    caja.classList.toggle('video-pidiendo', estado === 'pidiendo');
    caja.classList.toggle('video-listo', estado === 'listo');
  }

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
    v.addEventListener('error', function () {
      caja.__pausa = true;
      if (caja.__video) ponerEstado(caja, 'parado');
    });

    caja.insertBefore(v, caja.firstChild);
    caja.__reproductor = v;
    if (cajas.indexOf(caja) < 0) cajas.push(caja);
    return v;
  }

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

  function parar(caja) { apagar(caja); }

  function poner(caja, foto) {
    var img = caja && caja.querySelector('[data-video-poster]');
    if (img && foto && img.getAttribute('src') !== foto) img.setAttribute('src', foto);
  }

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
