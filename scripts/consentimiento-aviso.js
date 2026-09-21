window.SmilersAvisoCookies = {
  /* El aviso de cookies en si: la configuracion y los textos de CookieConsent.

     Va en un paquete aparte (paquetes/aviso-cookies.js, junto con la
     libreria) que consentimiento.js pide solo cuando hay que preguntar o
     cuando alguien abre "Preferencias de cookies". Quien ya decidio no lo
     descarga nunca. */
  arrancar: function (opciones) {
    var CC = window.CookieConsent;
    var categoria = opciones.categoria;
    var dominio = location.hostname;

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

    var tabla = { name: 'Cookie', domain: 'Dominio', desc: 'Para qué sirve', dur: 'Duración' };

    return CC.run({
      revision: opciones.revision,
      autoShow: opciones.mostrar,
      hideFromBots: true,
      cookie: { name: 'cc_cookie', expiresAfterDays: 182 },
      /* Los dos botones de la primera pregunta pesan lo mismo: rechazar
         tiene que costar lo mismo que aceptar. */
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
              title: 'Cookies de publicidad',
              /* Lo que dice depende de si los pixeles ya estan midiendo, que
                 es lo que manda la politica de consentimiento.js. Decirlo de
                 otra forma seria mentir en la primera frase que alguien lee. */
              description: opciones.yaMiden
                ? 'Meta y Google usan cookies para medir nuestros anuncios, y mientras no ' +
                  'nos digas nada están funcionando. Si las rechazas, las apagamos y borramos ' +
                  'ahora mismo. La página se ve igual en los dos casos.'
                : 'Con tu permiso, Meta y Google usarán cookies para medir nuestros anuncios ' +
                  'y mostrarte publicidad de la clínica. Si las rechazas, el sitio funciona igual, ' +
                  'y puedes cambiar de opinión cuando quieras.',
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
                    'Aquí abajo están todas, una por una, y decides cuáles permites. Tu ' +
                    'elección dura seis meses y puedes cambiarla cuando quieras desde el botón ' +
                    'de cookies, abajo a la izquierda de cualquier página.'
                },
                {
                  title: 'Necesarias <span class="pm__badge">Siempre activas</span>',
                  description:
                    'Una sola: la que recuerda qué respondiste aquí, para no preguntarte en ' +
                    'cada página. No sirve para identificarte.',
                  linkedCategory: 'necesarias',
                  cookieTable: {
                    headers: tabla,
                    body: [
                      { name: 'cc_cookie', domain: dominio, desc: 'Recuerda tu elección sobre las cookies.', dur: '6 meses' }
                    ]
                  }
                },
                {
                  title: 'Publicidad (Meta y Google Ads)',
                  description:
                    'Sirven para saber si nuestros anuncios en Facebook, Instagram y Google ' +
                    'traen visitas, y para mostrar anuncios de la clínica a quien ya nos visitó. ' +
                    'Las ponen Meta Platforms y Google, cada uno con su propia política. ' +
                    'Rechazarlas no cambia nada de lo que ves aquí.',
                  linkedCategory: categoria,
                  cookieTable: {
                    headers: tabla,
                    body: [
                      { name: '_fbp', domain: dominio, desc: 'Meta: reconoce el navegador para medir los anuncios.', dur: '3 meses' },
                      { name: '_fbc', domain: dominio, desc: 'Meta: recuerda desde qué anuncio llegaste.', dur: '3 meses' },
                      { name: '_gcl_au', domain: dominio, desc: 'Google Ads: mide las conversiones de los anuncios.', dur: '3 meses' },
                      { name: 'Cookies de Meta y Google', domain: 'facebook.com, google.com', desc: 'Las que esos servicios guardan en sus propios dominios.', dur: 'Según cada servicio' }
                    ]
                  }
                },
                {
                  title: 'Más información',
                  description:
                    'Lo que hacemos con tus datos está contado entero en la ' +
                    '<a href="/privacidad">política de privacidad</a>. Si te queda una duda, o ' +
                    'quieres ejercer tus derechos, escríbenos a ' +
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
