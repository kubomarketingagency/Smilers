document.addEventListener('DOMContentLoaded', function () {
  const navbar = document.getElementById('navbarPrincipal');

  const menu = document.getElementById('menuPrincipal');

  const pie = document.querySelector('.footer');
  let pieArriba = Infinity;
  let paginaLarga = false;
  let navOculta = false;

  function medirNavbar() {
    pieArriba = pie ? pie.getBoundingClientRect().top : Infinity;
    paginaLarga = document.documentElement.scrollHeight > window.innerHeight * 1.4;
  }

  function mostrarNavbar() {
    if (!navOculta) return;
    navOculta = false;
    navbar.classList.remove('navbar-oculta');
  }

  function controlarNavbar(ctx) {
    if (menu.classList.contains('menu-abierto')) {
      mostrarNavbar();
      return;
    }

    const y = ctx.y;

    if (y > 80) {
      navbar.classList.add('con-scroll');
    } else if (y < 40) {
      navbar.classList.remove('con-scroll');
    }

    const umbral = ctx.alto * (navOculta ? .86 : .72);
    const debeOcultarse = paginaLarga && pieArriba < umbral;

    if (debeOcultarse === navOculta) return;
    navOculta = debeOcultarse;
    navbar.classList.toggle('navbar-oculta', debeOcultarse);
  }

  SmilersScroll.registrar(medirNavbar, controlarNavbar);
  SmilersScroll.pedir();

  const botonMenu = document.querySelector('.navbar-toggler');
  const enlacesMenu = document.querySelectorAll('#menuPrincipal a');
  const veloMenu = menu.querySelector('[data-cerrar-menu]');

  function alternarMenu(forzarCerrado) {
    const abierto = menu.classList.contains('menu-abierto');
    const nuevoEstado = forzarCerrado ? false : !abierto;
    menu.classList.toggle('menu-abierto', nuevoEstado);
    botonMenu.setAttribute('aria-expanded', String(nuevoEstado));
    document.body.style.overflow = nuevoEstado ? 'hidden' : '';
    if (nuevoEstado) mostrarNavbar();
    else SmilersScroll.pedir();
  }

  if (botonMenu) {
    botonMenu.addEventListener('click', function () { alternarMenu(); });
  }

  enlacesMenu.forEach(function (enlace) {
    enlace.addEventListener('click', function () { alternarMenu(true); });
  });

  if (veloMenu) {
    veloMenu.addEventListener('click', function () { alternarMenu(true); });
  }

  document.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Escape') return;
    if (!menu.classList.contains('menu-abierto')) return;
    alternarMenu(true);
    if (botonMenu) botonMenu.focus();
  });

  const btnSubir = document.getElementById('btnSubir');
  let btnSubirVisible = null;

  SmilersScroll.registrar(null, function (ctx) {
    const debeVerse = ctx.y > 400;
    if (debeVerse === btnSubirVisible) return;
    btnSubirVisible = debeVerse;
    btnSubir.classList.toggle('visible', debeVerse);
  });

  btnSubir.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
