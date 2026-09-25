window.SmilersAvisoCookies = {
  /* El aviso de cookies en si: la configuracion y los textos de CookieConsent.

     Va en un paquete aparte (paquetes/aviso-cookies.js, junto con la
     libreria) que consentimiento.js pide solo cuando hay que preguntar o
     cuando alguien abre "Preferencias de cookies". Quien ya decidio no lo
     descarga nunca.

     Los textos van en frases, no en tablas. Cada categoria llevaba una tabla
     de cuatro columnas —cookie, dominio, para que sirve, duracion— y en un
     telefono esa tabla se desarma en una lista de parejas que ocupa media
     pantalla para decir tres cosas. Lo mismo en dos frases se lee de una vez,
     y quien quiera el detalle entero lo tiene en la pagina de privacidad, a
     un clic de aqui. */
  arrancar: function (opciones) {
    var CC = window.CookieConsent;
    var categoria = opciones.categoria;
    /* Mientras no haya pixel escrito en consentimiento.js, la pregunta es la
       misma —se hace en futuro, que es como hay que hacerla— pero el detalle
       lo dice: hoy no hay ninguna de estas cookies puesta. La respuesta se
       guarda igual, y sirve el dia que las haya. */
    var todavia = opciones.hayPixeles === false
      ? ' Ahora mismo no hay ninguna funcionando: guardamos tu respuesta para ' +
        'cuando las pongamos en marcha.'
      : '';

    /* Los dos caminos, y solo uno de los dos cada vez. Quien decide si hay
       algo que encender o que apagar es consentimiento.js, que es el que
       sabe si los pixeles estan corriendo. */
    function revisar() {
      if (CC.acceptedCategory(categoria)) opciones.alAceptar();
      else if (opciones.alRechazar) opciones.alRechazar();
    }

    /* «Mas informacion»: despliega dentro del aviso el texto entero de la
       clinica y los dos caminos para saber mas (elegir cuales y la politica).
       Va por delegacion en el documento porque la libreria monta el aviso
       cuando lo ensena, no ahora. Cerrado, lo de dentro va `inert`: no se ve
       y tampoco se alcanza con el tabulador. */
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
      /* Al rechazar se borran las cookies que Meta y Google hubieran dejado
         en este dominio. La recarga —que es la unica forma de descargar sus
         guiones— no la pide aqui `reloadPage`, sino consentimiento.js, que
         tambien tiene que hacerla en el caso que esta libreria no ve: cuando
         los pixeles corrian sin que nadie hubiera aceptado nada. Un solo
         camino para recargar, y no dos. */
      autoClear: {
        cookies: [{ name: /^_fbp/ }, { name: /^_fbc/ }, { name: /^_gcl_/ }]
      }
    };

    return CC.run({
      revision: opciones.revision,
      autoShow: opciones.mostrar,
      hideFromBots: true,
      cookie: { name: 'cc_cookie', expiresAfterDays: 182 },
      /* Aceptar y rechazar pesan lo mismo y se ven iguales: dos botones de
         texto gemelos (27-consentimiento.css). Rechazar tiene que costar lo
         mismo que aceptar. */
      guiOptions: {
        consentModal: { layout: 'box inline', position: 'bottom left', equalWeightButtons: true, flipButtons: false },
        preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false }
      },
      categories: categorias,
      onConsent: revisar,
      onChange: revisar,
      language: {
        default: 'es',
        translations: {
          es: {
            consentModal: {
              /* EL AVISO EN DOS CAPAS. Sin titulo y con una sola frase: lo que
                 pasa, quien y para que. Debajo, «Mas informacion» despliega
                 el texto que pidio la clinica, tal cual, con los dos caminos
                 para saber mas —elegir cuales, que abre el panel, y la
                 politica—. Iba todo a la vez —titulo, cinco lineas y tres
                 botones grandes— y en un telefono se llevaba dos tercios de
                 la pantalla para hacer una pregunta de si o no.

                 El texto de la clinica nombra tres cosas: las cookies
                 nuestras, las de Meta y Google, y la cache del navegador —los
                 archivos temporales que guarda para no volver a
                 descargarlos—. La cache no se elige aqui porque no es una
                 cookie ni identifica a nadie: se explica en el panel y en la
                 politica. Lo que si depende de si los pixeles estan puestos
                 es el detalle del panel (`todavia`, mas abajo).

                 Sin titulo, el dialogo se nombra con `label`. «Elegir cuales»
                 abre el panel con `data-cc`, que la libreria conecta dentro
                 del aviso igual que sus propios botones. */
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
              title: 'Preferencias de cookies',
              acceptAllBtn: 'Aceptar todas',
              acceptNecessaryBtn: 'Rechazar todas',
              savePreferencesBtn: 'Guardar mi elección',
              closeIconLabel: 'Cerrar',
              sections: [
                {
                  title: 'Las cookies de este sitio',
                  description:
                    'Una cookie es un archivo diminuto que la página deja en tu navegador. ' +
                    'Aquí eliges cuáles permites. Tu respuesta dura seis meses y la puedes ' +
                    'cambiar cuando quieras con el botón de cookies, abajo a la izquierda.'
                },
                {
                  title: 'Necesarias <span class="pm__badge">Siempre activas</span>',
                  /* La chapa de "Siempre activas" que la libreria pone al lado
                     del titulo la esconde ella misma en pantallas estrechas, asi
                     que lo que no se puede apagar se dice aqui, con palabras. */
                  description:
                    'Una sola, y es nuestra: recuerda qué respondiste aquí para no ' +
                    'preguntártelo en cada página. Dura seis meses, no sirve para ' +
                    'identificarte y no se puede apagar, porque sin ella no podríamos ' +
                    'recordar tu «no».',
                  linkedCategory: 'necesarias'
                },
                {
                  title: 'Publicidad (Meta y Google Ads)',
                  description:
                    'Son tres y duran tres meses. Sirven para saber si nuestros anuncios en ' +
                    'Facebook, Instagram y Google traen visitas, y para mostrar los nuestros ' +
                    'a quien ya nos visitó. Las ponen Meta y Google, cada uno con su propia ' +
                    'política. Rechazarlas no cambia nada de lo que ves aquí.' + todavia,
                  linkedCategory: categoria
                },
                {
                  /* La cache no es una cookie y no se puede apagar desde aqui:
                     es el navegador guardandose las fotos y los estilos para
                     no bajarlos dos veces. Va sin `linkedCategory` a proposito
                     —no hay nada que elegir— pero se cuenta, porque el aviso
                     la nombra. */
                  title: 'Archivos temporales (caché)',
                  description:
                    'Además de las cookies, tu navegador guarda copias temporales de las ' +
                    'imágenes, los estilos y los guiones de la página. Sirven para una sola ' +
                    'cosa: que la próxima vez no haya que descargarlos otra vez y el sitio ' +
                    'abra más rápido. No llevan datos tuyos, no se envían a nadie y se ' +
                    'borran desde tu navegador cuando quieras.'
                },
                {
                  title: 'Más información',
                  description:
                    'Cuáles son, una por una, y qué hacemos con tus datos: está todo en la ' +
                    '<a href="/privacidad">política de privacidad</a>. Si te queda una duda, ' +
                    'escríbenos a ' +
                    '<a href="mailto:smilersdentalclinique@gmail.com">smilersdentalclinique@gmail.com</a>.'
                }
              ]
            }
          }
        }
      }
    }).then(function () { return CC; });
  }
};
