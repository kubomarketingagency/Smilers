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

    /* Las entradas del menu —Galeria > Instalaciones, Equipo…— no son anclas:
       no hay ningun elemento con esos identificadores. Son el nombre del
       filtro, y quien lo aplica es esto.

       Y ademas hay que bajar hasta la reja. Antes la pagina empezaba con una
       franja de titulo y el filtro caia casi en pantalla; con el hero de
       madera delante, quien llega desde el menu se queda mirando el hero y no
       ve que su filtro ya esta puesto. Se baja solo cuando la orden viene de
       la direccion; pulsando el filtro a mano no se mueve nada, que ahi ya
       se esta mirando la reja. */
    function filtrarSegunDireccion() {
      const marca = decodeURIComponent(window.location.hash.slice(1));
      if (!marca) return;
      const boton = Array.prototype.find.call(botonesFiltro, function (b) {
        return b.dataset.filtro === marca;
      });
      if (!boton) return;
      boton.click();

      const reja = document.querySelector('.filtros-galeria');
      if (!reja) return;
      const suave = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
      const alto = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--alto-navbar')) || 62;
      const destino = reja.getBoundingClientRect().top + window.scrollY - alto - 20;
      window.scrollTo({ top: Math.max(0, destino), behavior: suave ? 'smooth' : 'auto' });
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

  var acordeones = {};
  document.querySelectorAll('.acordeon-tratamiento-boton').forEach(function (boton) {
    var panel = document.getElementById(boton.getAttribute('aria-controls'));
    if (!panel) return;

    function poner(abierto) {
      panel.classList.toggle('abierta', abierto);
      boton.setAttribute('aria-expanded', String(abierto));
    }
    boton.addEventListener('click', function () { poner(!panel.classList.contains('abierta')); });
    acordeones[panel.id.replace(/^panel-/, '')] = poner;
  });

  /* En el telefono cada especialidad es un acordeon cerrado, y quien llega a
     una desde un enlace —el indice de las diez, el menu, la portada— viene a
     leerla: se abre sola. Antes solo pasaba al entrar en la pagina con el
     ancla puesta; pulsando el indice ya dentro, la pagina bajaba hasta la
     especialidad y la dejaba cerrada, con solo su nombre a la vista.

     No hace falta mover el scroll: el ancla ya baja hasta el techo de la
     seccion, y el panel se abre por debajo de su boton sin empujarlo. En
     escritorio la clase no hace nada, que ahi los paneles se ven siempre.
     El clic se escucha ademas del cambio de ancla porque pulsar la misma que
     ya esta en la direccion no cambia nada y no avisa. */
  function abrirSegun(ancla) {
    var poner = acordeones[decodeURIComponent((ancla || '').replace(/^#/, ''))];
    if (poner) poner(true);
    return !!poner;
  }

  /* Y al llegar desde otra pagina con el ancla puesta —la portada, el menu—
     el navegador decide hasta donde bajar antes de que carguen las letras de
     la pagina, y con ellas lo de arriba encoge 113px: se pasaba de largo y el
     nombre de la especialidad quedaba debajo de la barra. Cuando la pagina ya
     esta entera, se vuelve a colocar la seccion justo debajo de ella. */
  if (abrirSegun(window.location.hash)) {
    var pedida = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    var colocar = function () {
      if (!pedida) return;
      var suave = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
      pedida.scrollIntoView({ block: 'start', behavior: suave ? 'smooth' : 'auto' });
    };
    window.addEventListener('load', function () {
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
        requestAnimationFrame(colocar);
      });
    });
  }
  window.addEventListener('hashchange', function () { abrirSegun(window.location.hash); });
  document.addEventListener('click', function (evento) {
    var enlace = evento.target.closest && evento.target.closest('a[href*="#"]');
    if (!enlace) return;
    var destino = new URL(enlace.href, window.location.href);
    var aqui = window.location.pathname.replace(/\.html$/, '');
    if (destino.pathname.replace(/\.html$/, '') === aqui) abrirSegun(destino.hash);
  });
});
