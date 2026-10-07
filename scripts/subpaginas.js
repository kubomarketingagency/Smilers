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

  function abrirSegun(ancla) {
    var poner = acordeones[decodeURIComponent((ancla || '').replace(/^#/, ''))];
    if (poner) poner(true);
    return !!poner;
  }

  if (abrirSegun(window.location.hash)) {
    var pedida = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    var anclaPedida = window.location.hash;
    var tocada = false;
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (tipo) {
      window.addEventListener(tipo, function () { tocada = true; }, { passive: true, once: true });
    });
    var colocar = function () {
      if (!pedida || tocada || window.location.hash !== anclaPedida) return;
      if (Math.abs(pedida.getBoundingClientRect().top) > window.innerHeight * .75) return;
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
