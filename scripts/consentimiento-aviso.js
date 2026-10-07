window.SmilersAvisoCookies = {
  arrancar: function (opciones) {
    var CC = window.CookieConsent;
    var categoria = opciones.categoria;
    var todavia = opciones.hayPixeles === false
      ? ' Hoy no hay ninguna activa: guardamos tu respuesta para cuando las haya.'
      : '';

    function revisar() {
      if (CC.acceptedCategory(categoria)) opciones.alAceptar();
      else if (opciones.alRechazar) opciones.alRechazar();
    }

    if (!window.SmilersAvisoCookies.__mas) {
      window.SmilersAvisoCookies.__mas = true;
      document.addEventListener('click', function (evento) {
        var boton = evento.target && evento.target.closest && evento.target.closest('.cm-mas');
        if (!boton) return;
        evento.preventDefault();
        var abrir = boton.getAttribute('aria-expanded') !== 'true';
        boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
        var txt = boton.querySelector('.cm-mas__txt');
        if (txt) txt.textContent = abrir ? 'Menos información' : 'Más información';
        var detalle = document.getElementById(boton.getAttribute('aria-controls'));
        if (!detalle) return;
        detalle.classList.toggle('esta-abierto', abrir);
        var dentro = detalle.firstElementChild;
        if (dentro) {
          if (abrir) { dentro.removeAttribute('inert'); dentro.removeAttribute('aria-hidden'); }
          else { dentro.setAttribute('inert', ''); dentro.setAttribute('aria-hidden', 'true'); }
        }
      });
    }

    var categorias = {
      necesarias: { enabled: true, readOnly: true }
    };
    categorias[categoria] = {
      autoClear: {
        cookies: [{ name: /^_fbp/ }, { name: /^_fbc/ }, { name: /^_gcl_/ }]
      }
    };

    return CC.run({
      revision: opciones.revision,
      autoShow: opciones.mostrar,
      hideFromBots: true,
      cookie: { name: 'cc_cookie', expiresAfterDays: 182 },
      guiOptions: {
        consentModal: { layout: 'box inline', position: 'bottom left', equalWeightButtons: true, flipButtons: false },
        preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false }
      },
      categories: categorias,
      onConsent: revisar,
      onChange: revisar,
      onModalShow: function (evento) {
        if (!evento || evento.modalName !== 'preferencesModal') return;
        var barra = document.querySelector('.navbar-principal');
        var raiz = document.getElementById('cc-main');
        if (!barra || !raiz) return;
        var abajo = Math.max(0, Math.round(barra.getBoundingClientRect().bottom));
        raiz.style.setProperty('--cc-techo', abajo + 'px');
      },
      language: {
        default: 'es',
        translations: {
          es: {
            consentModal: {
              label: 'Aviso de cookies',
              description:
                '<span class="cm-corto">Usamos cookies —nuestras y de Google y Meta— para ' +
                'mejorar tu visita y medir nuestros anuncios.</span> ' +
                '<button type="button" class="cm-mas" aria-expanded="false" aria-controls="cmDetalle">' +
                '<span class="cm-mas__txt">Más información</span>' +
                '<svg class="cm-mas__flecha" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
                '<path d="M2.5 4.5 6 8l3.5-3.5"/></svg></button>' +
                '<span class="cm-detalle" id="cmDetalle">' +
                '<span class="cm-detalle__dentro" inert aria-hidden="true">' +
                '<span class="cm-detalle__texto">Utilizamos cookies propias, de terceros (como ' +
                'Google y Meta) y tecnologías de almacenamiento en caché para mejorar tu ' +
                'experiencia de navegación, optimizar los tiempos de carga del sitio, analizar ' +
                'el tráfico y mostrarte publicidad personalizada. Puedes aceptar todas las ' +
                'cookies, rechazarlas o configurar tus preferencias en cualquier momento.</span>' +
                '<span class="cm-detalle__enlaces">' +
                '<button type="button" class="cm-enlace" data-cc="show-preferencesModal">Elegir cuáles</button>' +
                '<a class="cm-enlace" href="/privacidad">Política de privacidad</a>' +
                '</span></span></span>',
              acceptAllBtn: 'Aceptar',
              acceptNecessaryBtn: 'Rechazar'
            },
            preferencesModal: {
              title: 'Tus cookies',
              acceptAllBtn: 'Aceptar',
              acceptNecessaryBtn: 'Rechazar',
              savePreferencesBtn: 'Guardar',
              closeIconLabel: 'Cerrar',
              sections: [
                {
                  description:
                    '<span class="pm-parrafo">Solo una cookie está siempre, y es nuestra: ' +
                    'recuerda tu respuesta seis meses, no te identifica y no se puede apagar. ' +
                    'El navegador guarda además copias de imágenes y estilos (la caché) para ' +
                    'que el sitio abra más rápido, sin ningún dato tuyo.</span>' +
                    '<span class="pm-parrafo">Las de publicidad, de Meta y Google, duran tres ' +
                    'meses y son opcionales: miden si nuestros anuncios traen visitas y los ' +
                    'muestran a quien ya nos visitó. Rechazarlas no cambia nada de lo que ves.' +
                    todavia + ' El detalle, en la <a href="/privacidad">política de ' +
                    'privacidad</a>.</span>'
                },
                {
                  title: 'Publicidad <span class="pm-quien">Meta · Google Ads</span>',
                  linkedCategory: categoria
                }
              ]
            }
          }
        }
      }
    }).then(function () { return CC; });
  }
};
