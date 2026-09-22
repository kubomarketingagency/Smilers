var SmilersScroll=(function(){
var entradas=[];
var reinicios=[];
var pedido=false;
var ctx={y:0,alto:0,ancho:0};
var sonda=null;
var altoGrande=0;
function medirAlto(){
if(!sonda){
sonda=document.createElement('div');
sonda.setAttribute('aria-hidden','true');
sonda.style.cssText='position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
document.body.appendChild(sonda);
}
altoGrande=sonda.offsetHeight||window.innerHeight||1;
}
function alto(){
if(!altoGrande)medirAlto();
return altoGrande;
}
function medir(){
ctx.y=window.scrollY;
ctx.alto=alto();
ctx.ancho=window.innerWidth||1;
}
function correr(){
pedido=false;
medir();
var i,e;
for(i=0;i < entradas.length;i++){
e=entradas[i];
if(e.activo&&e.leer)e.leer(ctx);
}
for(i=0;i < entradas.length;i++){
e=entradas[i];
if(e.activo&&e.escribir)e.escribir(ctx);
}
}
function pedir(){
if(pedido)return;
pedido=true;
requestAnimationFrame(correr);
}
var deslizamiento=null;
var inmuneHasta=0;
function abortar(){
if(Date.now()< inmuneHasta)return;
document.documentElement.classList.remove('smilers-deslizando');
if(deslizamiento)deslizamiento.vivo=false;
deslizamiento=null;
}
function deslizarA(destino,duracion,salida){
abortar();
inmuneHasta=Date.now()+ 90;
var inicio=window.scrollY;
var salto=destino - inicio;
if(Math.abs(salto)< 2)return;
document.documentElement.classList.add('smilers-deslizando');
var d=duracion||620;
var t0=0;
var mio={vivo:true};
deslizamiento=mio;
function paso(ahora){
if(!mio.vivo)return;
if(!t0)t0=ahora;
var t=Math.min(1,(ahora - t0)/ d);
var e=salida
?1 - Math.pow(1 - t,3)
:(t < .5?4*t*t*t:1 - Math.pow(-2*t + 2,3)/ 2);
window.scrollTo(0,Math.round(inicio + salto*e));
if(t < 1)requestAnimationFrame(paso);
else if(deslizamiento===mio){
deslizamiento=null;
document.documentElement.classList.remove('smilers-deslizando');
}
}
requestAnimationFrame(paso);
}
var quietos=[];
var idle=null;
function alDetenerse(){
idle=null;
if(deslizamiento)return;
for(var i=0;i < quietos.length;i++)quietos[i]();
}
function alScroll(){
pedir();
if(idle)clearTimeout(idle);
idle=setTimeout(alDetenerse,220);
}
window.addEventListener('scroll',alScroll,{passive:true});
window.addEventListener('resize',function(){
var altoAntes=altoGrande,anchoAntes=ctx.ancho;
medirAlto();
if(altoGrande===altoAntes&&(window.innerWidth||1)===anchoAntes){pedir();return;}
for(var i=0;i < reinicios.length;i++)reinicios[i]();
pedir();
});
['wheel','touchstart','pointerdown','keydown'].forEach(function(evt){
window.addEventListener(evt,abortar,{passive:true});
});
return{
registrar:function(leer,escribir,alRedimensionar,opciones){
var e={leer:leer||null,escribir:escribir||null,activo:true};
entradas.push(e);
if(alRedimensionar)reinicios.push(alRedimensionar);
var guarda=opciones&&opciones.guarda;
if(!guarda||typeof IntersectionObserver !=='function')return;
e.activo=false;
new IntersectionObserver(function(registros){
var dentro=registros[registros.length - 1].isIntersecting;
if(dentro===e.activo)return;
e.activo=true;
medir();
if(e.leer)e.leer(ctx);
if(e.escribir)e.escribir(ctx);
e.activo=dentro;
if(opciones.alCambiarVisibilidad)opciones.alCambiarVisibilidad(dentro);
},{rootMargin:'100% 0px'}).observe(guarda);
},
alDetenerse:function(fn){quietos.push(fn);},
alto:alto,
deslizarA:deslizarA,
abortarDeslizamiento:abortar,
pedir:pedir
};
})();
window.SmilersScroll=SmilersScroll;;
document.addEventListener('DOMContentLoaded',function(){
const navbar=document.getElementById('navbarPrincipal');
const menu=document.getElementById('menuPrincipal');
const pie=document.querySelector('.footer');
let pieArriba=Infinity;
let paginaLarga=false;
let navOculta=false;
function medirNavbar(){
pieArriba=pie?pie.getBoundingClientRect().top:Infinity;
paginaLarga=document.documentElement.scrollHeight > window.innerHeight*1.4;
}
function mostrarNavbar(){
if(!navOculta)return;
navOculta=false;
navbar.classList.remove('navbar-oculta');
}
function controlarNavbar(ctx){
if(menu.classList.contains('menu-abierto')){
mostrarNavbar();
return;
}
const y=ctx.y;
if(y > 80){
navbar.classList.add('con-scroll');
}else if(y < 40){
navbar.classList.remove('con-scroll');
}
const umbral=ctx.alto*(navOculta?.86:.72);
const debeOcultarse=paginaLarga&&pieArriba < umbral;
if(debeOcultarse===navOculta)return;
navOculta=debeOcultarse;
navbar.classList.toggle('navbar-oculta',debeOcultarse);
}
SmilersScroll.registrar(medirNavbar,controlarNavbar);
SmilersScroll.pedir();
const botonMenu=document.querySelector('.navbar-toggler');
const enlacesMenu=document.querySelectorAll('#menuPrincipal a');
const veloMenu=menu.querySelector('[data-cerrar-menu]');
function alternarMenu(forzarCerrado){
const abierto=menu.classList.contains('menu-abierto');
const nuevoEstado=forzarCerrado?false:!abierto;
menu.classList.toggle('menu-abierto',nuevoEstado);
botonMenu.setAttribute('aria-expanded',String(nuevoEstado));
document.body.style.overflow=nuevoEstado?'hidden':'';
if(nuevoEstado)mostrarNavbar();
else SmilersScroll.pedir();
}
if(botonMenu){
botonMenu.addEventListener('click',function(){alternarMenu();});
}
enlacesMenu.forEach(function(enlace){
enlace.addEventListener('click',function(){alternarMenu(true);});
});
if(veloMenu){
veloMenu.addEventListener('click',function(){alternarMenu(true);});
}
document.addEventListener('keydown',function(evento){
if(evento.key !=='Escape')return;
if(!menu.classList.contains('menu-abierto'))return;
alternarMenu(true);
if(botonMenu)botonMenu.focus();
});
const btnSubir=document.getElementById('btnSubir');
let btnSubirVisible=null;
SmilersScroll.registrar(null,function(ctx){
const debeVerse=ctx.y > 400;
if(debeVerse===btnSubirVisible)return;
btnSubirVisible=debeVerse;
btnSubir.classList.toggle('visible',debeVerse);
});
btnSubir.addEventListener('click',function(){
window.scrollTo({top:0,behavior:'smooth'});
});
});;
document.addEventListener('DOMContentLoaded',function(){
const NUMERO_WHATSAPP='593997556002';
const contadores=document.querySelectorAll('[data-contador]');
const runIdContador=new WeakMap();
let formato=null;
function formatear(n){
if(!formato&&window.Intl&&Intl.NumberFormat)formato=new Intl.NumberFormat('es-MX');
return formato?formato.format(n):n.toLocaleString('es-MX');
}
if(contadores.length){
window.addEventListener('load',function(){
const calentar=function(){formatear(0);};
if(window.requestIdleCallback)requestIdleCallback(calentar);else setTimeout(calentar,1);
});
}
function animarContador(elemento){
const idPropio=(runIdContador.get(elemento)||0)+ 1;
runIdContador.set(elemento,idPropio);
const objetivo=parseInt(elemento.dataset.contador,10);
const duracion=1600;
const inicio=performance.now();
function paso(ahora){
if(runIdContador.get(elemento)!==idPropio)return;
const progreso=Math.min(Math.max((ahora - inicio)/ duracion,0),1);
elemento.textContent=formatear(Math.floor(progreso*objetivo));
if(progreso < 1)requestAnimationFrame(paso);
}
requestAnimationFrame(paso);
}
if('IntersectionObserver' in window){
const obsContadores=new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
if(entrada.isIntersecting){
animarContador(entrada.target);
}else{
runIdContador.set(entrada.target,(runIdContador.get(entrada.target)||0)+ 1);
entrada.target.textContent='0';
}
});
},{threshold:0.5});
contadores.forEach(function(c){obsContadores.observe(c);});
}
window.SmilersContadores={animar:animarContador};
const mapaTabs=document.querySelectorAll('.mapa-tab');
const mapaIframes=document.querySelectorAll('.mapa-iframe');
mapaTabs.forEach(function(tab){
tab.addEventListener('click',function(){
const sede=tab.dataset.mapa;
mapaTabs.forEach(function(t){
t.classList.toggle('activo',t===tab);
t.setAttribute('aria-selected',String(t===tab));
});
mapaIframes.forEach(function(frame){
frame.classList.toggle('activo',frame.dataset.mapa===sede);
});
});
});
const formulario=document.getElementById('formWhatsapp');
const aviso=document.getElementById('formAviso');
if(formulario){
formulario.addEventListener('submit',function(evento){
evento.preventDefault();
const campoNombre=document.getElementById('nombre');
const campoMensaje=document.getElementById('mensaje');
const nombre=campoNombre.value.trim();
const mensaje=campoMensaje.value.trim();
campoNombre.classList.remove('error');
campoMensaje.classList.remove('error');
aviso.className='form-aviso';
aviso.textContent='';
let hayErrores=false;
if(nombre.length < 2){
campoNombre.classList.add('error');
hayErrores=true;
}
if(mensaje.length < 5){
campoMensaje.classList.add('error');
hayErrores=true;
}
if(hayErrores){
aviso.classList.add('error');
aviso.textContent='Por favor completa tu nombre y un mensaje válido.';
return;
}
const texto=
'¡Hola Smilers Dental Clinique! 👋\n\n' +
'Les escribo desde su página web.\n\n' +
'Mi nombre es: ' + nombre + '\n' +
'Mensaje: ' + mensaje;
const url='https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto);
window.open(url,'_blank');
aviso.classList.add('exito');
aviso.textContent='¡Listo! Abrimos WhatsApp para enviar tu mensaje.';
formulario.reset();
setTimeout(function(){
aviso.className='form-aviso';
aviso.textContent='';
},6000);
});
}
const tactil=window.matchMedia
?matchMedia('(hover: none) and (pointer: coarse)').matches
:false;
if(tactil){
document.querySelectorAll('a[href*="mail.google.com/mail/"]').forEach(function(enlace){
let campos;
try{campos=new URL(enlace.href).searchParams;}catch(e){return;}
const para=campos.get('to');
if(!para)return;
const cola=[];
if(campos.get('su'))cola.push('subject=' + encodeURIComponent(campos.get('su')));
if(campos.get('body'))cola.push('body=' + encodeURIComponent(campos.get('body')));
enlace.href='mailto:' + para +(cola.length?'?' + cola.join('&'):'');
enlace.removeAttribute('target');
enlace.removeAttribute('rel');
});
}
const anio=document.getElementById('anioActual');
if(anio)anio.textContent=new Date().getFullYear();
});;
document.addEventListener('DOMContentLoaded',function(){
const formasParallax=document.querySelectorAll('.forma-parallax');
if(formasParallax.length&&window.matchMedia('(prefers-reduced-motion: no-preference)').matches
&&window.matchMedia('(pointer: fine)').matches){
let ultimoFrame=null;
document.addEventListener('mousemove',function(evento){
if(ultimoFrame)return;
ultimoFrame=requestAnimationFrame(function(){
const xRelativo=(evento.clientX / window.innerWidth)- 0.5;
const yRelativo=(evento.clientY / window.innerHeight)- 0.5;
formasParallax.forEach(function(forma){
const intensidad=Number(forma.dataset.intensidad||18);
forma.style.transform='translate(' +(xRelativo*intensidad)+ 'px, ' +(yRelativo*intensidad)+ 'px)';
});
ultimoFrame=null;
});
});
}
document.querySelectorAll('.acordeon-galeria').forEach(function(galeria){
var paneles=Array.prototype.slice.call(galeria.querySelectorAll('.ag-panel'));
if(!paneles.length)return;
var tieneHoverFino=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
var ficha=document.querySelector('[data-ficha-equipo]');
function pintarFicha(panel){
if(!ficha||!panel.dataset.espTexto)return;
var titulo=panel.querySelector('.ag-panel__titulo');
var desc=panel.querySelector('.ag-panel__desc');
ficha.querySelector('[data-ficha-nombre]').textContent=titulo?titulo.textContent:'';
ficha.querySelector('[data-ficha-esp]').textContent=desc?desc.textContent:'';
ficha.querySelector('[data-ficha-texto]').textContent=panel.dataset.espTexto;
var lista=ficha.querySelector('[data-ficha-lista]');
lista.textContent='';
(panel.dataset.espPuntos||'').split('|').forEach(function(punto){
var limpio=punto.trim();
if(!limpio)return;
var li=document.createElement('li');
li.textContent=limpio;
lista.appendChild(li);
});
if(ficha.classList.contains('ns-ficha--entra')){
ficha.classList.remove('ns-ficha--entra');
void ficha.offsetWidth;
}
ficha.classList.add('ns-ficha--entra');
}
function activar(panel){
paneles.forEach(function(p){
var activo=p===panel;
p.classList.toggle('ag-panel--activo',activo);
if(activo)p.setAttribute('aria-current','true');
else p.removeAttribute('aria-current');
});
pintarFicha(panel);
}
function apilado(){
return getComputedStyle(galeria).flexDirection==='column';
}
function sostener(panel){
var barra=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-navbar'))||62;
var proporcion=parseFloat(getComputedStyle(panel).getPropertyValue('--alto-foto'))||4 / 3;
var alto=Math.min(panel.getBoundingClientRect().width*proporcion,window.innerHeight*0.86);
var desde=panel.getBoundingClientRect().top;
var techo=barra + 10;
var suelo=Math.max(techo,window.innerHeight - alto - 12);
var hasta=Math.min(Math.max(desde,techo),suelo);
var inicio=performance.now();
var DURACION=560;
var suelto=false;
function soltar(){suelto=true;}
window.addEventListener('touchstart',soltar,{passive:true});
window.addEventListener('wheel',soltar,{passive:true});
function paso(ahora){
if(!suelto){
var x=Math.min(1,(ahora - inicio)/ DURACION);
var objetivo=desde +(hasta - desde)*(1 - Math.pow(1 - x,4));
var desvio=panel.getBoundingClientRect().top - objetivo;
if(Math.abs(desvio)>=1){
window.scrollTo({top:window.scrollY + desvio,behavior:'instant'});
}
if(x < 1){requestAnimationFrame(paso);return;}
}
window.removeEventListener('touchstart',soltar);
window.removeEventListener('wheel',soltar);
}
requestAnimationFrame(paso);
}
var inicial=galeria.querySelector('.ag-panel--activo')||paneles[0];
if(inicial)pintarFicha(inicial);
paneles.forEach(function(panel,indice){
if(tieneHoverFino){
panel.addEventListener('mouseenter',function(){activar(panel);});
panel.addEventListener('focus',function(){activar(panel);});
}
panel.addEventListener('click',function(evento){
if(!tieneHoverFino&&!panel.classList.contains('ag-panel--activo')){
evento.preventDefault();
if(apilado())sostener(panel);
activar(panel);
}
});
panel.addEventListener('keydown',function(evento){
var siguiente=null;
if(evento.key==='ArrowRight'||evento.key==='ArrowDown'){
siguiente=paneles[(indice + 1)%paneles.length];
}else if(evento.key==='ArrowLeft'||evento.key==='ArrowUp'){
siguiente=paneles[(indice - 1 + paneles.length)%paneles.length];
}
if(siguiente){
evento.preventDefault();
activar(siguiente);
siguiente.focus();
}
});
});
});
(function(){
var heroCarrusel=document.getElementById('heroCarrusel');
if(!heroCarrusel||!window.bootstrap||!('IntersectionObserver' in window))return;
var instancia=bootstrap.Carousel.getOrCreateInstance(heroCarrusel);
new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
if(entrada.isIntersecting)instancia.cycle();
else instancia.pause();
});
},{rootMargin:'100px 0px'}).observe(heroCarrusel);
})();
(function(){
var cinta=document.getElementById('bandaCtaMasonryCinta');
if(!cinta)return;
var fotos=(cinta.dataset.fotos||'')
.split(',')
.map(function(u){return u.trim();})
.filter(Boolean);
if(!fotos.length)return;
var grupos=[];
for(var g=0;g < fotos.length;g +=3)grupos.push(fotos.slice(g,g + 3));
function crearColumna(grupo){
var col=document.createElement('div');
col.className='banda-cta-masonry__col';
grupo.forEach(function(src){
var img=document.createElement('img');
img.src=src;
img.alt='';
img.loading='lazy';
img.decoding='async';
col.appendChild(img);
});
return col;
}
function armar(){
var anchoColumna=window.matchMedia('(min-width: 992px)').matches?226:196;
var anchoNecesario=window.innerWidth*1.6;
var set=[];
var anchoSet=0;
var indice=0;
while(anchoSet < anchoNecesario){
set.push(grupos[indice%grupos.length]);
anchoSet +=anchoColumna;
indice++;
}
set.concat(set).forEach(function(grupo){
cinta.appendChild(crearColumna(grupo));
});
}
if('IntersectionObserver' in window){
cinta.style.animationPlayState='paused';
var caja=cinta.parentNode||cinta;
var armada=false;
var vigia=new IntersectionObserver(function(entradas){
if(armada||!entradas[entradas.length - 1].isIntersecting)return;
armada=true;
vigia.disconnect();
armar();
},{rootMargin:'300% 0px'});
vigia.observe(caja);
new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
cinta.style.animationPlayState=entrada.isIntersecting?'running':'paused';
});
},{rootMargin:'200px 0px'}).observe(caja);
}else{
armar();
}
})();
if(window.location.hash){
const objetivo=document.querySelector(window.location.hash);
if(objetivo&&objetivo.classList.contains('accordion-collapse')){
const colapsable=new bootstrap.Collapse(objetivo,{toggle:true});
objetivo.scrollIntoView({behavior:'smooth',block:'center'});
}
}
});;
document.addEventListener('DOMContentLoaded',function(){
var quietud=window.matchMedia('(prefers-reduced-motion: reduce)');
function encender(nodo){
if(!nodo)return;
var piezas=nodo.querySelectorAll('img[data-src], img[data-srcset], source[data-srcset]');
for(var i=0;i < piezas.length;i++){
var p=piezas[i];
if(p.dataset.srcset){p.setAttribute('srcset',p.dataset.srcset);delete p.dataset.srcset;}
if(p.dataset.src){p.setAttribute('src',p.dataset.src);delete p.dataset.src;}
}
}
function enReposo(fn){
var luego=function(){
if(window.requestIdleCallback)window.requestIdleCallback(fn,{timeout:4000});
else setTimeout(fn,1500);
};
if(document.readyState==='complete')luego();
else window.addEventListener('load',luego,{once:true});
}
function montarCarrusel(caja){
var tomas=Array.prototype.slice.call(caja.querySelectorAll('.crsl__toma'));
if(tomas.length < 2)return;
var mandos=caja.querySelector('.crsl__mandos');
var puntera=caja.querySelector('.crsl__puntos');
var intervalo=Number(caja.dataset.intervalo||5200);
var actual=tomas.findIndex(function(t){return t.classList.contains('crsl__toma--activa');});
if(actual < 0)actual=0;
caja.style.setProperty('--crsl-intervalo',intervalo + 'ms');
var puntos=[];
if(puntera){
tomas.forEach(function(toma,indice){
var punto=document.createElement('button');
punto.type='button';
punto.className='crsl__punto';
punto.setAttribute('aria-label','Imagen ' +(indice + 1)+ ' de ' + tomas.length);
punto.addEventListener('click',function(){ir(indice,true);});
puntera.appendChild(punto);
puntos.push(punto);
});
}
var reloj=null;
var pedidasTodas=false;
var dormido=false;
var visible=true;
var previaToma=null;
function pintar(){
encender(tomas[actual]);
var saliente=previaToma;
tomas.forEach(function(toma,indice){
var activa=indice===actual;
toma.classList.toggle('crsl__toma--saliente',!activa&&toma===saliente);
toma.classList.toggle('crsl__toma--activa',activa);
toma.setAttribute('aria-hidden',activa?'false':'true');
});
previaToma=tomas[actual];
puntos.forEach(function(punto,indice){
var activo=indice===actual;
if(activo){
if(punto.classList.contains('crsl__punto--activo')){
punto.classList.remove('crsl__punto--activo');
void punto.offsetWidth;
}
punto.classList.add('crsl__punto--activo');
}else{
punto.classList.remove('crsl__punto--activo');
}
punto.setAttribute('aria-current',activo?'true':'false');
});
}
function ir(indice,manual){
actual=(indice + tomas.length)%tomas.length;
pintar();
encender(tomas[(actual + 1)%tomas.length]);
if(manual)arrancar();
}
function lista(toma){
var foto=toma.querySelector('img');
return !foto||(foto.complete&&foto.naturalWidth > 0);
}
function arrancar(){
parar();
if(dormido||!visible||quietud.matches)return;
encender(tomas[(actual + 1)%tomas.length]);
if(!pedidasTodas){
pedidasTodas=true;
enReposo(function(){tomas.forEach(encender);});
}
reloj=setInterval(function(){
var siguiente=tomas[(actual + 1)%tomas.length];
encender(siguiente);
if(lista(siguiente))ir(actual + 1);
},intervalo);
}
function parar(){
if(reloj){clearInterval(reloj);reloj=null;}
}
if(mandos){
var previa=mandos.querySelector('.crsl__flecha--previa');
var siguiente=mandos.querySelector('.crsl__flecha--siguiente');
if(previa)previa.addEventListener('click',function(){ir(actual - 1,true);});
if(siguiente)siguiente.addEventListener('click',function(){ir(actual + 1,true);});
}
caja.addEventListener('mouseenter',parar);
caja.addEventListener('mouseleave',arrancar);
caja.addEventListener('focusin',parar);
caja.addEventListener('focusout',arrancar);
pintar();
if('IntersectionObserver' in window){
visible=false;
new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
visible=entrada.isIntersecting;
if(visible)arrancar();
else parar();
});
},{rootMargin:'80px 0px'}).observe(caja);
}else{
arrancar();
}
quietud.addEventListener('change',function(){
if(quietud.matches)parar();
else arrancar();
});
return{
caja:caja,
dormir:function(){
if(dormido)return;
dormido=true;
parar();
},
despertar:function(){
if(!dormido)return;
dormido=false;
arrancar();
}
};
}
window.SmilersCarruseles=[];
document.querySelectorAll('[data-carrusel]').forEach(function(caja){
var mando=montarCarrusel(caja);
if(mando)window.SmilersCarruseles.push(mando);
});
(function(){
var pantallas=Array.prototype.slice.call(
document.querySelectorAll('.ns-pantalla, [data-pantalla]'));
if(!pantallas.length||!('IntersectionObserver' in window)){
pantallas.forEach(function(p){p.classList.add('en-pantalla');});
return;
}
var conNombre=pantallas.filter(function(p){return p.dataset.pantalla;});
var botones=[];
if(conNombre.length > 1){
var nav=document.createElement('nav');
nav.className='ns-riel-nav';
nav.setAttribute('aria-label','Secciones de la página');
var lista=document.createElement('ul');
lista.className='ns-riel';
conNombre.forEach(function(seccion){
var fila=document.createElement('li');
var boton=document.createElement('button');
boton.type='button';
boton.className='ns-riel__boton';
boton.dataset.nombre=seccion.dataset.pantalla;
boton.setAttribute('aria-label','Ir a ' + seccion.dataset.pantalla);
boton.addEventListener('click',function(){
var destino=seccion.getBoundingClientRect().top + window.scrollY - 90;
if(window.SmilersScroll&&!quietud.matches){
SmilersScroll.deslizarA(Math.max(0,destino),760);
}else{
window.scrollTo(0,Math.max(0,destino));
}
});
fila.appendChild(boton);
lista.appendChild(fila);
botones.push(boton);
});
nav.appendChild(lista);
document.body.appendChild(nav);
}
var visibles=new Map();
function marcarRiel(){
var mejor=null;
var mejorRazon=0;
conNombre.forEach(function(seccion){
var razon=visibles.get(seccion)||0;
if(razon > mejorRazon){mejorRazon=razon;mejor=seccion;}
});
botones.forEach(function(boton,indice){
boton.classList.toggle('ns-riel__boton--activo',conNombre[indice]===mejor);
});
}
var observador=new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
visibles.set(entrada.target,entrada.intersectionRatio);
if(entrada.intersectionRatio >=0.22)entrada.target.classList.add('en-pantalla');
});
marcarRiel();
},{threshold:[0,0.22,0.5,0.75,1]});
pantallas.forEach(function(p){observador.observe(p);});
})();
});;
document.addEventListener('DOMContentLoaded',function(){
var quietud=window.matchMedia('(prefers-reduced-motion: reduce)');
function encender(nodo){
if(!nodo)return;
var piezas=nodo.querySelectorAll('img[data-src], img[data-srcset], source[data-srcset]');
for(var i=0;i < piezas.length;i++){
var p=piezas[i];
if(p.dataset.srcset){p.setAttribute('srcset',p.dataset.srcset);delete p.dataset.srcset;}
if(p.dataset.src){p.setAttribute('src',p.dataset.src);delete p.dataset.src;}
}
}
function enReposo(fn){
var luego=function(){
if(window.requestIdleCallback)window.requestIdleCallback(fn,{timeout:4000});
else setTimeout(fn,1500);
};
if(document.readyState==='complete')luego();
else window.addEventListener('load',luego,{once:true});
}
var elenco=(function(){
var caja=document.querySelector('[data-elenco]');
if(!caja)return null;
var retratos=Array.prototype.slice.call(caja.querySelectorAll('.ns-elenco__retrato'));
if(retratos.length < 2)return null;
var ficha=caja.querySelector('[data-elenco-ficha]');
var puntera=caja.querySelector('[data-elenco-puntos]');
var INTERVALO=3000;
var actual=0;
var reloj=null;
var dormido=false;
var pedidosTodos=false;
var puntos=retratos.map(function(retrato,indice){
var boton=document.createElement('button');
boton.type='button';
boton.className='ns-elenco__punto';
boton.setAttribute('aria-label',retrato.dataset.espArea||'Especialista');
boton.addEventListener('click',function(){ir(indice,true);});
if(puntera)puntera.appendChild(boton);
return boton;
});
function pintarFicha(retrato){
if(!ficha)return;
ficha.querySelector('[data-ficha-esp]').textContent=retrato.dataset.espArea||'';
ficha.querySelector('[data-ficha-texto]').textContent=retrato.dataset.espTexto||'';
var lista=ficha.querySelector('[data-ficha-lista]');
lista.textContent='';
(retrato.dataset.espPuntos||'').split('|').forEach(function(punto){
var limpio=punto.trim();
if(!limpio)return;
var li=document.createElement('li');
li.textContent=limpio;
lista.appendChild(li);
});
if(ficha.classList.contains('ns-ficha--entra')){
ficha.classList.remove('ns-ficha--entra');
void ficha.offsetWidth;
}
ficha.classList.add('ns-ficha--entra');
}
function pintar(){
encender(retratos[actual]);
retratos.forEach(function(retrato,indice){
var activo=indice===actual;
retrato.classList.toggle('ns-elenco__retrato--activo',activo);
retrato.setAttribute('aria-hidden',activo?'false':'true');
});
puntos.forEach(function(punto,indice){
var activo=indice===actual;
punto.classList.toggle('ns-elenco__punto--activo',activo);
punto.setAttribute('aria-current',activo?'true':'false');
});
pintarFicha(retratos[actual]);
}
function ir(indice,manual){
actual=(indice + retratos.length)%retratos.length;
pintar();
encender(retratos[(actual + 1)%retratos.length]);
if(manual)arrancar();
}
function arrancar(){
parar();
if(dormido||quietud.matches)return;
encender(retratos[(actual + 1)%retratos.length]);
if(!pedidosTodos){
pedidosTodos=true;
enReposo(function(){retratos.forEach(encender);});
}
reloj=setInterval(function(){ir(actual + 1);},INTERVALO);
}
function parar(){
if(reloj){clearInterval(reloj);reloj=null;}
}
var previa=caja.querySelector('[data-elenco-previa]');
var siguiente=caja.querySelector('[data-elenco-siguiente]');
if(previa)previa.addEventListener('click',function(){ir(actual - 1,true);});
if(siguiente)siguiente.addEventListener('click',function(){ir(actual + 1,true);});
caja.addEventListener('mouseenter',parar);
caja.addEventListener('mouseleave',arrancar);
caja.addEventListener('focusin',parar);
caja.addEventListener('focusout',arrancar);
quietud.addEventListener('change',function(){
if(quietud.matches)parar();else arrancar();
});
pintar();
return{
caja:caja,
dormir:function(){
if(dormido)return;
dormido=true;
parar();
},
despertar:function(desdeElPrincipio){
if(!dormido&&!desdeElPrincipio)return;
dormido=false;
if(desdeElPrincipio&&actual !==0){actual=0;pintar();}
arrancar();
}
};
})();
(function(){
var escena=document.getElementById('nsCine');
var cierre=document.getElementById('nsCierre');
var carta=document.getElementById('nsCarta');
if(!escena||typeof SmilersScroll==='undefined'){
if(elenco)elenco.despertar(false);
return;
}
function cabe(){
return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
}
function cintaDe(selector){
var caja=document.querySelector(selector + ' [data-carrusel]');
var lista=window.SmilersCarruseles||[];
for(var i=0;i < lista.length;i++){
if(lista[i].caja===caja)return lista[i];
}
return null;
}
var cintaHistoria=cintaDe('.ns-capa--historia');
var cintaInfra=cintaDe('.ns-capa--infra');
function cintas(cualCorre){
if(cintaHistoria){
if(cualCorre==='historia'||cualCorre==='todas')cintaHistoria.despertar();
else cintaHistoria.dormir();
}
if(cintaInfra){
if(cualCorre==='infra'||cualCorre==='todas')cintaInfra.despertar();
else cintaInfra.dormir();
}
}
function pieza(bloque,selector){return bloque?bloque.querySelector(selector):null;}
var capaFund=pieza(escena,'.ns-capa--fundamentos');
var capaInfra=pieza(escena,'.ns-capa--infra');
var DESTINOS_CINE={
'--c-uno':pieza(escena,'.ns-capa--historia'),
'--c-ev-uno':pieza(escena,'.ns-capa--historia'),
'--c-dos':pieza(escena,'.ns-capa--elenco'),
'--c-ev-dos':pieza(escena,'.ns-capa--elenco'),
'--f-der':capaFund,
'--f-op':pieza(capaFund,':scope > .ns-envoltura'),
'--f-desenfoque':pieza(capaFund,':scope > .ns-envoltura'),
'--f-ent':pieza(capaFund,':scope > .ns-envoltura'),
'--f-filo':pieza(escena,'.ns-filo--vertical'),
'--f-filo-op':pieza(escena,'.ns-filo--vertical'),
'--i-sube':capaInfra,
'--i-op':pieza(capaInfra,':scope > .ns-envoltura'),
'--i-desenfoque':pieza(capaInfra,':scope > .ns-envoltura'),
'--i-y':pieza(capaInfra,':scope > .ns-envoltura'),
'--i-filo':pieza(escena,'.ns-filo--horizontal'),
'--i-filo-op':pieza(escena,'.ns-filo--horizontal'),
'--h-abre':pieza(escena,'.ns-hojas'),
'--h-filo':pieza(escena,'.ns-hojas')
};
var DESTINOS_CIERRE={
'--h-abre':pieza(cierre,'.ns-hojas'),
'--h-filo':pieza(cierre,'.ns-hojas')
};
var DESTINOS_CARTA={
'--h-abre':pieza(carta,'.ns-hojas'),
'--h-filo':pieza(carta,'.ns-hojas'),
'--k-retrato':pieza(carta,'.ns-carta__retrato'),
'--k-frase':pieza(carta,'.ns-carta__frase'),
'--k-papel':pieza(carta,'.ns-carta__hoja'),
'--k-texto':pieza(carta,'.cb-tinta'),
'--k-filo':pieza(carta,'.ns-carta__escuadras'),
'--k-firma':pieza(carta,'.ns-carta__firma')
};
function borrar(destinos){
Object.keys(destinos).forEach(function(nombre){
if(destinos[nombre])destinos[nombre].style.removeProperty(nombre);
});
}
var viva=false;
var cierreVivo=false;
var clavado=false;
var clavadoPintado=false;
var cartaViva=false;
var cartaClavada=false;
var cartaClavadaPintada=false;
var cartaEnPantalla=false;
var cartaEnPantallaPintada=false;
var cartaLustrada=false;
function revisarModo(){
var quiere=cabe();
var quiereCierre=quiere&&!!cierre;
var quiereCarta=quiere&&!!carta;
if(quiere===viva&&quiereCierre===cierreVivo&&quiereCarta===cartaViva)return;
viva=quiere;
cierreVivo=quiereCierre;
cartaViva=quiereCarta;
escena.classList.toggle('ns-cine--viva',viva);
if(cierre)cierre.classList.toggle('ns-cierre--viva',cierreVivo);
if(carta)carta.classList.toggle('ns-carta--viva',cartaViva);
if(cierre&&!cierreVivo){
borrar(DESTINOS_CIERRE);
cierre.classList.remove('ns-cierre--clavado');
clavado=clavadoPintado=false;
escritoCierre={};
ultimoCierre=-1;
pCierre=0;
contadosYa=false;
}
if(carta&&!cartaViva){
borrar(DESTINOS_CARTA);
carta.classList.remove('ns-carta--clavado');
document.documentElement.classList.remove('con-carta');
carta.classList.remove('ns-carta--lustrada');
cartaClavada=cartaClavadaPintada=cartaLustrada=false;
cartaEnPantalla=cartaEnPantallaPintada=false;
escritoCarta={};
ultimoCarta=-1;
pCarta=0;
}
if(!viva){
borrar(DESTINOS_CINE);
borrar(DESTINOS_CIERRE);
borrar(DESTINOS_CARTA);
escritoCine={};
escritoCierre={};
escritoCarta={};
if(elenco)elenco.despertar(false);
cintas('todas');
}else{
if(elenco)elenco.dormir();
cintas('historia');
}
}
function tramo(v,a,b){return Math.min(1,Math.max(0,(v - a)/(b - a)));}
function suave(t){return t*t*(3 - 2*t);}
var escritoCine={};
var escritoCierre={};
var escritoCarta={};
function ponCine(nombre,valor){
if(escritoCine[nombre]===valor)return;
escritoCine[nombre]=valor;
if(DESTINOS_CINE[nombre])DESTINOS_CINE[nombre].style.setProperty(nombre,valor);
}
function ponCierre(nombre,valor){
if(escritoCierre[nombre]===valor)return;
escritoCierre[nombre]=valor;
if(DESTINOS_CIERRE[nombre])DESTINOS_CIERRE[nombre].style.setProperty(nombre,valor);
}
function ponCarta(nombre,valor){
if(escritoCarta[nombre]===valor)return;
escritoCarta[nombre]=valor;
if(DESTINOS_CARTA[nombre])DESTINOS_CARTA[nombre].style.setProperty(nombre,valor);
}
function progresoDe(bloque,ctx){
var caja=bloque.getBoundingClientRect();
var recorrido=caja.height - ctx.alto;
if(recorrido <=0)return 0;
return Math.min(1,Math.max(0,-caja.top / recorrido));
}
var pCine=0;
var pCierre=0;
var pCarta=0;
var ultimoCine=-1;
var ultimoCierre=-1;
var ultimoCarta=-1;
var contadosYa=false;
var rielMejor=0;
var rielPintado=-1;
function leer(ctx){
if(viva){
pCine=progresoDe(escena,ctx);
if(carta&&cartaViva){
pCarta=progresoDe(carta,ctx);
var cajaCarta=carta.getBoundingClientRect();
cartaClavada=cajaCarta.top <=1;
cartaEnPantalla=cartaClavada&&cajaCarta.bottom > ctx.alto;
}
if(cierre&&cierreVivo){
pCierre=progresoDe(cierre,ctx);
clavado=cierre.getBoundingClientRect().top <=1;
}
}
rielMejor=paradaEnCurso(ctx);
}
function escribir(){
if(viva&&pCine !==ultimoCine){
ultimoCine=pCine;
var entra=suave(tramo(pCine,.07,.21));
var texto=tramo(pCine,.22,.30);
var sale=suave(tramo(pCine,.45,.59));
var sube=suave(tramo(pCine,.74,.86));
var textoI=tramo(pCine,.78,.89);
var cierra=suave(tramo(pCine,cierreVivo?.92:.94,1));
var der=sale > 0?sale:(1 - entra);
ponCine('--f-der',(der*100).toFixed(2)+ '%');
ponCine('--f-op',texto.toFixed(3));
ponCine('--f-desenfoque',((1 - texto)*12).toFixed(1)+ 'px');
ponCine('--f-ent',(1 - texto).toFixed(3));
ponCine('--f-filo',((1 - der)*100).toFixed(2)+ '%');
ponCine('--f-filo-op',der > 0&&der < 1?'1':'0');
ponCine('--i-sube',((1 - sube)*100).toFixed(2)+ '%');
ponCine('--i-op',textoI.toFixed(3));
ponCine('--i-desenfoque',((1 - textoI)*10).toFixed(1)+ 'px');
ponCine('--i-y',((1 - textoI)*42).toFixed(1)+ 'px');
ponCine('--i-filo',((1 - sube)*100).toFixed(2)+ '%');
ponCine('--i-filo-op',sube > 0&&sube < 1?'1':'0');
ponCine('--h-abre',(1 - cierra).toFixed(3));
ponCine('--h-filo',cierra > 0&&cierra < 1?'1':'0');
var segundo=pCine >=.33?1:0;
ponCine('--c-uno',String(1 - segundo));
ponCine('--c-dos',String(segundo));
ponCine('--c-ev-uno',segundo?'none':'auto');
ponCine('--c-ev-dos',segundo?'auto':'none');
if(elenco){
if(pCine > .31&&pCine < .78)elenco.despertar(pCine < .50);
else elenco.dormir();
}
cintas(pCine < .22?'historia':(pCine > .73?'infra':'ninguna'));
}
if(viva&&cartaViva&&cartaClavada !==cartaClavadaPintada){
cartaClavadaPintada=cartaClavada;
carta.classList.toggle('ns-carta--clavado',cartaClavada);
}
if(viva&&cartaViva&&cartaEnPantalla !==cartaEnPantallaPintada){
cartaEnPantallaPintada=cartaEnPantalla;
document.documentElement.classList.toggle('con-carta',cartaEnPantalla);
}
if(viva&&cartaViva&&carta&&pCarta !==ultimoCarta){
ultimoCarta=pCarta;
var cRetrato=suave(tramo(pCarta,.05,.26));
var cFrase=suave(tramo(pCarta,.18,.34));
var cPapel=suave(tramo(pCarta,.40,.62));
var cTexto=tramo(pCarta,.50,.70);
var cFilo=suave(tramo(pCarta,.60,.76));
var cFirma=tramo(pCarta,.70,.84);
var cAbre=suave(tramo(pCarta,0,.14));
var cCierra=suave(tramo(pCarta,.92,1));
var cHojas=cAbre*(1 - cCierra);
ponCarta('--h-abre',cHojas.toFixed(3));
ponCarta('--h-filo',cHojas > 0&&cHojas < 1?'1':'0');
ponCarta('--k-retrato',cRetrato.toFixed(3));
ponCarta('--k-frase',cFrase.toFixed(3));
ponCarta('--k-papel',cPapel.toFixed(3));
ponCarta('--k-texto',cTexto.toFixed(3));
ponCarta('--k-filo',cFilo.toFixed(3));
ponCarta('--k-firma',cFirma.toFixed(3));
if(cPapel < .2){
if(cartaLustrada){cartaLustrada=false;carta.classList.remove('ns-carta--lustrada');}
}else if(!cartaLustrada&&cPapel > .96){
cartaLustrada=true;
carta.classList.add('ns-carta--lustrada');
}
}
if(viva&&cierreVivo&&clavado !==clavadoPintado){
clavadoPintado=clavado;
cierre.classList.toggle('ns-cierre--clavado',clavado);
}
if(viva&&cierreVivo&&cierre&&pCierre !==ultimoCierre){
ultimoCierre=pCierre;
var abre=suave(tramo(pCierre,.03,.4));
ponCierre('--h-abre',abre.toFixed(3));
ponCierre('--h-filo',abre > 0&&abre < 1?'1':'0');
if(abre <=0)contadosYa=false;
else if(!contadosYa&&abre > .12&&window.SmilersContadores){
contadosYa=true;
cierre.querySelectorAll('[data-contador]').forEach(function(c){
window.SmilersContadores.animar(c);
});
}
}
if(rielMejor !==rielPintado){
rielPintado=rielMejor;
botones.forEach(function(boton,i){
boton.classList.toggle('ns-riel__boton--activo',i===rielMejor);
});
}
}
revisarModo();
SmilersScroll.registrar(leer,escribir,function(){
revisarModo();
ultimoCine=-1;
ultimoCierre=-1;
ultimoCarta=-1;
escritoCine={};
escritoCierre={};
escritoCarta={};
});
var paradas=[
{id:'historia',nombre:'Historia',bloque:escena,p:0,desde:0},
{id:'fundamentos',nombre:'Fundamentos',bloque:escena,p:.37,desde:.21},
{id:'equipo',nombre:'Equipo',bloque:escena,p:.66,desde:.52},
{id:'infraestructura',nombre:'Infraestructura',bloque:escena,p:.905,desde:.80},
{id:'bienvenida',nombre:'Carta de bienvenida',bloque:carta,p:.86,desde:.12},
{id:'cifras',nombre:'En cifras',bloque:cierre,p:.55,desde:.15}
].filter(function(parada){
parada.destinoEl=document.getElementById(parada.id);
return parada.bloque&&parada.destinoEl;
});
function bloqueVivo(parada){
if(parada.bloque===escena)return viva;
if(parada.bloque===carta)return cartaViva;
return cierreVivo;
}
function progresoSuyo(parada){
if(parada.bloque===escena)return pCine;
if(parada.bloque===carta)return pCarta;
return pCierre;
}
function destinoDe(parada){
if(!bloqueVivo(parada)){
return Math.max(0,parada.destinoEl.getBoundingClientRect().top + window.scrollY - 90);
}
var caja=parada.bloque.getBoundingClientRect();
var arriba=caja.top + window.scrollY;
var recorrido=Math.max(0,caja.height -(window.SmilersScroll?SmilersScroll.alto():window.innerHeight));
return Math.round(arriba + parada.p*recorrido);
}
function llevarA(parada,suavemente){
var destino=destinoDe(parada);
if(suavemente&&window.SmilersScroll&&!quietud.matches){
SmilersScroll.deslizarA(destino,900);
}else{
window.scrollTo(0,destino);
}
}
function paradaEnCurso(ctx){
var mejor=0;
for(var i=0;i < paradas.length;i++){
var parada=paradas[i];
if(bloqueVivo(parada)){
if(progresoSuyo(parada)>=parada.desde)mejor=i;
}else if(parada.destinoEl.getBoundingClientRect().top < ctx.alto*.5){
mejor=i;
}
}
return mejor;
}
var botones=[];
if(paradas.length > 1){
var nav=document.createElement('nav');
nav.className='ns-riel-nav';
nav.setAttribute('aria-label','Secciones de la página');
var lista=document.createElement('ul');
lista.className='ns-riel';
paradas.forEach(function(parada){
var fila=document.createElement('li');
var boton=document.createElement('button');
boton.type='button';
boton.className='ns-riel__boton';
boton.dataset.nombre=parada.nombre;
boton.setAttribute('aria-label','Ir a ' + parada.nombre);
boton.addEventListener('click',function(){llevarA(parada,true);});
fila.appendChild(boton);
lista.appendChild(fila);
botones.push(boton);
});
nav.appendChild(lista);
document.body.appendChild(nav);
}
document.addEventListener('click',function(evento){
var enlace=evento.target.closest&&evento.target.closest('a[href*="#"]');
if(!enlace)return;
var trozos=enlace.getAttribute('href').split('#');
if(trozos.length < 2||!trozos[1])return;
var primero=trozos[0];
if(primero){
var suyo=location.pathname.replace(/\.html$/,'');
var otro=primero.replace(/\.html$/,'');
if(otro !==suyo&&otro !==suyo.split('/').pop())return;
}
for(var i=0;i < paradas.length;i++){
if(paradas[i].id===trozos[1]){
evento.preventDefault();
llevarA(paradas[i],true);
return;
}
}
});
if(location.hash.length > 1){
var pedido=location.hash.slice(1);
var suya=null;
for(var iP=0;iP < paradas.length;iP++){
if(paradas[iP].id===pedido){suya=paradas[iP];break;}
}
if(suya){
var puesta=-1;
var colocar=function(){
puesta=destinoDe(suya);
window.scrollTo(0,puesta);
SmilersScroll.pedir();
};
requestAnimationFrame(function(){requestAnimationFrame(colocar);});
if(document.readyState !=='complete'){
window.addEventListener('load',function(){
requestAnimationFrame(function(){
if(puesta < 0||Math.abs(window.scrollY - puesta)> 4)return;
colocar();
});
},{once:true});
}
}
}
SmilersScroll.pedir();
})();
});;
(function(){
'use strict';
var AJUSTES={
metaPixel:'',
googleAds:'',
googleAdsContacto:'',
antesDeDecidir:'activo',
revision:1
};
var hayPixeles=!!(AJUSTES.metaPixel||AJUSTES.googleAds);
var raiz=document.documentElement;
var botonesPreferencias=document.querySelectorAll('[data-preferencias-cookies]');
var quietud=window.matchMedia('(prefers-reduced-motion: reduce)');
var CATEGORIA='publicidad';
function decisionGuardada(){
var m=document.cookie.match(/(?:^|;)\s*cc_cookie=([^;]+)/);
if(!m)return null;
try{
var d=JSON.parse(decodeURIComponent(m[1]));
if(d.revision !==AJUSTES.revision)return null;
if(d.expirationTime&&d.expirationTime < Date.now())return null;
return Array.isArray(d.categories)&&d.categories.indexOf(CATEGORIA)!==-1;
}catch(e){
return null;
}
}
var pixelesActivos=false;
function pedirGuion(src){
var s=document.createElement('script');
s.async=true;
s.src=src;
document.head.appendChild(s);
}
function cargarMeta(id){
if(window.fbq)return;
var n=window.fbq=function(){
if(n.callMethod)n.callMethod.apply(n,arguments);
else n.queue.push(arguments);
};
if(!window._fbq)window._fbq=n;
n.push=n;
n.loaded=true;
n.version='2.0';
n.queue=[];
pedirGuion('https://connect.facebook.net/en_US/fbevents.js');
window.fbq('init',id);
window.fbq('track','PageView');
}
function cargarGoogleAds(id){
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
window.gtag('consent','default',{
ad_storage:'granted',
ad_user_data:'granted',
ad_personalization:'granted',
analytics_storage:'denied'
});
window.gtag('js',new Date());
window.gtag('config',id);
pedirGuion('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
}
function activarPixeles(){
if(pixelesActivos||!hayPixeles)return;
pixelesActivos=true;
if(AJUSTES.metaPixel)cargarMeta(AJUSTES.metaPixel);
if(AJUSTES.googleAds)cargarGoogleAds(AJUSTES.googleAds);
}
function borrarCookiesDePublicidad(){
var nombres=document.cookie.split(';')
.map(function(trozo){return trozo.split('=')[0].trim();})
.filter(function(nombre){return /^_fbp$|^_fbc$|^_gcl_/.test(nombre);});
if(!nombres.length)return;
var host=location.hostname;
var dominios=[null,host,'.' + host];
var punto=host.indexOf('.');
if(punto !==-1)dominios.push('.' + host.slice(punto + 1));
nombres.forEach(function(nombre){
dominios.forEach(function(dominio){
document.cookie=nombre + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
(dominio?'; domain=' + dominio:'');
});
});
}
function apagarPixeles(){
if(!pixelesActivos)return;
pixelesActivos=false;
if(window.gtag){
window.gtag('consent','update',{
ad_storage:'denied',
ad_user_data:'denied',
ad_personalization:'denied',
analytics_storage:'denied'
});
}
borrarCookiesDePublicidad();
location.reload();
}
function canalDe(href){
if(/^https:\/\/(api\.whatsapp\.com|wa\.me)\//.test(href))return 'WhatsApp';
if(/^tel:/.test(href))return 'Llamada';
if(/^mailto:|^https:\/\/mail\.google\.com\//.test(href))return 'Correo';
return null;
}
function contarContacto(canal){
if(!pixelesActivos)return;
if(window.fbq)window.fbq('track','Contact',{content_category:canal});
if(window.gtag&&AJUSTES.googleAdsContacto){
window.gtag('event','conversion',{
send_to:AJUSTES.googleAdsContacto,
transport_type:'beacon'
});
}
}
document.addEventListener('click',function(evento){
var enlace=evento.target.closest&&evento.target.closest('a[href]');
if(!enlace)return;
var canal=canalDe(enlace.getAttribute('href'));
if(canal)contarContacto(canal);
},true);
var formulario=document.getElementById('formWhatsapp');
if(formulario){
formulario.addEventListener('submit',function(){contarContacto('WhatsApp');});
}
var carga=null;
var arrancado=false;
function cargarLibreria(){
if(carga)return carga;
var meta=document.querySelector('meta[name="smilers-consentimiento"]');
carga=new Promise(function(resolver,fallar){
if(!meta){fallar(new Error('sin meta de consentimiento'));return;}
var hoja=document.createElement('link');
hoja.rel='stylesheet';
hoja.href=meta.dataset.perezosoCss;
document.head.appendChild(hoja);
var guion=document.createElement('script');
guion.src=meta.dataset.perezosoJs;
guion.onload=function(){resolver();};
guion.onerror=fallar;
document.head.appendChild(guion);
});
return carga;
}
function arrancar(mostrar){
if(arrancado)return Promise.resolve(window.CookieConsent);
arrancado=true;
return window.SmilersAvisoCookies.arrancar({
revision:AJUSTES.revision,
categoria:CATEGORIA,
mostrar:mostrar,
yaMiden:pixelesActivos,
hayPixeles:hayPixeles,
alAceptar:activarPixeles,
alRechazar:apagarPixeles
});
}
function enReposo(fn){
var luego=function(){
if(window.requestIdleCallback)window.requestIdleCallback(fn,{timeout:2000});
else setTimeout(fn,300);
};
if(document.readyState==='complete')luego();
else window.addEventListener('load',luego,{once:true});
}
function trasLaBienvenida(fn){
var hecho=false;
function una(){
if(hecho)return;
hecho=true;
enReposo(fn);
}
var splash=document.getElementById('splashInicio');
if(splash&&!raiz.classList.contains('sin-splash')&&!window.SmilersSplashTerminado){
document.addEventListener('smilers:splash-fin',una,{once:true});
setTimeout(una,12000);
return;
}
var cortina=document.querySelector('.ns-umbral');
var conCortina=cortina&&!raiz.classList.contains('sin-umbral')&&!quietud.matches;
setTimeout(una,conCortina?1800:400);
}
Array.prototype.forEach.call(botonesPreferencias,function(boton){
boton.hidden=false;
boton.addEventListener('click',function(){
cargarLibreria()
.then(function(){return arrancar(false);})
.then(function(CC){CC.showPreferences();})
.catch(function(){});
});
});
var decision=decisionGuardada();
if(decision===true){
enReposo(activarPixeles);
}else if(decision===null){
if(AJUSTES.antesDeDecidir==='activo')enReposo(activarPixeles);
trasLaBienvenida(function(){
cargarLibreria().then(function(){return arrancar(true);}).catch(function(){});
});
}
})();
