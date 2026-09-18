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

    function revisar() {
      if (CC.acceptedCategory(categoria)) opciones.alAceptar();
    }

    var categorias = {
      necesarias: { enabled: true, readOnly: true }
    };
    categorias[categoria] = {
      /* Si alguien acepta y luego se arrepiente, se borran las cookies que
         Meta y Google dejaron en este dominio y se recarga la pagina, que es
         la unica forma de descargar sus guiones. */
      autoClear: {
        cookies: [{ name: /^_fbp/ }, { name: /^_fbc/ }, { name: /^_gcl_/ }],
        reloadPage: true
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
              title: 'Tu privacidad, tu decisión',
              description:
                'Con tu permiso, Meta y Google usarán cookies para medir nuestros anuncios ' +
                'y mostrarte publicidad de la clínica. Si las rechazas, el sitio funciona igual, ' +
                'y puedes cambiar de opinión cuando quieras.',
              acceptAllBtn: 'Aceptar',
              acceptNecessaryBtn: 'Rechazar',
              showPreferencesBtn: 'Elegir',
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
                  title: 'Cómo usamos las cookies',
                  description:
                    'Una cookie es un pequeño archivo que el sitio guarda en tu navegador. ' +
                    'Aquí decides cuáles permites. Tu elección se guarda durante seis meses ' +
                    'y puedes cambiarla en cualquier momento desde «Preferencias de cookies», ' +
                    'al pie de cada página.'
                },
                {
                  title: 'Necesarias <span class="pm__badge">Siempre activas</span>',
                  description:
                    'Solo una: la que recuerda lo que respondiste en este aviso, para no ' +
                    'volver a preguntarte en cada página. No sirve para identificarte.',
                  linkedCategory: 'necesarias',
                  cookieTable: {
                    headers: tabla,
                    body: [
                      { name: 'cc_cookie', domain: dominio, desc: 'Guarda tu elección sobre las cookies.', dur: '6 meses' }
                    ]
                  }
                },
                {
                  title: 'Publicidad (Meta y Google Ads)',
                  description:
                    'Nos permiten saber si nuestros anuncios en Facebook, Instagram y Google ' +
                    'traen visitas y contactos, y mostrar anuncios de la clínica a quien ya nos ' +
                    'visitó. Las ponen Meta Platforms y Google, que tratan esos datos según sus ' +
                    'propias políticas. Si no las aceptas, el sitio funciona exactamente igual.',
                  linkedCategory: categoria,
                  cookieTable: {
                    headers: tabla,
                    body: [
                      { name: '_fbp', domain: dominio, desc: 'Meta: reconoce el navegador para medir los anuncios.', dur: '3 meses' },
                      { name: '_fbc', domain: dominio, desc: 'Meta: recuerda el anuncio desde el que llegaste.', dur: '3 meses' },
                      { name: '_gcl_au', domain: dominio, desc: 'Google Ads: mide las conversiones de los anuncios.', dur: '3 meses' },
                      { name: 'Cookies de Meta y Google', domain: 'facebook.com, google.com', desc: 'Las que esos servicios guardan en sus propios dominios.', dur: 'Según cada servicio' }
                    ]
                  }
                },
                {
                  title: 'Más información',
                  description:
                    'Todo lo que hacemos con tus datos está en nuestra ' +
                    '<a href="/privacidad">Política de privacidad</a>. Para cualquier duda o para ' +
                    'ejercer tus derechos, escríbenos a ' +
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
