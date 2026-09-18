document.addEventListener('DOMContentLoaded', function () {

  var quietud = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Enciende las fotos aplazadas de un trozo de pagina. Van con la direccion
     en `data-src` / `data-srcset` porque `loading="lazy"` no sirve aqui:
     las tomas de un carrusel estan una encima de otra y las capas de la
     escena de Nosotros ocupan la pantalla a la vez, asi que el navegador las
     da todas por visibles y se las bajaba de golpe. El `<source>` va antes
     que el `<img>` en el documento, que es el orden en que hay que
     encenderlos para que el navegador elija bien. */
  function encender(nodo) {
    if (!nodo) return;
    var piezas = nodo.querySelectorAll('img[data-src], img[data-srcset], source[data-srcset]');
    for (var i = 0; i < piezas.length; i++) {
      var p = piezas[i];
      if (p.dataset.srcset) { p.setAttribute('srcset', p.dataset.srcset); delete p.dataset.srcset; }
      if (p.dataset.src) { p.setAttribute('src', p.dataset.src); delete p.dataset.src; }
    }
  }

  /* El resto, cuando el navegador no tenga nada mejor que hacer, y nunca
     antes de que la pagina acabe de cargar: con una red lenta, adelantar
     fotos que no se ven le quita ancho de banda a la que si se esta
     mirando. */
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
      /* Diez retratos y uno a la vista: el siguiente se enciende con tres
         segundos de margen y el resto en tiempo muerto, y solo desde que la
         escena despierta al elenco. */
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
    /* `p` es donde se deja la pantalla: el punto en que esa capa se ve
       entera y quieta, a medio camino de lo que dura asi. Estaban en el
       arranque de cada entrada —fundamentos en .27, con el texto todavia
       desenfocado, e infraestructura en .86, a media subida— y el circulo
       llevaba a una capa a oscuras o a medio llegar. Los tramos son los de
       `escribir()`: fundamentos esta entera de .30 a .45, el elenco de .59
       a .74 y la infraestructura de .89 hasta que empieza a cerrarse el
       telon, en .92.

       `desde` es a partir de donde cuenta como la capa que se esta viendo,
       para encender su circulo: cuando ya ha tapado a la anterior, no cuando
       se deja la pantalla en ella. */
    var paradas = [
      { id: 'historia',        nombre: 'Historia',        bloque: escena, p: 0,    desde: 0 },
      { id: 'fundamentos',     nombre: 'Fundamentos',     bloque: escena, p: .37,  desde: .21 },
      { id: 'equipo',          nombre: 'Equipo',          bloque: escena, p: .66,  desde: .52 },
      { id: 'infraestructura', nombre: 'Infraestructura', bloque: escena, p: .905, desde: .80 },
      { id: 'cifras',          nombre: 'En cifras',       bloque: cierre, p: .55,  desde: .15 }
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
          if (suyo >= parada.desde) mejor = i;
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

    /* -------------------------------------------------------------------
       Los topes: el scroll se para en cada parada.

       La escena son casi seis pantallas de recorrido para cuatro capas, y
       un gesto rapido las cruzaba todas de una vez —la rueda girada con
       ganas o el dedo lanzado en el telefono— y los telones y las entradas
       pasaban en un parpadeo. Ahora cada gesto lleva a la parada siguiente
       y alli se queda, con un deslizamiento que deja ver la escena. Se sale
       de los topes pasada la ultima, la de las cifras: de ahi al pie de
       pagina el scroll vuelve a ser el de siempre.

       No es `scroll-snap` a proposito, y se probo. Con rueda el navegador
       salta de parada en parada en menos de medio segundo —todo el telon de
       fundamentos cruzando de un golpe—. Con el dedo es peor: en `mandatory`
       el navegador vuelve a la parada de partida si el gesto no pasa de la
       mitad, y en el telefono las paradas estan a pantalla y media, asi que
       casi todo gesto normal rebotaba; en `proximity` avanza, pero un gesto
       rapido se salta paradas, que es justo lo que habia que quitar.
       ------------------------------------------------------------------- */
    var conRaton = window.matchMedia('(hover: hover) and (pointer: fine)');

    function posicionesTopes() {
      var lista = [];
      for (var i = 0; i < paradas.length; i++) {
        var parada = paradas[i];
        if (parada.bloque === escena ? viva : cierreVivo) lista.push(destinoDe(parada));
      }
      return lista;
    }

    /* La parada siguiente en esa direccion, o null si no hay. */
    function topeHacia(topes, y, direccion) {
      var i;
      if (direccion > 0) {
        for (i = 0; i < topes.length; i++) if (topes[i] > y + 2) return topes[i];
      } else {
        for (i = topes.length - 1; i >= 0; i--) if (topes[i] < y - 2) return topes[i];
      }
      return null;
    }

    /* Fuera de los topes: bajando desde la ultima parada hacia el pie,
       subiendo desde la primera, o subiendo por el pie mientras no se vuelva
       a entrar en la escena. Ahi manda el scroll de siempre. */
    function fueraDeTopes(topes, y, delta) {
      var primero = topes[0];
      var ultimo = topes[topes.length - 1];
      return (delta > 0 && y >= ultimo - 2) ||
             (delta < 0 && (y <= primero + 2 || y + delta > ultimo));
    }

    /* Con raton cada racha de rueda es un paso: el primer golpe manda
       deslizar hasta la parada siguiente y el resto de la racha —la inercia
       del trackpad, o la rueda girada de un tiron— se descarta hasta que la
       mano se para un momento (`PAUSA_RACHA`). */
    var PAUSA_RACHA = 220;
    var ultimaRueda = 0;
    var deslizandoHasta = 0;
    /* Si el golpe anterior de la racha ya fue nuestro. Subiendo desde el pie
       la racha empieza con rueda normal y entra en los topes a mitad: ese
       primer golpe dentro tiene que valer, que si no la racha se quedaba
       parada a un palmo de las cifras y hacia falta otro giro para llegar. */
    var rachaNuestra = false;

    function alRodar(evento) {
      if (!viva || !conRaton.matches || quietud.matches) return;
      if (evento.ctrlKey || Math.abs(evento.deltaX) > Math.abs(evento.deltaY)) return;

      var ahora = Date.now();
      var pausa = ahora - ultimaRueda;
      ultimaRueda = ahora;

      var topes = posicionesTopes();
      if (topes.length < 2) return;
      var y = window.scrollY;
      var escala = evento.deltaMode === 1 ? 40 : (evento.deltaMode === 2 ? window.innerHeight : 1);
      var delta = evento.deltaY * escala;
      if (!delta) return;

      if (fueraDeTopes(topes, y, delta)) {
        rachaNuestra = false;
        return;
      }

      evento.preventDefault();
      /* Que no llegue a la ventana: alli el planificador cancela cualquier
         deslizamiento en cuanto se mueve la rueda, y este es el nuestro. */
      evento.stopPropagation();
      var seguida = pausa < PAUSA_RACHA && rachaNuestra;
      rachaNuestra = true;
      if (ahora < deslizandoHasta || seguida) return;

      var destino = topeHacia(topes, y, delta);
      if (destino === null) return;

      var duracion = Math.round(Math.min(1500, Math.max(1000, 600 + Math.abs(destino - y) * .45)));
      deslizandoHasta = ahora + duracion + 80;
      SmilersScroll.deslizarA(destino, duracion);
    }
    document.addEventListener('wheel', alRodar, { passive: false, capture: true });

    /* Con el dedo, la escena va pegada al dedo mientras se arrastra —se ve
       el telon moverse bajo la yema— pero sin pasar de la parada de delante
       ni de la de atras. Al soltar decide la direccion del gesto: si iba
       lanzado, o si se arrastro mas de un 12% de pantalla, sigue hasta la
       parada siguiente arrancando a la velocidad del dedo y frenando al
       llegar; si fue un roce, vuelve a donde estaba. El gesto horizontal no
       se toca: es de los carruseles. */
    var dedo = null;
    var VELOCIDAD_LANZADO = .25; // px por ms

    /* Y la vuelta desde abajo. Por el pie el dedo es el de siempre, con su
       inercia, y esa inercia se colaba por encima de las cifras y cruzaba
       media escena de un tiron. Si un gesto que empezo por debajo de la
       ultima parada la cruza subiendo, se frena en ella: un instante de
       `overflow: hidden` en la pagina corta la inercia del navegador, que un
       `scrollTo` a secas no para. */
    var vigilaInercia = false;
    var ultimoTope = 0;

    function frenarEn(y) {
      var raiz = document.documentElement;
      raiz.classList.add('smilers-deslizando');
      raiz.style.overflow = 'hidden';
      window.scrollTo(0, y);
      setTimeout(function () {
        raiz.style.overflow = '';
        raiz.classList.remove('smilers-deslizando');
      }, 150);
    }

    window.addEventListener('scroll', function () {
      if (!vigilaInercia || (dedo && dedo.nuestro)) return;
      if (window.scrollY < ultimoTope - 1) {
        vigilaInercia = false;
        frenarEn(ultimoTope);
      }
    }, { passive: true });

    function alTocar(evento) {
      dedo = null;
      vigilaInercia = false;
      if (!viva || quietud.matches || evento.touches.length !== 1) return;
      var topesAhora = posicionesTopes();
      if (topesAhora.length) {
        ultimoTope = topesAhora[topesAhora.length - 1];
        vigilaInercia = window.scrollY > ultimoTope + 2;
      }
      var t = evento.touches[0];
      dedo = {
        x: t.clientX, y: t.clientY, desde: window.scrollY,
        decidido: false, nuestro: false,
        muestras: [{ y: t.clientY, t: evento.timeStamp }]
      };
    }

    function alArrastrar(evento) {
      if (!dedo) return;
      if (evento.touches.length !== 1) { dedo = null; return; }
      var t = evento.touches[0];

      if (!dedo.decidido) {
        var dx = t.clientX - dedo.x;
        var dy = t.clientY - dedo.y;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        dedo.decidido = true;
        var topes = posicionesTopes();
        if (Math.abs(dx) > Math.abs(dy) || topes.length < 2 ||
            fueraDeTopes(topes, dedo.desde, -dy)) {
          dedo = null;
          return;
        }
        dedo.nuestro = true;
        dedo.topes = topes;
        var atras = topeHacia(topes, dedo.desde, -1);
        var delante = topeHacia(topes, dedo.desde, 1);
        dedo.min = atras === null ? dedo.desde : atras;
        dedo.max = delante === null ? dedo.desde : delante;
        /* Sin el `scroll-behavior: smooth` de la pagina mientras tanto: con
           el, cada `scrollTo` se animaba por su cuenta y la escena llegaba
           tarde al dedo. */
        document.documentElement.classList.add('smilers-deslizando');
      }

      if (!dedo.nuestro) return;
      evento.preventDefault();
      var y = dedo.desde - (t.clientY - dedo.y);
      window.scrollTo(0, Math.round(Math.min(dedo.max, Math.max(dedo.min, y))));
      dedo.muestras.push({ y: t.clientY, t: evento.timeStamp });
      if (dedo.muestras.length > 8) dedo.muestras.shift();
    }

    function alSoltar(evento) {
      var d = dedo;
      dedo = null;
      if (!d || !d.nuestro) return;

      /* La velocidad de los ultimos 100ms, en pixeles de pagina: positiva
         es bajar, que es subir el dedo. */
      var ultima = d.muestras[d.muestras.length - 1];
      var vieja = ultima;
      for (var i = d.muestras.length - 1; i >= 0; i--) {
        if (evento.timeStamp - d.muestras[i].t > 100) break;
        vieja = d.muestras[i];
      }
      var velocidad = -(ultima.y - vieja.y) / Math.max(1, ultima.t - vieja.t);
      var y = window.scrollY;
      var movido = y - d.desde;

      var direccion = 0;
      if (Math.abs(velocidad) > VELOCIDAD_LANZADO) direccion = velocidad > 0 ? 1 : -1;
      else if (Math.abs(movido) > window.innerHeight * .12) direccion = movido > 0 ? 1 : -1;

      var destino;
      if (direccion > 0) destino = d.max;
      else if (direccion < 0) destino = d.min;
      else {
        /* Un roce: de vuelta a la parada de la que salio, o a la mas
           cercana si el gesto empezo entre dos. */
        var enParada = d.topes.some(function (tope) { return Math.abs(tope - d.desde) <= 2; });
        destino = enParada ? d.desde : (Math.abs(y - d.min) <= Math.abs(d.max - y) ? d.min : d.max);
      }

      document.documentElement.classList.remove('smilers-deslizando');
      var resto = Math.abs(destino - y);
      if (resto < 2) return;
      SmilersScroll.deslizarA(destino, Math.round(Math.min(1300, Math.max(700, 450 + resto * .6))), true);
    }

    document.addEventListener('touchstart', alTocar, { passive: true });
    document.addEventListener('touchmove', alArrastrar, { passive: false });
    document.addEventListener('touchend', alSoltar, { passive: true });
    document.addEventListener('touchcancel', alSoltar, { passive: true });


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
