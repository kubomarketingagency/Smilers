document.addEventListener('DOMContentLoaded', function () {

  var acordeones = document.querySelectorAll('[data-eq-acordeon]');
  if (!acordeones.length) return;

  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  Array.prototype.forEach.call(acordeones, function (acordeon) {

    var paneles = Array.prototype.slice.call(
      acordeon.querySelectorAll('[data-eq-panel]')
    );
    if (!paneles.length) return;

    var disparadores = paneles.map(function (panel) {
      return panel.querySelector('.eq-panel__disparador');
    });

    var esperaHover = 0;

    function abrir(indice, moverFoco) {
      paneles.forEach(function (panel, i) {
        var activo = i === indice;
        panel.classList.toggle('abierta', activo);

        var disparador = disparadores[i];
        if (disparador) disparador.setAttribute('aria-expanded', String(activo));

        var ficha = panel.querySelector('.eq-panel__ficha');
        if (ficha) ficha.setAttribute('aria-hidden', String(!activo));
      });

      if (moverFoco && disparadores[indice]) disparadores[indice].focus();
    }

    paneles.forEach(function (panel, indice) {
      var disparador = disparadores[indice];
      if (!disparador) return;

      disparador.addEventListener('click', function () {
        abrir(indice, false);
      });

      if (punteroFino) {
        panel.addEventListener('mouseenter', function () {
          clearTimeout(esperaHover);

          esperaHover = setTimeout(function () { abrir(indice, false); }, 120);
        });
        panel.addEventListener('mouseleave', function () {
          clearTimeout(esperaHover);
        });
      }

      disparador.addEventListener('keydown', function (evento) {
        var salto = 0;
        if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') salto = 1;
        else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') salto = -1;
        else if (evento.key === 'Home') { evento.preventDefault(); abrir(0, true); return; }
        else if (evento.key === 'End') { evento.preventDefault(); abrir(paneles.length - 1, true); return; }
        else return;

        evento.preventDefault();
        var destino = (indice + salto + paneles.length) % paneles.length;
        abrir(destino, true);
      });
    });

    var inicial = paneles.findIndex(function (panel) {
      return panel.classList.contains('abierta');
    });
    abrir(inicial < 0 ? 0 : inicial, false);
  });
});
