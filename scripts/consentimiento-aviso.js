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
      /* Los tres botones pesan lo mismo y se ven iguales: son el boton del
         sitio, con su filo de oro y su brillo al pasar (27-consentimiento.css).
         Rechazar tiene que costar lo mismo que aceptar. */
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
              title: 'Cookies y caché',
              /* El texto es el que pidio la clinica, tal cual. Nombra tres
                 cosas: las cookies nuestras, las de Meta y Google, y la cache
                 del navegador —los archivos temporales que guarda para no
                 volver a descargarlos—. La cache no se elige aqui porque no
                 es una cookie ni identifica a nadie: se explica en el panel y
                 en la politica, que es donde se cuenta lo que hace el sitio.

                 Lo que si depende de si los pixeles estan puestos es el
                 detalle del panel (`todavia`, mas abajo): ahi es donde se
                 dice si hay algo funcionando o no. */
              description: 'Utilizamos cookies propias, de terceros (como Google y Meta) y ' +
                'tecnologías de almacenamiento en caché para mejorar tu experiencia de ' +
                'navegación, optimizar los tiempos de carga del sitio, analizar el tráfico y ' +
                'mostrarte publicidad personalizada. Puedes aceptar todas las cookies, ' +
                'rechazarlas o configurar tus preferencias en cualquier momento.',
              acceptAllBtn: 'Aceptar',
              acceptNecessaryBtn: 'Rechazar',
              showPreferencesBtn: 'Ver cuáles',
              footer: '<a href="/privacidad">Política de privacidad</a>'
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
