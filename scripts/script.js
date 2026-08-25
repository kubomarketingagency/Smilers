/* ==========================================================================
   SMILERS DENTAL CLINIQUE — JavaScript principal
   Contiene:
     1. Configuración global (número de WhatsApp)
     2. Navbar con efecto scroll
     3. Cierre automático del menú en móvil
     4. Botón "volver arriba"
     5. Animaciones de aparición (IntersectionObserver)
     6. Contadores animados de estadísticas
     7. Formulario del footer -> API de WhatsApp
     8. Año automático en el footer
     9. Galería: filtros por categoría
     10. Galería: lightbox
     11. Comparador antes/después
     12. Paralaje de formas decorativas
     13. FAQ: abrir pregunta enlazada por #hash
     14. Carrusel del hero: sincronizar puntos con el slide activo
   ========================================================================== */

/* ===== 1. CONFIGURACIÓN GLOBAL ==========================================
   IMPORTANTE: escribe el número en formato internacional,
   SIN "+", SIN espacios y SIN guiones.
   Ejemplo Ecuador: 593 + 9 dígitos  ->  '593997556002'
   ======================================================================== */
const NUMERO_WHATSAPP = '593997556002';


/* Ejecutamos todo cuando el DOM esté listo */
document.addEventListener('DOMContentLoaded', function () {

  /* ===== 2. NAVBAR: cambia de estilo al hacer scroll =================== */
  const navbar = document.getElementById('navbarPrincipal');

  function controlarNavbar() {
    if (window.scrollY > 60) {
      navbar.classList.add('con-scroll');
    } else {
      navbar.classList.remove('con-scroll');
    }
  }

  window.addEventListener('scroll', controlarNavbar);
  controlarNavbar(); // se ejecuta una vez por si la página carga ya desplazada


  /* ===== 3. MENÚ HAMBURGUESA (móvil/tablet) =============================
     Implementación propia con grid-template-rows (ver estilos.css) en vez
     del Collapse de Bootstrap: éste anima "height" midiendo el alto con
     JS en cada apertura/cierre, y ese recálculo de layout en cada frame
     era justo lo que causaba el tirón al cerrar el menú.
     ======================================================================== */
  const menu = document.getElementById('menuPrincipal');
  const botonMenu = document.querySelector('.navbar-toggler');
  const enlacesMenu = document.querySelectorAll('#menuPrincipal .nav-link, #menuPrincipal .btn');

  function alternarMenu(forzarCerrado) {
    const abierto = menu.classList.contains('menu-abierto');
    const nuevoEstado = forzarCerrado ? false : !abierto;
    menu.classList.toggle('menu-abierto', nuevoEstado);
    botonMenu.setAttribute('aria-expanded', String(nuevoEstado));
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


  /* ===== 5. ANIMACIÓN DE APARICIÓN AL HACER SCROLL ==================== */
  const elementosRevelar = document.querySelectorAll('.revelar');

  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (entrada, indice) {
        if (entrada.isIntersecting) {
          // Pequeño retardo escalonado para un efecto más elegante
          setTimeout(function () {
            entrada.target.classList.add('visible');
          }, indice * 100);
          obs.unobserve(entrada.target); // se anima una sola vez
        }
      });
    }, { threshold: 0.15 });

    elementosRevelar.forEach(function (el) { observador.observe(el); });
  } else {
    // Fallback para navegadores antiguos: se muestra todo directamente
    elementosRevelar.forEach(function (el) { el.classList.add('visible'); });
  }


  /* ===== 6. CONTADORES ANIMADOS DE ESTADÍSTICAS ======================= */
  const contadores = document.querySelectorAll('[data-contador]');

  function animarContador(elemento) {
    const objetivo = parseInt(elemento.dataset.contador, 10);
    const duracion = 1600;              // milisegundos
    const inicio = performance.now();

    function paso(ahora) {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      elemento.textContent = Math.floor(progreso * objetivo).toLocaleString('es-MX');
      if (progreso < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  if ('IntersectionObserver' in window) {
    const obsContadores = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          animarContador(entrada.target);
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.5 });

    contadores.forEach(function (c) { obsContadores.observe(c); });
  }


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


  /* ===== 13. FAQ: abre automáticamente la pregunta enlazada por #hash === */
  if (window.location.hash) {
    const objetivo = document.querySelector(window.location.hash);
    if (objetivo && objetivo.classList.contains('accordion-collapse')) {
      const colapsable = new bootstrap.Collapse(objetivo, { toggle: true });
      objetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }


  /* ===== 14. CARRUSEL DEL HERO: sincronizar puntos con el slide activo ===
     Bootstrap mueve el carrusel solo, pero no toca la clase "activo" de
     nuestros puntos personalizados: sin esto, el punto resaltado se queda
     en el slide 1 aunque el carrusel avance solo o se haga clic en otro,
     dando la sensación de que los puntos "no responden".
     ======================================================================== */
  const heroCarrusel = document.getElementById('heroCarrusel');
  const puntosHero = document.querySelectorAll('.hero-indicadores button');

  if (heroCarrusel && puntosHero.length) {
    heroCarrusel.addEventListener('slide.bs.carousel', function (evento) {
      puntosHero.forEach(function (punto, indice) {
        punto.classList.toggle('activo', indice === evento.to);
      });
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

});