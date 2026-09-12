document.addEventListener('DOMContentLoaded', function () {

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

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

    var puntos = retratos.map(function (retrato, indice) {
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'ns-elenco__punto';
      boton.setAttribute('aria-label', (retrato.dataset.espNombre || 'Especialista') +
                                       ', ' + (retrato.dataset.espArea || ''));
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

      /* Quitar y volver a poner la clase reinicia la entrada de la ficha, y
         para eso hay que obligar al navegador a maquetar en medio. Solo hace
         falta si la clase ya estaba: si no, ponerla basta para que la entrada
         arranque. Al abrir la pagina no esta, y esa maquetacion a destiempo
         costaba 85ms en un telefono. */
      if (ficha.classList.contains('ns-ficha--entra')) {
        ficha.classList.remove('ns-ficha--entra');
        void ficha.offsetWidth;
      }
      ficha.classList.add('ns-ficha--entra');
    }

    function pintar() {
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
      if (manual) arrancar();
    }

    function arrancar() {
      parar();
      if (dormido || quietud.matches) return;
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

      /* Dentro del pin la capa del elenco esta siempre en pantalla aunque no
         se vea —lo que la esconde es la opacidad—, asi que quien decide si el
         carrusel corre es la escena, no un observador. */
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
    if (!escena || typeof SmilersScroll === 'undefined') {
      if (elenco) elenco.despertar(false);
      return;
    }

    /* El cine va tambien en el movil, con el mismo barrido. Lo unico que lo
       apaga es que se haya pedido menos movimiento; entonces las capas se
       quedan apiladas en flujo normal, en el orden en que se leen. */
    function cabe() {
      return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    }

    /* Las dos cintas de fotos de la escena. `interiores.js` las monta y las
       deja en `SmilersCarruseles`; aqui se les dice cuando corren, porque su
       observador no puede saberlo: dentro del pin las dos estan siempre en
       pantalla. Va despues en el orden de los guiones, asi que la lista ya
       existe. */
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

    /* Cada variable va en la pieza que la usa, no en la escena: el 24 las
       registra sin herencia, asi que escrita ahi solo toca a esa pieza. En la
       escena invalidaba el estilo de sus 200 elementos en cada fotograma. */
    function pieza(bloque, selector) { return bloque ? bloque.querySelector(selector) : null; }
    var capaFund = pieza(escena, '.ns-capa--fundamentos');
    var capaInfra = pieza(escena, '.ns-capa--infra');
    var DESTINOS_CINE = {
      '--c-uno': pieza(escena, '.ns-capa--historia'),
      '--c-ev-uno': pieza(escena, '.ns-capa--historia'),
      '--c-dos': pieza(escena, '.ns-capa--elenco'),
      '--c-ev-dos': pieza(escena, '.ns-capa--elenco'),
      '--f-der': capaFund,
      '--f-op': pieza(capaFund, ':scope > .ns-envoltura'),
      '--f-desenfoque': pieza(capaFund, ':scope > .ns-envoltura'),
      '--f-ent': pieza(capaFund, ':scope > .ns-envoltura'),
      '--f-filo': pieza(escena, '.ns-filo--vertical'),
      '--f-filo-op': pieza(escena, '.ns-filo--vertical'),
      '--i-sube': capaInfra,
      '--i-op': pieza(capaInfra, ':scope > .ns-envoltura'),
      '--i-desenfoque': pieza(capaInfra, ':scope > .ns-envoltura'),
      '--i-y': pieza(capaInfra, ':scope > .ns-envoltura'),
      '--i-filo': pieza(escena, '.ns-filo--horizontal'),
      '--i-filo-op': pieza(escena, '.ns-filo--horizontal'),
      '--h-abre': pieza(escena, '.ns-hojas'),
      '--h-filo': pieza(escena, '.ns-hojas')
    };
    var DESTINOS_CIERRE = {
      '--h-abre': pieza(cierre, '.ns-hojas'),
      '--h-filo': pieza(cierre, '.ns-hojas')
    };
    function borrar(destinos) {
      Object.keys(destinos).forEach(function (nombre) {
        if (destinos[nombre]) destinos[nombre].style.removeProperty(nombre);
      });
    }

    /* El cierre es una escena clavada en todas las pantallas, tambien en el
       telefono: las hojas se cierran al final del cine y se abren sobre la
       pregunta, que ocupa la pantalla entera.

       En el telefono estuvo apagado una temporada por lo que costaba. Dos
       pines seguidos se cobran, por construccion, el alto entero de una
       pantalla de scroll entre el uno y el otro —el del cine tiene que
       terminar de salir antes de que el del cierre pueda clavarse—, y como
       las hojas estaban cerradas a los dos lados de ese hueco, lo que se
       recorria ahi era una pantalla de negro quieto. Sin el pin, la banda
       subia en flujo normal detras del telon, sin cierre ni apertura y sin
       llenar la pantalla.

       El hueco ya no existe: el 24 monta el cierre sobre la ultima pantalla
       del cine con un margen negativo del alto del pin, asi que su pin se
       clava justo en el pixel en el que el del cine deja de estarlo. Mientras
       sube por encima de esa ultima pantalla va escondido (sin `--clavado`) y
       el cine se sigue viendo entero; al clavarse aparece con las hojas
       cerradas, que es exactamente lo que el cine esta ensenando en ese
       momento, y el relevo no se ve. */
    var viva = false;
    var cierreVivo = false;
    var clavado = false;
    var clavadoPintado = false;

    function revisarModo() {
      var quiere = cabe();
      var quiereCierre = quiere && !!cierre;
      if (quiere === viva && quiereCierre === cierreVivo) return;
      viva = quiere;
      cierreVivo = quiereCierre;

      escena.classList.toggle('ns-cine--viva', viva);
      if (cierre) cierre.classList.toggle('ns-cierre--viva', cierreVivo);

      if (cierre && !cierreVivo) {
        borrar(DESTINOS_CIERRE);
        cierre.classList.remove('ns-cierre--clavado');
        clavado = clavadoPintado = false;
        escritoCierre = {};
        ultimoCierre = -1;
        pCierre = 0;
        contadosYa = false;
      }

      if (!viva) {
        borrar(DESTINOS_CINE);
        borrar(DESTINOS_CIERRE);
        escritoCine = {};
        escritoCierre = {};
        if (elenco) elenco.despertar(false);
        /* Sin escena las capas estan apiladas en flujo y cada cinta entra y
           sale de pantalla de verdad: vuelve a mandar su observador. */
        cintas('todas');
      } else {
        if (elenco) elenco.dormir();
        cintas('historia');
      }
    }

    function tramo(v, a, b) { return Math.min(1, Math.max(0, (v - a) / (b - a))); }
    function suave(t) { return t * t * (3 - 2 * t); }

    /* Y solo cuando cambian de valor. La mitad del recorrido no mueve
       ninguna —mientras se lee el elenco, de .33 a .73, las dieciocho estan en
       su valor final— y el ultimo cuarto solo mueve seis; guardando lo ultimo
       escrito, ese tramo cuesta cero. */
    var escritoCine = {};
    var escritoCierre = {};
    function ponCine(nombre, valor) {
      if (escritoCine[nombre] === valor) return;
      escritoCine[nombre] = valor;
      if (DESTINOS_CINE[nombre]) DESTINOS_CINE[nombre].style.setProperty(nombre, valor);
    }
    function ponCierre(nombre, valor) {
      if (escritoCierre[nombre] === valor) return;
      escritoCierre[nombre] = valor;
      if (DESTINOS_CIERRE[nombre]) DESTINOS_CIERRE[nombre].style.setProperty(nombre, valor);
    }

    function progresoDe(bloque, ctx) {
      var caja = bloque.getBoundingClientRect();
      var recorrido = caja.height - ctx.alto;
      if (recorrido <= 0) return 0;
      return Math.min(1, Math.max(0, -caja.top / recorrido));
    }

    var pCine = 0;
    var pCierre = 0;
    var ultimoCine = -1;
    var ultimoCierre = -1;
    var contadosYa = false;
    var rielMejor = 0;
    var rielPintado = -1;

    function leer(ctx) {
      if (viva) {
        pCine = progresoDe(escena, ctx);
        if (cierre && cierreVivo) {
          pCierre = progresoDe(cierre, ctx);
          /* Clavado es que el techo del cierre ya llego arriba: a partir de
             ahi su pin tapa la pantalla y el del cine esta en su ultimo
             fotograma, con las hojas cerradas. El pixel de holgura es por
             el redondeo del alto en `dvh`. */
          clavado = cierre.getBoundingClientRect().top <= 1;
        }
      }
      rielMejor = paradaEnCurso(ctx);
    }

    function escribir() {
      if (viva && pCine !== ultimoCine) {
        ultimoCine = pCine;

        /* Las fracciones estan reescaladas a los 590vh de la escena: hasta
           que entra el texto de infraestructura cada tramo mide lo mismo en
           pixeles que media antes. Lo unico que cambia de verdad es el final,
           que ahora arranca en cuanto se acaba de leer el panel en vez de
           hacer esperar tres cuartos de pantalla. */
        var entra  = suave(tramo(pCine, .07, .21));
        var texto  =       tramo(pCine, .22, .30);
        var sale   = suave(tramo(pCine, .45, .59));
        var sube   = suave(tramo(pCine, .74, .86));
        var textoI =       tramo(pCine, .78, .89);
        /* El telon se cierra en el ultimo 8% del recorrido, y en el 6%
           cuando no hay apertura despues: sin un tramo de apertura al que
           dar entrada, alargar el cierre es solo alargar el negro. Tiene que
           acabar de cerrarse en el 1 justo: ahi es donde el cierre se clava
           encima con sus hojas tambien cerradas. */
        var cierra = suave(tramo(pCine, cierreVivo ? .92 : .94, 1));

        /* Un solo canto para las dos mitades del telon de fundamentos: entra
           de izquierda a derecha y se retira por donde vino, asi que mientras
           sale manda `sale` y antes manda `entra`. No se solapan. */
        var der = sale > 0 ? sale : (1 - entra);
        ponCine('--f-der', (der * 100).toFixed(2) + '%');
        ponCine('--f-op', texto.toFixed(3));
        ponCine('--f-desenfoque', ((1 - texto) * 12).toFixed(1) + 'px');
        ponCine('--f-ent', (1 - texto).toFixed(3));
        ponCine('--f-filo', ((1 - der) * 100).toFixed(2) + '%');
        ponCine('--f-filo-op', der > 0 && der < 1 ? '1' : '0');

        ponCine('--i-sube', ((1 - sube) * 100).toFixed(2) + '%');
        ponCine('--i-op', textoI.toFixed(3));
        ponCine('--i-desenfoque', ((1 - textoI) * 10).toFixed(1) + 'px');
        ponCine('--i-y', ((1 - textoI) * 42).toFixed(1) + 'px');
        ponCine('--i-filo', ((1 - sube) * 100).toFixed(2) + '%');
        ponCine('--i-filo-op', sube > 0 && sube < 1 ? '1' : '0');

        ponCine('--h-abre', (1 - cierra).toFixed(3));
        ponCine('--h-filo', cierra > 0 && cierra < 1 ? '1' : '0');

        /* El cambiazo de fondo cae con el telon tapando la pantalla entera:
           acaba de taparla en .21 y no empieza a retirarse hasta .45. */
        var segundo = pCine >= .33 ? 1 : 0;
        ponCine('--c-uno', String(1 - segundo));
        ponCine('--c-dos', String(segundo));
        ponCine('--c-ev-uno', segundo ? 'none' : 'auto');
        ponCine('--c-ev-dos', segundo ? 'auto' : 'none');

        if (elenco) {
          if (pCine > .31 && pCine < .78) elenco.despertar(pCine < .50);
          else elenco.dormir();
        }

        /* Una cinta cada vez, y solo mientras su capa se ve. La del hero se
           para en cuanto el telon de fundamentos la tapa del todo (.21), y la
           de infraestructura no arranca hasta que su capa empieza a subir
           (.74). Entre las dos hay medio recorrido en el que no corre
           ninguna. */
        cintas(pCine < .22 ? 'historia' : (pCine > .73 ? 'infra' : 'ninguna'));
      }

      if (viva && cierreVivo && clavado !== clavadoPintado) {
        clavadoPintado = clavado;
        cierre.classList.toggle('ns-cierre--clavado', clavado);
      }

      if (viva && cierreVivo && cierre && pCierre !== ultimoCierre) {
        ultimoCierre = pCierre;
        /* La apertura arranca casi en cuanto se clava: ya no hay una
           pantalla de negro por delante que dejar pasar. */
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
      /* Al redimensionar hay que volver a escribirlo todo: el cache guarda
         cadenas y los porcentajes miden sobre una ventana que ya no es esa. */
      escritoCine = {};
      escritoCierre = {};
    });

    /* -------------------------------------------------------------------
       Las paradas: dentro del pin todas las secciones caen en el mismo sitio
       del documento, asi que un ancla normal las deja a todas en el arranque
       de la escena. Aqui cada una dice en que punto del recorrido vive, y de
       ahi salen tanto el riel lateral como los enlaces del menu.
       ------------------------------------------------------------------- */
    var paradas = [
      { id: 'historia',        nombre: 'Historia',       bloque: escena, p: .01 },
      { id: 'fundamentos',     nombre: 'Fundamentos',    bloque: escena, p: .27 },
      { id: 'equipo',          nombre: 'Equipo',         bloque: escena, p: .60 },
      { id: 'infraestructura', nombre: 'Infraestructura', bloque: escena, p: .86 },
      { id: 'cifras',          nombre: 'En cifras',      bloque: cierre, p: .55 }
    ].filter(function (parada) {
      parada.destinoEl = document.getElementById(parada.id);
      return parada.bloque && parada.destinoEl;
    });

    function destinoDe(parada) {
      if (!(parada.bloque === escena ? viva : cierreVivo)) {
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
        var esCine = parada.bloque === escena;
        if (esCine ? viva : cierreVivo) {
          var suyo = esCine ? pCine : pCierre;
          if (suyo >= parada.p - .04) mejor = i;
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

      /* El enlace puede venir escrito de tres maneras y las tres son esta
         misma pagina: `#historia`, `nosotros#historia` y
         `/nosotros#historia`. Y en local la direccion todavia
         acaba en `.html`. */
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

    /* Al llegar con `#equipo` en la direccion, el navegador ya ha saltado al
       arranque de la escena —que es donde vive el elemento— antes de que
       ninguno de estos guiones exista. Se recoloca en el fotograma siguiente,
       cuando el pin ya mide lo que tiene que medir. */
    if (location.hash.length > 1) {
      var pedido = location.hash.slice(1);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          for (var i = 0; i < paradas.length; i++) {
            if (paradas[i].id === pedido) {
              window.scrollTo(0, destinoDe(paradas[i]));
              SmilersScroll.pedir();
              return;
            }
          }
        });
      });
    }

    /* La primera pasada, al final del todo: `leer` y `escribir` se apoyan en
       las paradas y en los botones del riel, que se arman mas arriba. */
    SmilersScroll.pedir();
  })();
});
