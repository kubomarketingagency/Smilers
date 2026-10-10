document.addEventListener('DOMContentLoaded', function () {
  const formasParallax = document.querySelectorAll('.forma-parallax');

  if (formasParallax.length && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
      && window.matchMedia('(pointer: fine)').matches) {
    let ultimoFrame = null;

    document.addEventListener('mousemove', function (evento) {
      if (ultimoFrame) return;
      ultimoFrame = requestAnimationFrame(function () {
        const xRelativo = (evento.clientX / window.innerWidth) - 0.5;
        const yRelativo = (evento.clientY / window.innerHeight) - 0.5;

        formasParallax.forEach(function (forma) {
          const intensidad = Number(forma.dataset.intensidad || 18);
          forma.style.transform = 'translate(' + (xRelativo * intensidad) + 'px, ' + (yRelativo * intensidad) + 'px)';
        });

        ultimoFrame = null;
      });
    });
  }

  document.querySelectorAll('.acordeon-galeria').forEach(function (galeria) {

    var paneles = Array.prototype.slice.call(galeria.querySelectorAll('.ag-panel'));
    if (!paneles.length) return;

    var tieneHoverFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    var ficha = document.querySelector('[data-ficha-equipo]');

    function pintarFicha(panel) {
      if (!ficha || !panel.dataset.espTexto) return;

      var titulo = panel.querySelector('.ag-panel__titulo');
      var desc = panel.querySelector('.ag-panel__desc');

      ficha.querySelector('[data-ficha-nombre]').textContent = titulo ? titulo.textContent : '';
      ficha.querySelector('[data-ficha-esp]').textContent = desc ? desc.textContent : '';
      ficha.querySelector('[data-ficha-texto]').textContent = panel.dataset.espTexto;

      var lista = ficha.querySelector('[data-ficha-lista]');
      lista.textContent = '';
      (panel.dataset.espPuntos || '').split('|').forEach(function (punto) {
        var limpio = punto.trim();
        if (!limpio) return;
        var li = document.createElement('li');
        li.textContent = limpio;
        lista.appendChild(li);
      });

      if (ficha.classList.contains('ns-ficha--entra')) {
        ficha.classList.remove('ns-ficha--entra');
        void ficha.offsetWidth;
      }
      ficha.classList.add('ns-ficha--entra');
    }

    function activar(panel) {
      paneles.forEach(function (p) {
        var activo = p === panel;
        p.classList.toggle('ag-panel--activo', activo);
        if (activo) p.setAttribute('aria-current', 'true');
        else p.removeAttribute('aria-current');
      });
      pintarFicha(panel);
    }

    function cerrar() {
      paneles.forEach(function (p) {
        p.classList.remove('ag-panel--activo');
        p.removeAttribute('aria-current');
      });
    }

    paneles.forEach(function (panel) {
      var x = document.createElement('span');
      x.className = 'ag-panel__cerrar';
      x.setAttribute('aria-hidden', 'true');
      panel.appendChild(x);
    });

    function apilado() {
      return getComputedStyle(galeria).flexDirection === 'column';
    }

    function sostener(panel) {
      var barra = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-navbar')) || 62;
      var proporcion = parseFloat(getComputedStyle(panel).getPropertyValue('--alto-foto')) || 4 / 3;
      var alto = Math.min(panel.getBoundingClientRect().width * proporcion, window.innerHeight * 0.86);
      var desde = panel.getBoundingClientRect().top;
      var techo = barra + 10;
      var suelo = Math.max(techo, window.innerHeight - alto - 12);
      var hasta = Math.min(Math.max(desde, techo), suelo);
      var inicio = performance.now();
      var DURACION = 560;
      var suelto = false;

      function soltar() { suelto = true; }
      window.addEventListener('touchstart', soltar, { passive: true });
      window.addEventListener('wheel', soltar, { passive: true });

      function paso(ahora) {
        if (!suelto) {
          var x = Math.min(1, (ahora - inicio) / DURACION);
          var objetivo = desde + (hasta - desde) * (1 - Math.pow(1 - x, 4));
          var desvio = panel.getBoundingClientRect().top - objetivo;
          if (Math.abs(desvio) >= 1) {
            window.scrollTo({ top: window.scrollY + desvio, behavior: 'instant' });
          }
          if (x < 1) { requestAnimationFrame(paso); return; }
        }
        window.removeEventListener('touchstart', soltar);
        window.removeEventListener('wheel', soltar);
      }
      requestAnimationFrame(paso);
    }

    var inicial = galeria.querySelector('.ag-panel--activo') || paneles[0];
    if (inicial) pintarFicha(inicial);

    paneles.forEach(function (panel, indice) {

      if (tieneHoverFino) {
        panel.addEventListener('mouseenter', function () { activar(panel); });
        panel.addEventListener('focus', function () { activar(panel); });
      }

      panel.addEventListener('click', function (evento) {

        if (evento.target.closest && evento.target.closest('.ag-panel__cerrar') &&
            panel.classList.contains('ag-panel--activo') && apilado()) {
          evento.preventDefault();
          cerrar();
          return;
        }

        if (!tieneHoverFino && !panel.classList.contains('ag-panel--activo')) {
          evento.preventDefault();
          if (apilado()) sostener(panel);
          activar(panel);
        }
      });

      panel.addEventListener('keydown', function (evento) {
        var siguiente = null;
        if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
          siguiente = paneles[(indice + 1) % paneles.length];
        } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
          siguiente = paneles[(indice - 1 + paneles.length) % paneles.length];
        }
        if (siguiente) {
          evento.preventDefault();
          activar(siguiente);
          siguiente.focus();
        }
      });
    });
  });

  (function () {
    var heroCarrusel = document.getElementById('heroCarrusel');
    if (!heroCarrusel || !window.bootstrap || !('IntersectionObserver' in window)) return;

    var instancia = bootstrap.Carousel.getOrCreateInstance(heroCarrusel);

    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) instancia.cycle();
        else instancia.pause();
      });
    }, { rootMargin: '100px 0px' }).observe(heroCarrusel);
  })();

  (function () {
    var cinta = document.getElementById('bandaCtaMasonryCinta');
    if (!cinta) return;

    var fotos = (cinta.dataset.fotos || '')
      .split(',')
      .map(function (u) { return u.trim(); })
      .filter(Boolean);
    if (!fotos.length) return;

    var grupos = [];
    for (var g = 0; g < fotos.length; g += 3) grupos.push(fotos.slice(g, g + 3));

    function crearColumna(grupo) {
      var col = document.createElement('div');
      col.className = 'banda-cta-masonry__col';
      grupo.forEach(function (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        col.appendChild(img);
      });
      return col;
    }

    function armar() {
      var anchoColumna = window.matchMedia('(min-width: 992px)').matches ? 226 : 196;

      var anchoNecesario = window.innerWidth * 1.6;

      var set = [];
      var anchoSet = 0;
      var indice = 0;
      while (anchoSet < anchoNecesario || indice < grupos.length) {
        set.push(grupos[indice % grupos.length]);
        anchoSet += anchoColumna;
        indice++;
      }

      var anchoMinimo = Math.ceil(anchoNecesario / anchoColumna) * anchoColumna;
      if (anchoSet > anchoMinimo) {
        var duracion = parseFloat(getComputedStyle(cinta).animationDuration) || 50;
        cinta.style.animationDuration = (duracion * anchoSet / anchoMinimo) + 's';
      }

      set.concat(set).forEach(function (grupo) {
        cinta.appendChild(crearColumna(grupo));
      });
    }

    if ('IntersectionObserver' in window) {
      cinta.style.animationPlayState = 'paused';
      var caja = cinta.parentNode || cinta;
      var armada = false;
      var armarUnaVez = function () {
        if (armada) return;
        armada = true;
        vigia.disconnect();
        armar();
      };
      var vigia = new IntersectionObserver(function (entradas) {
        if (entradas[entradas.length - 1].isIntersecting) armarUnaVez();
      }, { rootMargin: '300% 0px' });
      vigia.observe(caja);
      var enReposo = function () {
        if (window.requestIdleCallback) window.requestIdleCallback(armarUnaVez, { timeout: 3000 });
        else setTimeout(armarUnaVez, 1200);
      };
      if (document.readyState === 'complete') enReposo();
      else window.addEventListener('load', enReposo, { once: true });
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          cinta.style.animationPlayState = entrada.isIntersecting ? 'running' : 'paused';
        });
      }, { rootMargin: '200px 0px' }).observe(caja);
    } else {
      armar();
    }
  })();

  if (window.location.hash) {
    const objetivo = document.querySelector(window.location.hash);
    if (objetivo && objetivo.classList.contains('accordion-collapse')) {
      const colapsable = new bootstrap.Collapse(objetivo, { toggle: true });
      objetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});
