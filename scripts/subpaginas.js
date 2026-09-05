document.addEventListener('DOMContentLoaded', function () {
  const botonesFiltro = document.querySelectorAll('.filtro-btn');
  const itemsGaleria = document.querySelectorAll('.item-galeria-grande');

  if (botonesFiltro.length && itemsGaleria.length) {
    botonesFiltro.forEach(function (boton) {
      boton.addEventListener('click', function () {
        botonesFiltro.forEach(function (b) { b.classList.remove('activo'); });
        boton.classList.add('activo');

        const categoria = boton.dataset.filtro;

        itemsGaleria.forEach(function (item) {
          item.classList.remove('aparecer');
          const coincide = categoria === 'todos' || item.dataset.categoria === categoria;

          if (coincide) {
            item.classList.add('mostrar');

            requestAnimationFrame(function () {
              requestAnimationFrame(function () { item.classList.add('aparecer'); });
            });
          } else {
            item.classList.remove('mostrar');
          }
        });
      });
    });

    function filtrarSegunDireccion() {
      const marca = decodeURIComponent(window.location.hash.slice(1));
      if (!marca) return;
      const boton = Array.prototype.find.call(botonesFiltro, function (b) {
        return b.dataset.filtro === marca;
      });
      if (boton) boton.click();
    }

    filtrarSegunDireccion();
    window.addEventListener('hashchange', filtrarSegunDireccion);
  }

  const modalLightboxEl = document.getElementById('modalLightbox');
  const disparadoresLightbox = document.querySelectorAll('[data-lightbox-src]');

  if (modalLightboxEl && disparadoresLightbox.length) {
    const imagenModal = modalLightboxEl.querySelector('img');
    const leyendaModal = modalLightboxEl.querySelector('.lightbox-leyenda');
    const modalBootstrap = new bootstrap.Modal(modalLightboxEl);

    disparadoresLightbox.forEach(function (disparador) {
      disparador.addEventListener('click', function (evento) {
        evento.preventDefault();
        imagenModal.src = disparador.dataset.lightboxSrc;
        imagenModal.alt = disparador.dataset.lightboxAlt || '';
        leyendaModal.textContent = disparador.dataset.lightboxAlt || '';
        modalBootstrap.show();
      });
    });
  }

  document.querySelectorAll('[data-comparador]').forEach(function (contenedor) {
    const marco = contenedor.querySelector('.comparador-marco');
    const rango = contenedor.querySelector('.comparador-rango');
    if (!marco || !rango) return;

    function fijarPosicion(porcentaje) {
      const acotado = Math.min(100, Math.max(0, porcentaje));
      marco.style.setProperty('--pos', acotado + '%');
      rango.value = acotado;
    }

    function porcentajeDesdeEvento(evento) {
      const rect = marco.getBoundingClientRect();
      const x = evento.clientX - rect.left;
      return (x / rect.width) * 100;
    }

    let punteroActivo = null;

    marco.addEventListener('pointerdown', function (evento) {
      punteroActivo = evento.pointerId;

      if (marco.setPointerCapture) {
        try { marco.setPointerCapture(evento.pointerId); } catch (e) {}
      }
      fijarPosicion(porcentajeDesdeEvento(evento));
    });

    marco.addEventListener('pointermove', function (evento) {

      if (punteroActivo === evento.pointerId) {

        if (evento.cancelable) evento.preventDefault();
        fijarPosicion(porcentajeDesdeEvento(evento));
        return;
      }
      if (evento.pointerType === 'mouse' && evento.buttons === 0) return;
      if (evento.pointerType === 'mouse') fijarPosicion(porcentajeDesdeEvento(evento));
    });

    function soltar(evento) {
      if (punteroActivo !== evento.pointerId) return;
      punteroActivo = null;
      if (marco.releasePointerCapture) {
        try { marco.releasePointerCapture(evento.pointerId); } catch (e) {}
      }
    }
    marco.addEventListener('pointerup', soltar);
    marco.addEventListener('pointercancel', soltar);

    rango.addEventListener('input', function () {
      fijarPosicion(Number(rango.value));
    });
  });

  document.querySelectorAll('.acordeon-tratamiento-boton').forEach(function (boton) {
    var panel = document.getElementById(boton.getAttribute('aria-controls'));
    if (!panel) return;

    boton.addEventListener('click', function () {
      var abierto = panel.classList.toggle('abierta');
      boton.setAttribute('aria-expanded', String(abierto));
    });

    if (window.location.hash && window.location.hash.slice(1) === panel.id.replace(/^panel-/, '')) {
      panel.classList.add('abierta');
      boton.setAttribute('aria-expanded', 'true');
    }
  });
});
