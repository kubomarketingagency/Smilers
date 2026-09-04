document.addEventListener('DOMContentLoaded', function () {
  const navbar = document.getElementById('navbarPrincipal');

  const menu = document.getElementById('menuPrincipal');

  function controlarNavbar(ctx) {
    if (menu.classList.contains('menu-abierto')) return;

    const y = ctx.y;

    if (y > 80) {
      navbar.classList.add('con-scroll');
    } else if (y < 40) {
      navbar.classList.remove('con-scroll');
    }
  }

  SmilersScroll.registrar(null, controlarNavbar);
  SmilersScroll.pedir();

  const botonMenu = document.querySelector('.navbar-toggler');
  const enlacesMenu = document.querySelectorAll('#menuPrincipal .nav-link, #menuPrincipal .btn');

  function alternarMenu(forzarCerrado) {
    const abierto = menu.classList.contains('menu-abierto');
    const nuevoEstado = forzarCerrado ? false : !abierto;
    menu.classList.toggle('menu-abierto', nuevoEstado);
    botonMenu.setAttribute('aria-expanded', String(nuevoEstado));
    document.body.style.overflow = nuevoEstado ? 'hidden' : '';
  }

  if (botonMenu) {
    botonMenu.addEventListener('click', function () { alternarMenu(); });
  }

  enlacesMenu.forEach(function (enlace) {
    enlace.addEventListener('click', function () { alternarMenu(true); });
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
