document.addEventListener('DOMContentLoaded', function () {
  const NUMERO_WHATSAPP = '593997556002';

  const contadores = document.querySelectorAll('[data-contador]');
  const runIdContador = new WeakMap();

  let formato = null;
  function formatear(n) {
    if (!formato && window.Intl && Intl.NumberFormat) formato = new Intl.NumberFormat('es-MX');
    return formato ? formato.format(n) : n.toLocaleString('es-MX');
  }
  if (contadores.length) {
    window.addEventListener('load', function () {
      const calentar = function () { formatear(0); };
      if (window.requestIdleCallback) requestIdleCallback(calentar); else setTimeout(calentar, 1);
    });
  }

  function animarContador(elemento) {
    const idPropio = (runIdContador.get(elemento) || 0) + 1;
    runIdContador.set(elemento, idPropio);

    const objetivo = parseInt(elemento.dataset.contador, 10);
    const duracion = 1600;
    const inicio = performance.now();

    function paso(ahora) {
      if (runIdContador.get(elemento) !== idPropio) return;
      const progreso = Math.min(Math.max((ahora - inicio) / duracion, 0), 1);
      elemento.textContent = formatear(Math.floor(progreso * objetivo));
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

  window.SmilersContadores = { animar: animarContador };

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

  const formulario = document.getElementById('formWhatsapp');
  const aviso = document.getElementById('formAviso');

  if (formulario) {
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();

      const campoNombre = document.getElementById('nombre');
      const campoMensaje = document.getElementById('mensaje');

      const nombre = campoNombre.value.trim();
      const mensaje = campoMensaje.value.trim();

      campoNombre.classList.remove('error');
      campoMensaje.classList.remove('error');
      aviso.className = 'form-aviso';
      aviso.textContent = '';

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

      const texto =
        '¡Hola Smilers Dental Clinique! 👋\n\n' +
        'Les escribo desde su página web.\n\n' +
        'Mi nombre es: ' + nombre + '\n' +
        'Mensaje: ' + mensaje;

      const url = 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto);

      window.open(url, '_blank');

      aviso.classList.add('exito');
      aviso.textContent = '¡Listo! Abrimos WhatsApp para enviar tu mensaje.';
      formulario.reset();

      setTimeout(function () {
        aviso.className = 'form-aviso';
        aviso.textContent = '';
      }, 6000);
    });
  }

  const tactil = window.matchMedia
    ? matchMedia('(hover: none) and (pointer: coarse)').matches
    : false;
  if (tactil) {
    document.querySelectorAll('a[href*="mail.google.com/mail/"]').forEach(function (enlace) {
      let campos;
      try { campos = new URL(enlace.href).searchParams; } catch (e) { return; }
      const para = campos.get('to');
      if (!para) return;

      const cola = [];
      if (campos.get('su')) cola.push('subject=' + encodeURIComponent(campos.get('su')));
      if (campos.get('body')) cola.push('body=' + encodeURIComponent(campos.get('body')));

      enlace.href = 'mailto:' + para + (cola.length ? '?' + cola.join('&') : '');
      enlace.removeAttribute('target');
      enlace.removeAttribute('rel');
    });
  }

  const anio = document.getElementById('anioActual');
  if (anio) anio.textContent = new Date().getFullYear();
});
