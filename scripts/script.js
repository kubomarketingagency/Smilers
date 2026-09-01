/* ==========================================================================
   SMILERS DENTAL CLINIQUE — JavaScript principal
   Contiene:
     1. Configuración global (número de WhatsApp)
     2. Navbar con efecto scroll
     3. Cierre automático del menú en móvil
     4. Botón "volver arriba"
     5. Animaciones de aparición (IntersectionObserver)
     5b. Transición "cierre" entre secciones (paneles tipo obturador)
     6. Contadores animados de estadísticas
     6b. Selector de mapa (Matriz / Sucursal) en el footer
     7. Formulario del footer -> API de WhatsApp
     8. Año automático en el footer
     9. Galería: filtros por categoría
     10. Galería: lightbox
     11. Comparador antes/después
     12. Paralaje de formas decorativas
     13. FAQ: abrir pregunta enlazada por #hash
     14. Carrusel del hero: sincronizar puntos con el slide activo
     14e. Cierre cine: cortina negra que se levanta antes de la banda CTA
     14f. Oscurecimiento al acercarse a Tratamientos (ambos sentidos)
     (la intro de marca en banners de páginas interiores es 100% CSS,
      ver .banner-video-intro / .intro-logo en estilos.css)
   ========================================================================== */

/* ===== 1. CONFIGURACIÓN GLOBAL ==========================================
   IMPORTANTE: escribe el número en formato internacional,
   SIN "+", SIN espacios y SIN guiones.
   Ejemplo Ecuador: 593 + 9 dígitos  ->  '593997556002'
   ======================================================================== */
const NUMERO_WHATSAPP = '593997556002';


/* Ejecutamos todo cuando el DOM esté listo */
document.addEventListener('DOMContentLoaded', function () {

  /* ===== 2. NAVBAR: fija, compacta al bajar y se oculta/reaparece ========
     segun la direccion del scroll ========================================= *
     - Umbrales distintos para activar (80px) y desactivar (40px) el modo
       compacto: si usaramos uno solo, el scroll natural del mouse/dedo hace
       que la clase entre y salga varias veces por segundo justo en ese punto,
       y el logo (que cambia de tamaño con .con-scroll) tiembla.
     - Al bajar se oculta (transform: translateY, solo compositor, no
       dispara layout); al subir vuelve a aparecer de inmediato. Cerca del
       tope (< 120px) se ignora la direccion para que no "parpadee" con el
       primer scroll chiquito.
     - rAF evita correr la lectura/escritura de estilos mas de una vez por
       frame; sin esto, cada evento "scroll" (docenas por segundo) fuerza
       su propio recalculo. */
  const navbar = document.getElementById('navbarPrincipal');
  // Declarado aquí (antes de usarse en controlarNavbar) para que el menú
  // hamburguesa (sección 3, más abajo) y el auto-hide del navbar compartan
  // una sola referencia: mientras el menú está abierto, el navbar (con la
  // X dentro) se queda congelado en su sitio, sin importar si algún scroll
  // residual se cuela pese al overflow:hidden del body.
  const menu = document.getElementById('menuPrincipal');
  let tickeando = false;
  let ultimoScrollY = window.scrollY;

  function controlarNavbar() {
    if (menu.classList.contains('menu-abierto')) {
      tickeando = false;
      return;
    }

    const y = window.scrollY;

    if (y > 80) {
      navbar.classList.add('con-scroll');
    } else if (y < 40) {
      navbar.classList.remove('con-scroll');
    }

    if (y < 120) {
      navbar.classList.remove('navbar-oculto');
    } else if (y > ultimoScrollY) {
      navbar.classList.add('navbar-oculto');       // bajando -> se oculta
    } else if (y < ultimoScrollY) {
      navbar.classList.remove('navbar-oculto');    // subiendo -> reaparece
    }

    ultimoScrollY = y;
    tickeando = false;
  }

  window.addEventListener('scroll', function () {
    if (!tickeando) {
      tickeando = true;
      requestAnimationFrame(controlarNavbar);
    }
  }, { passive: true });
  controlarNavbar(); // se ejecuta una vez por si la página carga ya desplazada


  /* ===== 3. MENÚ HAMBURGUESA (pantalla completa, todos los dispositivos) ==
     Implementación propia (no el Collapse de Bootstrap): el panel ahora
     cubre todo el viewport (ver estilos.css), así que bloqueamos el scroll
     del body mientras está abierto — evita que el fondo se desplace detrás
     del desenfoque — y controlarNavbar() (sección 2) se congela mientras
     "menu-abierto" siga puesto, así que la X nunca se mueve ni desaparece
     mientras el panel sigue desplegado. ("menu" ya se declaró en la
     sección 2, para que controlarNavbar() lo pueda leer.) ============= */
  const botonMenu = document.querySelector('.navbar-toggler');
  const enlacesMenu = document.querySelectorAll('#menuPrincipal .nav-link, #menuPrincipal .btn');

  function alternarMenu(forzarCerrado) {
    const abierto = menu.classList.contains('menu-abierto');
    const nuevoEstado = forzarCerrado ? false : !abierto;
    menu.classList.toggle('menu-abierto', nuevoEstado);
    botonMenu.setAttribute('aria-expanded', String(nuevoEstado));
    document.body.style.overflow = nuevoEstado ? 'hidden' : '';
    // Al abrir, el navbar vuelve a su sitio de inmediato (por si ya estaba
    // oculto por scroll) para que la X no aparezca a medio camino.
    if (nuevoEstado) navbar.classList.remove('navbar-oculto');
  }

  if (botonMenu) {
    botonMenu.addEventListener('click', function () { alternarMenu(); });
  }

  enlacesMenu.forEach(function (enlace) {
    enlace.addEventListener('click', function () { alternarMenu(true); });
  });


  /* ===== 4. BOTÓN "VOLVER ARRIBA" ===================================== */
  const btnSubir = document.getElementById('btnSubir');

  window.addEventListener('scroll', function () {
    btnSubir.classList.toggle('visible', window.scrollY > 400);
  });

  btnSubir.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  /* ===== 5. ANIMACIÓN DE APARICIÓN AL HACER SCROLL ====================
     Bidireccional: aparece con un pequeño escalonado al bajar y se retira
     al subir. Se guarda el temporizador pendiente por elemento para poder
     cancelarlo si el usuario invierte el scroll antes de que llegue a
     dispararse.
     Umbral con "histéresis" (threshold: [0, 0.15]) + un pequeño "debounce"
     al ocultar: en un scroll lento la relación de intersección de un
     elemento puede rebotar un par de veces justo alrededor del 0% o el 15%
     en fracciones de segundo — con solo la histéresis eso todavía alcanzaba
     a quitar y volver a poner "visible" varias veces seguidas, viéndose
     como un parpadeo/glitch en el párrafo. Ahora "ocultar" no pasa de
     inmediato: espera 400ms, y si el elemento vuelve a cruzar el 15% en ese
     lapso (el rebote), el ocultamiento se cancela y el texto ni se entera. */
  const elementosRevelar = document.querySelectorAll('.revelar');
  const temporizadoresRevelar = new WeakMap();      // "mostrar" pendiente (escalonado)
  const temporizadoresOcultarRevelar = new WeakMap(); // "ocultar" pendiente (debounce)

  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada, indice) {
        if (entrada.intersectionRatio >= 0.15) {
          const ocultarPendiente = temporizadoresOcultarRevelar.get(entrada.target);
          if (ocultarPendiente) {
            clearTimeout(ocultarPendiente);
            temporizadoresOcultarRevelar.delete(entrada.target);
          }

          if (!entrada.target.classList.contains('visible')) {
            const pendiente = temporizadoresRevelar.get(entrada.target);
            if (pendiente) clearTimeout(pendiente);
            const id = setTimeout(function () {
              entrada.target.classList.add('visible');
            }, indice * 100);
            temporizadoresRevelar.set(entrada.target, id);
          }
        } else if (entrada.intersectionRatio === 0) {
          const pendiente = temporizadoresRevelar.get(entrada.target);
          if (pendiente) {
            clearTimeout(pendiente);
            temporizadoresRevelar.delete(entrada.target);
          }

          if (!temporizadoresOcultarRevelar.has(entrada.target)) {
            const idOcultar = setTimeout(function () {
              entrada.target.classList.remove('visible');
              temporizadoresOcultarRevelar.delete(entrada.target);
            }, 400);
            temporizadoresOcultarRevelar.set(entrada.target, idOcultar);
          }
        }
      });
    }, { threshold: [0, 0.15], rootMargin: '0px 0px -8% 0px' });

    elementosRevelar.forEach(function (el) { observador.observe(el); });
  } else {
    // Fallback para navegadores antiguos: se muestra todo directamente
    elementosRevelar.forEach(function (el) { el.classList.add('visible'); });
  }


  /* ===== 5b. TRANSICIÓN "CIERRE" ENTRE SECCIONES ======================
     Cada .cortina cubre su sección con un plano que se desvanece/desenfoca
     (ver .cortina-panel en estilos.css). Bidireccional: se cierra de nuevo
     si la sección sale de pantalla, y se reabre al volver a entrar.
     data-retraso-ms (opcional, ej. la intro de Especialidades) hace que se
     quede quieta ese tiempo antes de abrirse, en vez de abrirse de inmediato.
     Misma histéresis + debounce que en .revelar (ver comentario arriba):
     solo se abre al cruzar el umbral, y "cerrar" espera 400ms por si el
     rebote de un scroll lento la hace cruzar el umbral de nuevo enseguida
     — así un scroll lento no la abre y cierra de golpe varias veces. */
  const cortinas = document.querySelectorAll('.cortina');
  const retrasosCortina = new WeakMap();  // "abrir" pendiente (data-retraso-ms)
  const cierresCortina = new WeakMap();   // "cerrar" pendiente (debounce)

  if ('IntersectionObserver' in window) {
    const obsCortinas = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.intersectionRatio === 0) {
          const pendiente = retrasosCortina.get(entrada.target);
          if (pendiente) {
            clearTimeout(pendiente);
            retrasosCortina.delete(entrada.target);
          }

          if (!cierresCortina.has(entrada.target)) {
            const idCierre = setTimeout(function () {
              entrada.target.classList.remove('abierta');
              cierresCortina.delete(entrada.target);
            }, 400);
            cierresCortina.set(entrada.target, idCierre);
          }
          return;
        }

        if (entrada.intersectionRatio < 0.1) return;

        const cierrePendiente = cierresCortina.get(entrada.target);
        if (cierrePendiente) {
          clearTimeout(cierrePendiente);
          cierresCortina.delete(entrada.target);
        }

        if (entrada.target.classList.contains('abierta')) return;

        const retraso = Number(entrada.target.dataset.retrasoMs || 0);
        const pendiente = retrasosCortina.get(entrada.target);
        if (retraso > 0) {
          if (pendiente) clearTimeout(pendiente);
          const id = setTimeout(function () {
            entrada.target.classList.add('abierta');
          }, retraso);
          retrasosCortina.set(entrada.target, id);
        } else {
          entrada.target.classList.add('abierta');
        }
      });
    }, { threshold: [0, 0.1], rootMargin: '0px 0px -5% 0px' });

    cortinas.forEach(function (el) { obsCortinas.observe(el); });
  } else {
    cortinas.forEach(function (el) { el.classList.add('abierta'); });
  }


  /* ===== 6. CONTADORES ANIMADOS DE ESTADÍSTICAS =======================
     Se reproduce cada vez que la franja entra en pantalla (no solo la
     primera): al salir, el número vuelve a 0 para que el próximo ingreso
     se sienta igual de impactante. "runId" por elemento invalida cualquier
     rAF de una corrida anterior que siga en el aire (ej. si el usuario
     entra y sale muy rápido) para que dos animaciones no escriban a la vez
     sobre el mismo número. ==================================================== */
  const contadores = document.querySelectorAll('[data-contador]');
  const runIdContador = new WeakMap();

  function animarContador(elemento) {
    const idPropio = (runIdContador.get(elemento) || 0) + 1;
    runIdContador.set(elemento, idPropio);

    const objetivo = parseInt(elemento.dataset.contador, 10);
    const duracion = 1600;              // milisegundos
    const inicio = performance.now();

    function paso(ahora) {
      if (runIdContador.get(elemento) !== idPropio) return; // otra corrida la reemplazó
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      elemento.textContent = Math.floor(progreso * objetivo).toLocaleString('es-MX');
      if (progreso < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  if ('IntersectionObserver' in window) {
    const obsContadores = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          animarContador(entrada.target);
        } else {
          runIdContador.set(entrada.target, (runIdContador.get(entrada.target) || 0) + 1);
          entrada.target.textContent = '0';
        }
      });
    }, { threshold: 0.5 });

    contadores.forEach(function (c) { obsContadores.observe(c); });
  }


  /* ===== 6b. SELECTOR DE MAPA (MATRIZ / SUCURSAL) EN EL FOOTER ========= */
  const mapaTabs = document.querySelectorAll('.mapa-tab');
  const mapaIframes = document.querySelectorAll('.mapa-iframe');

  mapaTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const sede = tab.dataset.mapa;

      mapaTabs.forEach(function (t) {
        t.classList.toggle('activo', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      mapaIframes.forEach(function (frame) {
        frame.classList.toggle('activo', frame.dataset.mapa === sede);
      });
    });
  });


  /* ===== 7. FORMULARIO DEL FOOTER -> API DE WHATSAPP ==================
     Captura Nombre y Mensaje, valida, arma el texto y abre wa.me
     ==================================================================== */
  const formulario = document.getElementById('formWhatsapp');
  const aviso = document.getElementById('formAviso');

  if (formulario) {
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault(); // evita que la página se recargue

      const campoNombre = document.getElementById('nombre');
      const campoMensaje = document.getElementById('mensaje');

      const nombre = campoNombre.value.trim();
      const mensaje = campoMensaje.value.trim();

      // --- Limpiamos estados previos ---
      campoNombre.classList.remove('error');
      campoMensaje.classList.remove('error');
      aviso.className = 'form-aviso';
      aviso.textContent = '';

      // --- Validación simple ---
      let hayErrores = false;

      if (nombre.length < 2) {
        campoNombre.classList.add('error');
        hayErrores = true;
      }
      if (mensaje.length < 5) {
        campoMensaje.classList.add('error');
        hayErrores = true;
      }

      if (hayErrores) {
        aviso.classList.add('error');
        aviso.textContent = 'Por favor completa tu nombre y un mensaje válido.';
        return;
      }

      // --- Construcción del mensaje preescrito ---
      // %0A = salto de línea codificado para URL
      const texto =
        '¡Hola Smilers Dental Clinique! 👋\n\n' +
        'Mi nombre es: ' + nombre + '\n' +
        'Mensaje: ' + mensaje + '\n\n' +
        'Enviado desde el sitio web.';

      // encodeURIComponent codifica espacios, saltos de línea, emojis y acentos
      const url = 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto);

      // --- Abrimos WhatsApp en una pestaña nueva ---
      window.open(url, '_blank');

      // --- Confirmación visual y reseteo del formulario ---
      aviso.classList.add('exito');
      aviso.textContent = '¡Listo! Abrimos WhatsApp para enviar tu mensaje.';
      formulario.reset();

      // El aviso desaparece después de 6 segundos
      setTimeout(function () {
        aviso.className = 'form-aviso';
        aviso.textContent = '';
      }, 6000);
    });
  }


  /* ===== 8. AÑO AUTOMÁTICO EN EL FOOTER =============================== */
  const anio = document.getElementById('anioActual');
  if (anio) anio.textContent = new Date().getFullYear();


  /* ===== 9. GALERÍA: FILTROS POR CATEGORÍA (solo en galeria.html) ===== */
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
            // Pequeño retardo para permitir la transición de opacidad/escala
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { item.classList.add('aparecer'); });
            });
          } else {
            item.classList.remove('mostrar');
          }
        });
      });
    });
  }


  /* ===== 10. GALERÍA: LIGHTBOX con el modal de Bootstrap =============== */
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


  /* ===== 11. COMPARADOR ANTES / DESPUÉS =================================
     El cursor "raya" la imagen: en mouse basta con pasar por encima
     (sin necesidad de mantener el clic); en táctil se arrastra con el dedo.
     El <input type="range"> queda sincronizado para teclado/lectores de
     pantalla.
     ======================================================================== */
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

    marco.addEventListener('pointerdown', function (evento) {
      fijarPosicion(porcentajeDesdeEvento(evento));
    });
    marco.addEventListener('pointermove', function (evento) {
      // En mouse reacciona con solo pasar el cursor; en táctil/pluma
      // solo mientras hay contacto (pressure > 0).
      if (evento.pointerType === 'mouse' || evento.pressure > 0) {
        fijarPosicion(porcentajeDesdeEvento(evento));
      }
    });

    rango.addEventListener('input', function () {
      fijarPosicion(Number(rango.value));
    });
  });


  /* ===== 11b. ACORDEÓN DE TRATAMIENTOS (solo móvil, tratamientos.html) ===
     En escritorio/tablet el botón está oculto por CSS y esto no hace nada.
     En móvil, cada bloque abre/cierra de forma independiente (no exclusiva,
     se pueden tener varios abiertos a la vez). */
  document.querySelectorAll('.acordeon-tratamiento-boton').forEach(function (boton) {
    var panel = document.getElementById(boton.getAttribute('aria-controls'));
    if (!panel) return;

    boton.addEventListener('click', function () {
      var abierto = panel.classList.toggle('abierta');
      boton.setAttribute('aria-expanded', String(abierto));
    });
  });


  /* ===== 12. PARALAJE SUAVE DE FORMAS DECORATIVAS AL MOVER EL CURSOR ===== */
  const formasParallax = document.querySelectorAll('.forma-parallax');

  if (formasParallax.length && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
      && window.matchMedia('(pointer: fine)').matches) {
    let ultimoFrame = null;

    document.addEventListener('mousemove', function (evento) {
      if (ultimoFrame) return; // limita a 1 actualización por frame
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


  /* ===== 12b. ACORDEÓN DE ESPECIALIDADES ==============================
     Puerto en JS puro de un acordeón de imágenes: el panel activo (hover,
     foco de teclado, o tap) se expande y muestra título + descripción.
     En pantallas sin hover confiable (táctiles), el primer tap solo activa
     el panel (sin navegar); un segundo tap sobre el panel ya activo sí
     sigue el enlace — así se puede "ojear" cada especialidad antes de
     entrar a su tratamiento. ======================================== */
  (function () {
    var galeria = document.getElementById('acordeonEspecialidades');
    if (!galeria) return;

    var paneles = Array.prototype.slice.call(galeria.querySelectorAll('.ag-panel'));
    if (!paneles.length) return;

    var tieneHoverFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function activar(panel) {
      paneles.forEach(function (p) {
        var activo = p === panel;
        p.classList.toggle('ag-panel--activo', activo);
        if (activo) p.setAttribute('aria-current', 'true');
        else p.removeAttribute('aria-current');
      });
    }

    paneles.forEach(function (panel, indice) {
      // El listener de "focus" solo se ata en dispositivos con hover fino
      // (mouse/trackpad): en táctil, un tap dispara "focus" ANTES que
      // "click", así que si activara el panel aquí, el click de abajo ya
      // lo encontraba "activo" y navegaba de una vez en el primer toque
      // en vez de solo revelarlo — justo el bug reportado. En touch, el
      // propio click de abajo es el único que decide.
      if (tieneHoverFino) {
        panel.addEventListener('mouseenter', function () { activar(panel); });
        panel.addEventListener('focus', function () { activar(panel); });
      }

      panel.addEventListener('click', function (evento) {
        // En dispositivos sin hover fino, el primer tap solo revela el
        // panel; hace falta un segundo tap (ya activo) para navegar.
        if (!tieneHoverFino && !panel.classList.contains('ag-panel--activo')) {
          evento.preventDefault();
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
  })();


  /* ===== 12c. MARQUEE DE LA BANDA CTA ==================================
     Arma en JS las columnas de la cinta (en vez de fijas en el HTML): con
     un set fijo de 4 columnas el ancho no alcanzaba a cubrir pantallas
     anchas, y a mitad del loop (translateX acercándose a -50%) se veía un
     hueco negro antes de que la copia siguiente entrara por la derecha —
     las fotos "desaparecían" un instante en vez de desplazarse siempre
     continuas. Aquí se mide el ancho real de la ventana y se repiten las
     columnas las veces que hagan falta para que el set (mitad de la
     cinta) sea SIEMPRE más ancho que la pantalla, con margen de sobra —
     condición necesaria para que el truco "duplicar + trasladar -50%" del
     CSS (@keyframes banda-cta-marquee) haga un loop sin costura en
     cualquier monitor. Corre una sola vez al cargar: un carrusel de fondo
     no necesita recalcularse en cada resize. */
  (function () {
    var cinta = document.getElementById('bandaCtaMasonryCinta');
    if (!cinta) return;

    var grupos = [
      ['imagenes/hero-1.webp', 'imagenes/equipo-1.webp', 'imagenes/sonrisa.webp'],
      ['imagenes/hero-2.webp', 'imagenes/equipo-3.webp', 'imagenes/tecnologia.webp'],
      ['imagenes/hero-3.webp', 'imagenes/equipo-2.webp', 'imagenes/cirugia.webp'],
      ['imagenes/equipo-4.webp', 'imagenes/implantologia.webp', 'imagenes/nosotros.webp']
    ];

    function crearColumna(grupo) {
      var col = document.createElement('div');
      col.className = 'banda-cta-masonry__col';
      grupo.forEach(function (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        col.appendChild(img);
      });
      return col;
    }

    // Ancho de columna + gap: coincide con .banda-cta-masonry__col en
    // estilos.css (190px + 6px de gap; 220px + 6px desde el breakpoint lg).
    var anchoColumna = window.matchMedia('(min-width: 992px)').matches ? 226 : 196;
    // 1.6x el ancho de ventana: margen de sobra para que un resize
    // moderado (o un monitor más ancho de lo esperado) no vuelva a dejar
    // el set corto, sin necesidad de escuchar "resize" para un fondo
    // puramente decorativo.
    var anchoNecesario = window.innerWidth * 1.6;

    var set = [];
    var anchoSet = 0;
    var indice = 0;
    while (anchoSet < anchoNecesario) {
      set.push(grupos[indice % grupos.length]);
      anchoSet += anchoColumna;
      indice++;
    }

    // Set A + copia idéntica A': el mismo truco de loop sin costura,
    // ahora con un set garantizado más ancho que la pantalla.
    set.concat(set).forEach(function (grupo) {
      cinta.appendChild(crearColumna(grupo));
    });
  })();


  /* ===== 13. FAQ: abre automáticamente la pregunta enlazada por #hash === */
  if (window.location.hash) {
    const objetivo = document.querySelector(window.location.hash);
    if (objetivo && objetivo.classList.contains('accordion-collapse')) {
      const colapsable = new bootstrap.Collapse(objetivo, { toggle: true });
      objetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }


  /* ===== 14. CARRUSEL DEL HERO: destello dorado al cambiar de foto =======
     Sin puntos/flechas visibles (el fondo es puramente el video/fotos en
     blanco y negro): lo único que sincronizamos aquí es el "destello" que
     se dispara justo al intercambiar de foto.
     ======================================================================== */
  const heroCarrusel = document.getElementById('heroCarrusel');
  var heroFlash = document.getElementById('heroFlash');
  var sinMovimientoFlash = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroCarrusel) {
    heroCarrusel.addEventListener('slide.bs.carousel', function () {
      // Destello dorado justo al intercambiar de foto (el "flash" que pide
      // el look tipo depaudental.com): se relanza la animación quitando y
      // volviendo a poner la clase en el siguiente frame.
      if (heroFlash && !sinMovimientoFlash) {
        heroFlash.classList.remove('destello');
        void heroFlash.offsetWidth; // fuerza reflow para poder reiniciar la animación
        heroFlash.classList.add('destello');
      }
    });

    /* WCAG 2.2.2 (Pausar, detener, ocultar): el carrusel se auto-avanza cada
       5,5 s. Quien ha pedido menos movimiento en su sistema no debe recibir
       contenido que cambia solo; el carrusel se detiene en el primer slide y
       los puntos siguen funcionando para navegarlo a mano. */
    var menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

    function aplicarPreferenciaMovimiento() {
      var instancia = bootstrap.Carousel.getInstance(heroCarrusel)
                   || new bootstrap.Carousel(heroCarrusel);
      if (menosMovimiento.matches) {
        instancia.pause();
      } else {
        instancia.cycle();
      }
    }

    aplicarPreferenciaMovimiento();
    menosMovimiento.addEventListener('change', aplicarPreferenciaMovimiento);
  }


  /* ===== 14b. HERO: destellos dorados flotando (canvas) =================
     Pequeñas motas de luz dorada que flotan despacio sobre el blanco y
     negro del hero, como polvo suspendido bajo un foco de luz — el toque
     "cine" que pide el brief, sin depender de un archivo de video real.
     Puramente decorativo (aria-hidden): si prefers-reduced-motion está
     activo, o el navegador no soporta canvas, el hero se ve completo igual.
     ======================================================================== */
  (function () {
    var canvas = document.getElementById('heroSparkles');
    var heroEl = document.querySelector('.hero');
    if (!canvas || !heroEl || !canvas.getContext) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = canvas.getContext('2d');
    var particulas = [];
    var ancho, alto, animando = false, cuadro;

    function redimensionar() {
      ancho = canvas.width = heroEl.offsetWidth;
      alto = canvas.height = heroEl.offsetHeight;
      var cantidad = Math.round((ancho * alto) / 22000); // densidad ~ tamaño del hero
      particulas = [];
      for (var i = 0; i < cantidad; i++) {
        particulas.push(crearParticula());
      }
    }

    function crearParticula() {
      return {
        x: Math.random() * ancho,
        y: Math.random() * alto,
        r: Math.random() * 1.6 + .4,
        velY: Math.random() * -.25 - .05,
        velX: (Math.random() - .5) * .12,
        fase: Math.random() * Math.PI * 2,
        velFase: Math.random() * .015 + .005
      };
    }

    function dibujar() {
      ctx.clearRect(0, 0, ancho, alto);
      for (var i = 0; i < particulas.length; i++) {
        var p = particulas[i];
        p.fase += p.velFase;
        p.x += p.velX;
        p.y += p.velY;

        if (p.y < -10) { p.y = alto + 10; p.x = Math.random() * ancho; }
        if (p.x < -10) p.x = ancho + 10;
        if (p.x > ancho + 10) p.x = -10;

        var brillo = (Math.sin(p.fase) + 1) / 2; // 0..1, parpadeo suave
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 175, 61, ' + (brillo * .8) + ')';
        ctx.fill();
      }
      cuadro = requestAnimationFrame(dibujar);
    }

    function iniciar() {
      if (animando) return;
      animando = true;
      redimensionar();
      cuadro = requestAnimationFrame(dibujar);
    }
    function detener() {
      animando = false;
      if (cuadro) cancelAnimationFrame(cuadro);
    }

    // Solo anima mientras el hero está en pantalla (ahorra batería al bajar)
    if ('IntersectionObserver' in window) {
      var obsHero = new IntersectionObserver(function (entradas) {
        entradas[0].isIntersecting ? iniciar() : detener();
      }, { threshold: 0 });
      obsHero.observe(heroEl);
    } else {
      iniciar();
    }

    var redimensionarPendiente;
    window.addEventListener('resize', function () {
      clearTimeout(redimensionarPendiente);
      redimensionarPendiente = setTimeout(redimensionar, 200);
    });
  })();


  /* ===== 14c. HERO CINE: pin + fundido controlado por scroll ============
     Imita el mecanismo del banner de depaudental.com: el hero queda fijo
     en pantalla (position:sticky en CSS) mientras el contenedor
     ".hero-cine" (más alto que el viewport) se desplaza detrás; aquí solo
     calculamos qué tan avanzado está ese desplazamiento (0 a 1) y lo
     traducimos en opacidad para fundir la etapa 1 (fotos en B/N) hacia la
     etapa 2 (mosaico + titular). Con prefers-reduced-motion el CSS ya deja
     todo estático y este script ni se ejecuta. ========================= */
  (function () {
    var envoltorio = document.getElementById('heroCine');
    var etapa1 = document.getElementById('heroEtapa1');
    var etapa2 = document.getElementById('heroEtapa2');
    if (!envoltorio || !etapa1 || !etapa2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var heroTitulo = etapa1.querySelector('.hero-titulo');
    var columnas = etapa2.querySelectorAll('.hero-etapa2-col');
    var tagline = etapa2.querySelector('.hero-etapa2-tagline');
    var tickeandoCine = false;

    function acotar(valor) { return Math.min(1, Math.max(0, valor)); }

    function actualizarCine() {
      var rect = envoltorio.getBoundingClientRect();
      var alturaDesplazable = envoltorio.offsetHeight - window.innerHeight;
      var progreso = alturaDesplazable > 0 ? acotar(-rect.top / alturaDesplazable) : 0;

      // Presupuesto del recorrido (0 a 1), con una zona de "estancia" real
      // en el medio (48%-80%) para que la sección de profesionales se
      // pueda ver completa en vez de que la entrada y la salida se sientan
      // consecutivas: cae el wordmark -> se apaga la etapa 1 -> entra el
      // acordeón de profesionales -> ESTANCIA -> se desenfoca y se suelta.
      // .hero-cine ahora es más alto (ver estilos.css) para que cada tramo
      // tenga suficiente distancia real de scroll y no se sienta atropellado.

      // El wordmark "Smilers" cae y se desvanece primero.
      if (heroTitulo) {
        var caidaTitulo = acotar((progreso - .08) / .30);
        heroTitulo.style.opacity = String(1 - caidaTitulo);
        heroTitulo.style.transform = 'translateY(' + (caidaTitulo * 150) + 'px)';
      }

      // Etapa 1 (fotos) se desvanece justo después, del 24% al 36%.
      var salida1 = acotar((progreso - .24) / .12);
      etapa1.style.opacity = String(1 - salida1);

      // Etapa 2 entra del 34% al 58%: se alarga a propósito (antes 34%-48%)
      // para que las columnas de profesionales se vean aparecer una por una
      // con calma en vez de sentirse un golpe rápido — más dinámico y legible.
      var entrada2 = acotar((progreso - .34) / .24);

      // ...se queda completa y quieta del 58% al 80% (zona de estancia,
      // sin animación) para poder verla y leer la frase con calma...
      // ...y del 80% al 100% sale escalonada hacia el lado CONTRARIO al que
      // entró (si entró subiendo, sale deslizándose de lado) y se difumina
      // columna por columna, en vez de un corte seco — la sección de abajo
      // (Nosotros, usada como "cuerpo" con más contenido) va apareciendo
      // detrás mientras esto se disuelve.
      var salida2 = acotar((progreso - .80) / .20);
      etapa2.style.opacity = String(entrada2);

      columnas.forEach(function (col, indice) {
        // Escalonado más marcado entre columnas (antes .12) para que se
        // note claramente cómo van apareciendo una tras otra, no casi juntas.
        var propio = acotar((entrada2 - indice * .16) / (1 - indice * .16 || 1));
        // La salida se escalona en el orden CONTRARIO al de entrada (la
        // última columna en entrar es la primera en irse), para que se
        // sienta como un movimiento distinto y no un simple "reversa".
        var indiceSalida = columnas.length - 1 - indice;
        var salidaPropia = acotar((salida2 - indiceSalida * .15) / (1 - indiceSalida * .15 || 1));

        col.style.opacity = String(propio * (1 - salidaPropia));
        col.style.transform = 'translateY(' + ((1 - propio) * 40) + 'px) translateX(' + (salidaPropia * -70) + 'px)';
        col.style.filter = salidaPropia > 0 ? 'blur(' + (salidaPropia * 20) + 'px)' : '';
        // Efecto acordeón: cada columna arranca angosta y se "despliega"
        // hasta su ancho pleno en vez de solo aparecer en su sitio.
        col.style.flexGrow = String(.12 + propio * .88);
      });

      if (tagline) {
        var propioTag = acotar((entrada2 - .3) / .7);
        tagline.style.opacity = String(propioTag * (1 - salida2));
        tagline.style.transform = 'translateY(' + ((1 - propioTag) * 24 + salida2 * -30) + 'px)';
        // Borrosa -> nítida al entrar, y vuelve a desenfocarse al salir.
        var blurTag = Math.max((1 - propioTag) * 16, salida2 * 16);
        tagline.style.filter = 'blur(' + blurTag + 'px)';
      }

      tickeandoCine = false;
    }

    window.addEventListener('scroll', function () {
      if (!tickeandoCine) { tickeandoCine = true; requestAnimationFrame(actualizarCine); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (!tickeandoCine) { tickeandoCine = true; requestAnimationFrame(actualizarCine); }
    });
    actualizarCine();


    /* ===== 14d. AUTO-SCROLL ASISTIDO (bidireccional) ====================
       Asistencias puntuales, no un scroll-snap de CSS: aquel se quitó por
       completo (ver el comentario junto a scroll-padding-top en
       estilos.css) porque se quedaba trabado al pelear con cada evento de
       scroll. Este mecanismo en cambio espera a que el usuario se detenga
       de verdad (250ms sin eventos de scroll, aproxima "scrollend") y solo
       ENTONCES completa el recorrido con un scrollTo suave, una sola vez
       por acercamiento — nunca interrumpe un scroll en curso ni se repite
       en bucle, así que no puede volver a trabar la página.
       Cada asistencia respeta la DIRECCIÓN con la que se llegó: se activa
       solo si el usuario venía avanzando hacia ella, nunca si se alejaba
       (si no, al alejarse de un tirón lo suficiente como para pausar justo
       en la zona, lo arrastraría de vuelta contra su propia intención).
       1) Smilers -> Profesionales (bajando): si el usuario bajó un poco
          desde el arranque del hero y se detiene, se completa el recorrido
          hasta que el mosaico de profesionales quede revelado y sostenido.
       2) Profesionales -> Smilers (subiendo): el simétrico de (1) — si va
          subiendo y se detiene ya casi saliendo del pin por abajo, completa
          el regreso hasta quedar sostenido del otro lado del mosaico.
       3) Llegada a Tratamientos (bajando): si el usuario se detiene cerca
          del borde del acordeón (pantalla completa, solo en desktop/tablet
          — en móvil la sección crece con el contenido y no aplica), se
          ajusta para que quede exactamente a pantalla completa.
       4) Salida de Tratamientos hacia Nosotros (subiendo): el simétrico de
          (3) — si se detiene saliendo del acordeón por arriba, ajusta para
          que su borde inferior quede exacto contra el pie de pantalla. */
    var especialidades = document.getElementById('especialidades');
    var avanzoHero = false;
    var retrocedioHero = false;
    var alineoTratamientosAbajo = false;
    var alineoTratamientosArriba = false;
    var idleTimerAsistido;
    var ultimoScrollYAsistido = window.scrollY;
    var direccionAsistida = 'down';

    function progresoHero() {
      var rect = envoltorio.getBoundingClientRect();
      var alturaDesplazable = envoltorio.offsetHeight - window.innerHeight;
      return alturaDesplazable > 0 ? acotar(-rect.top / alturaDesplazable) : 0;
    }

    function alScrollQuieto() {
      var progreso = progresoHero();

      if (progreso < .02) {
        avanzoHero = false;
      } else if (progreso < .22 && !avanzoHero && direccionAsistida === 'down') {
        avanzoHero = true;
        var alturaDesplazable = envoltorio.offsetHeight - window.innerHeight;
        var topEnvoltorio = envoltorio.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: topEnvoltorio + alturaDesplazable * .62, behavior: 'smooth' });
      }

      if (progreso > .98) {
        retrocedioHero = false;
      } else if (progreso > .78 && !retrocedioHero && direccionAsistida === 'up') {
        retrocedioHero = true;
        var alturaDesplazable2 = envoltorio.offsetHeight - window.innerHeight;
        var topEnvoltorio2 = envoltorio.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: topEnvoltorio2 + alturaDesplazable2 * .76, behavior: 'smooth' });
      }

      if (especialidades && window.matchMedia('(min-width: 768px)').matches) {
        var rectEsp = especialidades.getBoundingClientRect();
        var visible = Math.min(rectEsp.bottom, window.innerHeight) - Math.max(rectEsp.top, 0);
        var proporcionVisible = visible / rectEsp.height;

        if (proporcionVisible < .06) {
          alineoTratamientosAbajo = false;
          alineoTratamientosArriba = false;
        } else if (proporcionVisible > .35 && proporcionVisible < .96) {
          // Bajando y acercándose desde arriba (su borde superior aún no
          // llega al tope de pantalla): alinear ese borde contra el tope.
          if (direccionAsistida === 'down' && rectEsp.top > 4 && !alineoTratamientosAbajo) {
            alineoTratamientosAbajo = true;
            window.scrollTo({ top: rectEsp.top + window.scrollY, behavior: 'smooth' });
          }
          // Subiendo y acercándose desde abajo (su borde inferior ya no
          // llega al pie de pantalla): alinear ese borde contra el pie.
          if (direccionAsistida === 'up' && rectEsp.bottom < window.innerHeight - 4 && !alineoTratamientosArriba) {
            alineoTratamientosArriba = true;
            window.scrollTo({ top: rectEsp.bottom + window.scrollY - window.innerHeight, behavior: 'smooth' });
          }
        }
      }
    }

    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > ultimoScrollYAsistido + 1) direccionAsistida = 'down';
      else if (y < ultimoScrollYAsistido - 1) direccionAsistida = 'up';
      ultimoScrollYAsistido = y;

      clearTimeout(idleTimerAsistido);
      idleTimerAsistido = setTimeout(alScrollQuieto, 250);
    }, { passive: true });
  })();


  /* ===== 14f. OSCURECIMIENTO AL ACERCARSE A TRATAMIENTOS ================
     Capa fija (.acercamiento-negro) que se oscurece a medida que el borde
     superior del acordeón de Tratamientos se acerca al tope de pantalla, y
     se vuelve a aclarar tanto si se termina de cruzar hacia adentro como si
     uno se aleja de nuevo — es una función continua de la posición, así
     que funciona igual de suave subiendo que bajando sin lógica aparte. */
  (function () {
    var especialidadesOsc = document.getElementById('especialidades');
    var capaNegra = document.getElementById('acercamientoNegro');
    if (!especialidadesOsc || !capaNegra) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var tickeandoOsc = false;

    function acotarOsc(valor) { return Math.min(1, Math.max(0, valor)); }

    function actualizarAcercamiento() {
      var top = especialidadesOsc.getBoundingClientRect().top;
      var progresoOsc;
      if (top >= 0) {
        // Se acerca desde abajo (bajando) o se aleja hacia abajo (subiendo):
        // más oscuro cuanto más cerca del tope de pantalla.
        progresoOsc = acotarOsc(1 - top / window.innerHeight);
      } else {
        // Ya se cruzó su borde superior: se aclara de nuevo a medida que la
        // sección sigue subiendo en pantalla (ya estamos "dentro").
        progresoOsc = acotarOsc(1 + top / window.innerHeight);
      }
      capaNegra.style.opacity = String(progresoOsc * .55);
      tickeandoOsc = false;
    }

    window.addEventListener('scroll', function () {
      if (!tickeandoOsc) { tickeandoOsc = true; requestAnimationFrame(actualizarAcercamiento); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (!tickeandoOsc) { tickeandoOsc = true; requestAnimationFrame(actualizarAcercamiento); }
    });
    actualizarAcercamiento();
  })();


  /* ===== 14e. CIERRE CINE: la cortina negra se levanta con el scroll =====
     Simétrico a 14c: en vez de fundir una foto hacia el negro, aquí el
     negro se desvanece para revelar la banda CTA que ya está armada
     debajo. Misma técnica (progreso 0-1 según cuánto se recorrió el pin),
     nada más que aplicada a una sola capa en vez de varias etapas. */
  (function () {
    var envoltorio = document.getElementById('cierreCine');
    var negro = document.getElementById('cierreCineNegro');
    var contenido = document.querySelector('#bandaCta .banda-cta-contenido');
    if (!envoltorio || !negro) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var tickeandoCierre = false;

    function acotar(valor) { return Math.min(1, Math.max(0, valor)); }

    function actualizarCierre() {
      var rect = envoltorio.getBoundingClientRect();
      var alturaDesplazable = envoltorio.offsetHeight - window.innerHeight;
      var progreso = alturaDesplazable > 0 ? acotar(-rect.top / alturaDesplazable) : 0;

      // 0%-30%: se queda en negro (el instante de "pausa" antes de revelar).
      // 30%-60%: la cortina negra se desvanece, descubriendo la banda CTA.
      // 60%-100%: ya revelada del todo, se sostiene así hasta soltar el pin.
      var revelado = acotar((progreso - .30) / .30);
      negro.style.opacity = String(1 - revelado);

      if (contenido) {
        contenido.style.opacity = String(revelado);
        contenido.style.transform = 'translateY(' + ((1 - revelado) * 30) + 'px)';
      }

      tickeandoCierre = false;
    }

    window.addEventListener('scroll', function () {
      if (!tickeandoCierre) { tickeandoCierre = true; requestAnimationFrame(actualizarCierre); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (!tickeandoCierre) { tickeandoCierre = true; requestAnimationFrame(actualizarCierre); }
    });
    actualizarCierre();
  })();


  /* ===== 15. SPLASH DE BIENVENIDA (solo index.html, 1a vez por sesión) ===
     El <div id="splashInicio"> solo existe en index.html. Si ya se vio en
     esta pestaña, el script inline del <head> ya le puso "sin-splash" a
     <html> (display:none por CSS) y aquí no hay nada que hacer.
     ======================================================================== */
  (function () {
    var splash = document.getElementById('splashInicio');
    if (!splash || document.documentElement.classList.contains('sin-splash')) return;

    sessionStorage.setItem('smilersSplashVisto', '1');

    var video = splash.querySelector('video');
    var retirado = false;

    function retirarSplash() {
      if (retirado) return;
      retirado = true;
      splash.classList.add('oculto');
      setTimeout(function () { splash.remove(); }, 550);
    }

    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      retirarSplash();
      return;
    }

    var esMovil = window.innerWidth <= 767;
    video.src = esMovil ? video.dataset.srcMovil : video.dataset.srcEscritorio;
    video.load();

    /* Clip cinematográfico de ~4s: se acelera apenas para que se sienta ágil
       sin perder el efecto de fondo (líneas doradas + resplandor). */
    video.playbackRate = 1.15;

    setTimeout(retirarSplash, 4200); // seguro si "ended" no llega

    video.addEventListener('ended', retirarSplash);
    video.addEventListener('error', retirarSplash);

    var intentoReproduccion = video.play();
    if (intentoReproduccion && typeof intentoReproduccion.catch === 'function') {
      intentoReproduccion.catch(retirarSplash);
    }

    /* Navegadores in-app que ni bloquean ni rechazan el autoplay: si sigue
       pausado al primer instante, no tiene caso hacer esperar al visitante. */
    setTimeout(function () {
      if (video.paused && !video.ended) retirarSplash();
    }, 1200);
  })();

});