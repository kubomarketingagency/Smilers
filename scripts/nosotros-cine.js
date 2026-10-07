document.addEventListener('DOMContentLoaded', function () {

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

  function encender(nodo) {
    if (!nodo) return;
    var piezas = nodo.querySelectorAll('img[data-src], img[data-srcset], source[data-srcset]');
    for (var i = 0; i < piezas.length; i++) {
      var p = piezas[i];
      if (p.dataset.srcset) { p.setAttribute('srcset', p.dataset.srcset); delete p.dataset.srcset; }
      if (p.dataset.src) { p.setAttribute('src', p.dataset.src); delete p.dataset.src; }
    }
  }

  function enReposo(fn) {
    var luego = function () {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 4000 });
      else setTimeout(fn, 1500);
    };
    if (document.readyState === 'complete') luego();
    else window.addEventListener('load', luego, { once: true });
  }

  var elenco = (function () {
    var caja = document.querySelector('[data-elenco]');
    if (!caja) return null;

    var retratos = Array.prototype.slice.call(caja.querySelectorAll('.ns-elenco__retrato'));
    if (retratos.length < 2) return null;

    var ficha = caja.querySelector('[data-elenco-ficha]');
    var puntera = caja.querySelector('[data-elenco-puntos]');

    var INTERVALO = 3000;
    var actual = 0;
    var reloj = null;
    var dormido = false;
    var pedidosTodos = false;

    var puntos = retratos.map(function (retrato, indice) {
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'ns-elenco__punto';
      boton.setAttribute('aria-label', retrato.dataset.espArea || 'Especialista');
      boton.addEventListener('click', function () { ir(indice, true); });
      if (puntera) puntera.appendChild(boton);
      return boton;
    });

    function pintarFicha(retrato) {
      if (!ficha) return;

      ficha.querySelector('[data-ficha-esp]').textContent = retrato.dataset.espArea || '';
      ficha.querySelector('[data-ficha-texto]').textContent = retrato.dataset.espTexto || '';

      var lista = ficha.querySelector('[data-ficha-lista]');
      lista.textContent = '';
      (retrato.dataset.espPuntos || '').split('|').forEach(function (punto) {
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

    function pintar() {
      encender(retratos[actual]);
      retratos.forEach(function (retrato, indice) {
        var activo = indice === actual;
        retrato.classList.toggle('ns-elenco__retrato--activo', activo);
        retrato.setAttribute('aria-hidden', activo ? 'false' : 'true');
      });
      puntos.forEach(function (punto, indice) {
        var activo = indice === actual;
        punto.classList.toggle('ns-elenco__punto--activo', activo);
        punto.setAttribute('aria-current', activo ? 'true' : 'false');
      });
      pintarFicha(retratos[actual]);
    }

    function ir(indice, manual) {
      actual = (indice + retratos.length) % retratos.length;
      pintar();
      encender(retratos[(actual + 1) % retratos.length]);
      if (manual) arrancar();
    }

    function arrancar() {
      parar();
      if (dormido || quietud.matches) return;
      encender(retratos[(actual + 1) % retratos.length]);
      if (!pedidosTodos) {
        pedidosTodos = true;
        enReposo(function () { retratos.forEach(encender); });
      }
      reloj = setInterval(function () { ir(actual + 1); }, INTERVALO);
    }

    function parar() {
      if (reloj) { clearInterval(reloj); reloj = null; }
    }

    var previa = caja.querySelector('[data-elenco-previa]');
    var siguiente = caja.querySelector('[data-elenco-siguiente]');
    if (previa) previa.addEventListener('click', function () { ir(actual - 1, true); });
    if (siguiente) siguiente.addEventListener('click', function () { ir(actual + 1, true); });

    caja.addEventListener('mouseenter', parar);
    caja.addEventListener('mouseleave', arrancar);
    caja.addEventListener('focusin', parar);
    caja.addEventListener('focusout', arrancar);

    quietud.addEventListener('change', function () {
      if (quietud.matches) parar(); else arrancar();
    });

    pintar();

    return {
      caja: caja,

      dormir: function () {
        if (dormido) return;
        dormido = true;
        parar();
      },
      despertar: function (desdeElPrincipio) {
        if (!dormido && !desdeElPrincipio) return;
        dormido = false;
        if (desdeElPrincipio && actual !== 0) { actual = 0; pintar(); }
        arrancar();
      }
    };
  })();

  (function () {
    var escena = document.getElementById('nsCine');
    var cierre = document.getElementById('nsCierre');
    var carta = document.getElementById('nsCarta');
    if (!escena || typeof SmilersScroll === 'undefined') {
      if (elenco) elenco.despertar(false);
      return;
    }

    function cabe() {
      return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    }

    function cintaDe(selector) {
      var caja = document.querySelector(selector + ' [data-carrusel]');
      var lista = window.SmilersCarruseles || [];
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].caja === caja) return lista[i];
      }
      return null;
    }
    var cintaHistoria = cintaDe('.ns-capa--historia');
    var cintaInfra = cintaDe('.ns-capa--infra');

    function cintas(cualCorre) {
      if (cintaHistoria) {
        if (cualCorre === 'historia' || cualCorre === 'todas') cintaHistoria.despertar();
        else cintaHistoria.dormir();
      }
      if (cintaInfra) {
        if (cualCorre === 'infra' || cualCorre === 'todas') cintaInfra.despertar();
        else cintaInfra.dormir();
      }
    }

    function pieza(bloque, selector) { return bloque ? bloque.querySelector(selector) : null; }
    var capaFund = pieza(escena, '.ns-capa--fundamentos');
    var capaInfra = pieza(escena, '.ns-capa--infra');
    var envFund = pieza(capaFund, ':scope > .ns-envoltura');
    var envInfra = pieza(capaInfra, ':scope > .ns-envoltura');
    var fundPintada = false;
    var DESTINOS_CINE = {
      '--c-uno': pieza(escena, '.ns-capa--historia'),
      '--c-ev-uno': pieza(escena, '.ns-capa--historia'),
      '--c-dos': pieza(escena, '.ns-capa--elenco'),
      '--c-ev-dos': pieza(escena, '.ns-capa--elenco'),
      '--f-corre': capaFund,
      '--e-x': pieza(escena, '.ns-capa--elenco'),
      '--f-op': envFund,
      '--f-filtro': envFund,
      '--f-ent': envFund,
      '--f-filo': pieza(escena, '.ns-filo--vertical'),
      '--f-filo-op': pieza(escena, '.ns-filo--vertical'),
      '--i-corre': capaInfra,
      '--i-op': envInfra,
      '--i-filtro': envInfra,
      '--i-y': envInfra,
      '--i-filo': pieza(escena, '.ns-filo--horizontal'),
      '--i-filo-op': pieza(escena, '.ns-filo--horizontal'),
      '--h-abre': pieza(escena, '.ns-hojas'),
      '--h-filo': pieza(escena, '.ns-hojas')
    };
    var DESTINOS_CIERRE = {
      '--h-abre': pieza(cierre, '.ns-hojas'),
      '--h-filo': pieza(cierre, '.ns-hojas')
    };
    var DESTINOS_CARTA = {
      '--h-abre': pieza(carta, '.ns-hojas'),
      '--h-filo': pieza(carta, '.ns-hojas'),
      '--k-retrato': pieza(carta, '.ns-carta__retrato'),
      '--k-frase': pieza(carta, '.ns-carta__frase'),
      '--k-papel': pieza(carta, '.ns-carta__hoja'),
      '--k-texto': pieza(carta, '.cb-tinta'),
      '--k-filo': pieza(carta, '.cb-tinta'),
      '--k-firma': pieza(carta, '.cb-rub')
    };
    function cadaDestino(destino, fn) {
      if (!destino) return;
      if (Array.isArray(destino)) destino.forEach(function (d) { if (d) fn(d); });
      else fn(destino);
    }
    function borrar(destinos) {
      Object.keys(destinos).forEach(function (nombre) {
        cadaDestino(destinos[nombre], function (d) { d.style.removeProperty(nombre); });
      });
    }

    var viva = false;
    var cierreVivo = false;
    var clavado = false;
    var clavadoPintado = false;
    var cartaViva = false;
    var cartaClavada = false;
    var cartaClavadaPintada = false;
    var cartaEnPantalla = false;
    var cartaEnPantallaPintada = false;

    function revisarModo() {
      var quiere = cabe();
      var quiereCierre = quiere && !!cierre;
      var quiereCarta = quiere && !!carta;
      if (quiere === viva && quiereCierre === cierreVivo && quiereCarta === cartaViva) return;
      viva = quiere;
      cierreVivo = quiereCierre;
      cartaViva = quiereCarta;

      escena.classList.toggle('ns-cine--viva', viva);
      if (cierre) cierre.classList.toggle('ns-cierre--viva', cierreVivo);
      if (carta) carta.classList.toggle('ns-carta--viva', cartaViva);

      if (cierre && !cierreVivo) {
        borrar(DESTINOS_CIERRE);
        cierre.classList.remove('ns-cierre--clavado');
        clavado = clavadoPintado = false;
        escritoCierre = {};
        ultimoCierre = -1;
        pCierre = 0;
        contadosYa = false;
      }

      if (carta && !cartaViva) {
        borrar(DESTINOS_CARTA);
        carta.classList.remove('ns-carta--clavado');
        document.documentElement.classList.remove('con-carta');
        cartaClavada = cartaClavadaPintada = false;
        cartaEnPantalla = cartaEnPantallaPintada = false;
        escritoCarta = {};
        ultimoCarta = -1;
        pCarta = 0;
      }

      if (!viva) {
        if (capaFund) capaFund.classList.remove('ns-fund--viva');
        fundPintada = false;
        borrar(DESTINOS_CINE);
        borrar(DESTINOS_CIERRE);
        borrar(DESTINOS_CARTA);
        escritoCine = {};
        escritoCierre = {};
        escritoCarta = {};
        if (elenco) elenco.despertar(false);
        cintas('todas');
      } else {
        if (elenco) elenco.dormir();
        cintas('historia');
      }
    }

    function tramo(v, a, b) { return Math.min(1, Math.max(0, (v - a) / (b - a))); }
    function suave(t) { return t * t * (3 - 2 * t); }

    var escritoCine = {};
    var escritoCierre = {};
    var escritoCarta = {};
    function ponCine(nombre, valor) {
      if (escritoCine[nombre] === valor) return;
      escritoCine[nombre] = valor;
      cadaDestino(DESTINOS_CINE[nombre], function (d) { d.style.setProperty(nombre, valor); });
    }
    function ponCierre(nombre, valor) {
      if (escritoCierre[nombre] === valor) return;
      escritoCierre[nombre] = valor;
      if (DESTINOS_CIERRE[nombre]) DESTINOS_CIERRE[nombre].style.setProperty(nombre, valor);
    }
    function ponCarta(nombre, valor) {
      if (escritoCarta[nombre] === valor) return;
      escritoCarta[nombre] = valor;
      if (DESTINOS_CARTA[nombre]) DESTINOS_CARTA[nombre].style.setProperty(nombre, valor);
    }

    function progresoDe(bloque, ctx) {
      var caja = bloque.getBoundingClientRect();
      var recorrido = caja.height - ctx.alto;
      if (recorrido <= 0) return 0;
      return Math.min(1, Math.max(0, -caja.top / recorrido));
    }

    var anchoFund = 0;

    function px(v) {
      var escala = window.devicePixelRatio || 1;
      return (Math.round(v * escala) / escala) + 'px';
    }

    var pCine = 0;
    var pCierre = 0;
    var pCarta = 0;
    var ultimoCine = -1;
    var ultimoCierre = -1;
    var ultimoCarta = -1;
    var contadosYa = false;
    var rielMejor = 0;
    var rielPintado = -1;

    function leer(ctx) {
      if (viva) {
        if (!anchoFund && capaFund) anchoFund = capaFund.offsetWidth;
        pCine = progresoDe(escena, ctx);
        if (carta && cartaViva) {
          pCarta = progresoDe(carta, ctx);
          var cajaCarta = carta.getBoundingClientRect();
          cartaClavada = cajaCarta.top <= 1;
          cartaEnPantalla = cartaClavada && cajaCarta.bottom > ctx.alto;
        }
        if (cierre && cierreVivo) {
          pCierre = progresoDe(cierre, ctx);
          clavado = cierre.getBoundingClientRect().top <= 1;
        }
      }
      rielMejor = paradaEnCurso(ctx);
    }

    function escribir() {
      if (viva && pCine !== ultimoCine) {
        ultimoCine = pCine;

        var entra  = suave(tramo(pCine, .0766, .2297));
        var texto  =       tramo(pCine, .2406, .3281);
        var sale   = suave(tramo(pCine, .4397, .5513));
        var sube   = suave(tramo(pCine, .7154, .8467));
        var textoI =       tramo(pCine, .7592, .8795);
        var cierra = suave(tramo(pCine, cierreVivo ? .9123 : .9342, 1));

        var der = sale > 0 ? sale : (1 - entra);
        var corre = der * anchoFund;
        ponCine('--f-corre', px(-corre));
        ponCine('--e-x', px((1 - sale) * .12 * anchoFund));
        ponCine('--f-op', Math.max(texto, .001).toFixed(3));
        ponCine('--f-filtro', texto <= 0 || texto >= 1 ? 'none' : 'blur(' + ((1 - texto) * 12).toFixed(1) + 'px)');
        ponCine('--f-ent', (1 - texto).toFixed(3));
        ponCine('--f-filo', px(anchoFund - corre));
        ponCine('--f-filo-op', der > 0 && der < 1 ? '1' : '0');

        var fundViva = texto > 0;
        if (capaFund && fundViva !== fundPintada) {
          fundPintada = fundViva;
          capaFund.classList.toggle('ns-fund--viva', fundViva);
        }

        var baja = (1 - sube) * SmilersScroll.alto();
        ponCine('--i-corre', px(baja));
        ponCine('--i-op', Math.max(textoI, .001).toFixed(3));
        ponCine('--i-filtro', textoI <= 0 || textoI >= 1 ? 'none' : 'blur(' + ((1 - textoI) * 10).toFixed(1) + 'px)');
        ponCine('--i-y', px((1 - textoI) * 42));
        ponCine('--i-filo', px(baja));
        ponCine('--i-filo-op', sube > 0 && sube < 1 ? '1' : '0');

        ponCine('--h-abre', (1 - cierra).toFixed(3));
        ponCine('--h-filo', cierra > 0 && cierra < 1 ? '1' : '0');

        var segundo = pCine >= .3609 ? 1 : 0;
        ponCine('--c-uno', String(1 - segundo));
        ponCine('--c-dos', String(segundo));
        ponCine('--c-ev-uno', segundo ? 'none' : 'auto');
        ponCine('--c-ev-dos', segundo ? 'auto' : 'none');

        if (elenco) {
          if (pCine > .339 && pCine < .7592) elenco.despertar(pCine < .48);
          else elenco.dormir();
        }

        cintas(pCine < .2406 ? 'historia' : (pCine > .7045 ? 'infra' : 'ninguna'));
      }

      if (viva && cartaViva && cartaClavada !== cartaClavadaPintada) {
        cartaClavadaPintada = cartaClavada;
        carta.classList.toggle('ns-carta--clavado', cartaClavada);
      }

      if (viva && cartaViva && cartaEnPantalla !== cartaEnPantallaPintada) {
        cartaEnPantallaPintada = cartaEnPantalla;
        document.documentElement.classList.toggle('con-carta', cartaEnPantalla);
      }

      if (viva && cartaViva && carta && pCarta !== ultimoCarta) {
        ultimoCarta = pCarta;

        var cRetrato = suave(tramo(pCarta, .05, .26));
        var cFrase   = suave(tramo(pCarta, .18, .34));
        var cPapel   = suave(tramo(pCarta, .40, .62));
        var cTexto   =       tramo(pCarta, .50, .70);
        var cFilo    = suave(tramo(pCarta, .60, .76));
        var cFirma   =       tramo(pCarta, .70, .84);

        var cAbre  = suave(tramo(pCarta, 0, .14));
        var cCierra = suave(tramo(pCarta, .92, 1));
        var cHojas = cAbre * (1 - cCierra);

        ponCarta('--h-abre', cHojas.toFixed(3));
        ponCarta('--h-filo', cHojas > 0 && cHojas < 1 ? '1' : '0');
        ponCarta('--k-retrato', cRetrato.toFixed(3));
        ponCarta('--k-frase', cFrase.toFixed(3));
        ponCarta('--k-papel', cPapel.toFixed(3));
        ponCarta('--k-texto', cTexto.toFixed(3));
        ponCarta('--k-filo', cFilo.toFixed(3));
        ponCarta('--k-firma', cFirma.toFixed(3));
      }

      if (viva && cierreVivo && clavado !== clavadoPintado) {
        clavadoPintado = clavado;
        cierre.classList.toggle('ns-cierre--clavado', clavado);
      }

      if (viva && cierreVivo && cierre && pCierre !== ultimoCierre) {
        ultimoCierre = pCierre;
        var abre = suave(tramo(pCierre, .03, .4));
        ponCierre('--h-abre', abre.toFixed(3));
        ponCierre('--h-filo', abre > 0 && abre < 1 ? '1' : '0');

        if (abre <= 0) contadosYa = false;
        else if (!contadosYa && abre > .12 && window.SmilersContadores) {
          contadosYa = true;
          cierre.querySelectorAll('[data-contador]').forEach(function (c) {
            window.SmilersContadores.animar(c);
          });
        }
      }

      if (rielMejor !== rielPintado) {
        rielPintado = rielMejor;
        botones.forEach(function (boton, i) {
          boton.classList.toggle('ns-riel__boton--activo', i === rielMejor);
        });
      }
    }

    revisarModo();

    SmilersScroll.registrar(leer, escribir, function () {
      revisarModo();
      ultimoCine = -1;
      ultimoCierre = -1;
      ultimoCarta = -1;
      escritoCine = {};
      escritoCierre = {};
      escritoCarta = {};
      anchoFund = 0;
    });

    var paradas = [
      { id: 'historia',        nombre: 'Historia',        bloque: escena, p: 0,    desde: 0 },
      { id: 'fundamentos',     nombre: 'Fundamentos',     bloque: escena, p: .384, desde: .2297 },
      { id: 'equipo',          nombre: 'Equipo',          bloque: escena, p: .633, desde: .52 },
      { id: 'infraestructura', nombre: 'Infraestructura', bloque: escena, p: .896, desde: .781 },
      { id: 'bienvenida',      nombre: 'Carta de bienvenida', bloque: carta, p: .86, desde: .12 },
      { id: 'cifras',          nombre: 'En cifras',       bloque: cierre, p: .55,  desde: .15 }
    ].filter(function (parada) {
      parada.destinoEl = document.getElementById(parada.id);
      return parada.bloque && parada.destinoEl;
    });

    function bloqueVivo(parada) {
      if (parada.bloque === escena) return viva;
      if (parada.bloque === carta) return cartaViva;
      return cierreVivo;
    }
    function progresoSuyo(parada) {
      if (parada.bloque === escena) return pCine;
      if (parada.bloque === carta) return pCarta;
      return pCierre;
    }

    function destinoDe(parada) {
      if (!bloqueVivo(parada)) {
        return Math.max(0, parada.destinoEl.getBoundingClientRect().top + window.scrollY - 90);
      }
      var caja = parada.bloque.getBoundingClientRect();
      var arriba = caja.top + window.scrollY;
      var recorrido = Math.max(0, caja.height - (window.SmilersScroll ? SmilersScroll.alto() : window.innerHeight));
      return Math.round(arriba + parada.p * recorrido);
    }

    function llevarA(parada, suavemente) {
      var destino = destinoDe(parada);
      if (suavemente && window.SmilersScroll && !quietud.matches) {
        SmilersScroll.deslizarA(destino, 900);
      } else {
        window.scrollTo(0, destino);
      }
    }

    function paradaEnCurso(ctx) {
      var mejor = 0;
      for (var i = 0; i < paradas.length; i++) {
        var parada = paradas[i];
        if (bloqueVivo(parada)) {
          if (progresoSuyo(parada) >= parada.desde) mejor = i;
        } else if (parada.destinoEl.getBoundingClientRect().top < ctx.alto * .5) {
          mejor = i;
        }
      }
      return mejor;
    }

    var botones = [];
    if (paradas.length > 1) {
      var nav = document.createElement('nav');
      nav.className = 'ns-riel-nav';
      nav.setAttribute('aria-label', 'Secciones de la página');

      var lista = document.createElement('ul');
      lista.className = 'ns-riel';

      paradas.forEach(function (parada) {
        var fila = document.createElement('li');
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'ns-riel__boton';
        boton.dataset.nombre = parada.nombre;
        boton.setAttribute('aria-label', 'Ir a ' + parada.nombre);
        boton.addEventListener('click', function () { llevarA(parada, true); });
        fila.appendChild(boton);
        lista.appendChild(fila);
        botones.push(boton);
      });

      nav.appendChild(lista);
      document.body.appendChild(nav);
    }

    document.addEventListener('click', function (evento) {
      var enlace = evento.target.closest && evento.target.closest('a[href*="#"]');
      if (!enlace) return;

      var trozos = enlace.getAttribute('href').split('#');
      if (trozos.length < 2 || !trozos[1]) return;

      var primero = trozos[0];
      if (primero) {
        var suyo = location.pathname.replace(/\.html$/, '');
        var otro = primero.replace(/\.html$/, '');
        if (otro !== suyo && otro !== suyo.split('/').pop()) return;
      }

      for (var i = 0; i < paradas.length; i++) {
        if (paradas[i].id === trozos[1]) {
          evento.preventDefault();
          llevarA(paradas[i], true);
          return;
        }
      }
    });

    if (location.hash.length > 1) {
      var pedido = location.hash.slice(1);
      var suya = null;
      for (var iP = 0; iP < paradas.length; iP++) {
        if (paradas[iP].id === pedido) { suya = paradas[iP]; break; }
      }
      if (suya) {
        var tocado = false;
        var apuntarTocado = function () { tocado = true; };
        ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (que) {
          window.addEventListener(que, apuntarTocado, { passive: true, once: true });
        });

        var colocar = function () {
          if (tocado) return;
          window.scrollTo(0, destinoDe(suya));
          SmilersScroll.pedir();
        };
        requestAnimationFrame(function () { requestAnimationFrame(colocar); });
        if (document.readyState === 'complete') {
          setTimeout(colocar, 0);
        } else {
          window.addEventListener('load', function () {
            requestAnimationFrame(colocar);
          }, { once: true });
        }
        setTimeout(function () {
          colocar();
          window.removeEventListener('wheel', apuntarTocado);
          window.removeEventListener('touchstart', apuntarTocado);
          window.removeEventListener('pointerdown', apuntarTocado);
          window.removeEventListener('keydown', apuntarTocado);
        }, 900);
      }
    }

    SmilersScroll.pedir();
  })();
});
