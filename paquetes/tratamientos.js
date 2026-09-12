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
var bloqueadoHasta=0;
var inmuneHasta=0;
function abortar(){
if(Date.now()< inmuneHasta)return;
document.documentElement.classList.remove('smilers-deslizando');
if(deslizamiento){
deslizamiento.vivo=false;
bloqueadoHasta=Date.now()+ 1400;
}
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
var direccion='down';
var ultimaDireccionArriba=false;
var yPrevia=null;
var SALTO_MAXIMO=.9;
function alDetenerse(){
idle=null;
if(deslizamiento)return;
if(Date.now()< bloqueadoHasta)return;
if(direccion !=='down')return;
for(var i=0;i < quietos.length;i++){
var respuesta=quietos[i](direccion);
if(respuesta===null||respuesta===undefined)continue;
var destino=typeof respuesta==='number'?respuesta:respuesta.y;
var tope=(typeof respuesta==='object'&&respuesta.maximo)||SALTO_MAXIMO;
if(typeof destino !=='number'||!isFinite(destino))continue;
var salto=destino - window.scrollY;
if(Math.abs(salto)> 4&&Math.abs(salto)< window.innerHeight*tope){
deslizarA(destino,Math.min(1150,420 + Math.abs(salto)*.95));
}
return;
}
}
function alScroll(){
var y=window.scrollY;
if(yPrevia===null)yPrevia=y;
if(y > yPrevia + 1)direccion='down';
else if(y < yPrevia - 1)direccion='up';
yPrevia=y;
var arriba=(direccion==='up');
if(arriba !==ultimaDireccionArriba){
ultimaDireccionArriba=arriba;
document.documentElement.classList.toggle('smilers-arriba',arriba);
}
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
const elementosRevelar=document.querySelectorAll('.revelar');
const temporizadoresOcultarRevelar=new WeakMap();
const CAPA_REVELAR='transform, opacity';
function soltarCapa(evento){
if(evento.target !==this)return;
this.style.willChange='auto';
}
elementosRevelar.forEach(function(el){
el.addEventListener('transitionend',soltarCapa);
});
if('IntersectionObserver' in window){
const observador=new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
const razon=entrada.intersectionRatio;
if(razon >=0.15){
const ocultarPendiente=temporizadoresOcultarRevelar.get(entrada.target);
if(ocultarPendiente){
clearTimeout(ocultarPendiente);
temporizadoresOcultarRevelar.delete(entrada.target);
}
if(!entrada.target.classList.contains('visible')){
entrada.target.style.willChange=CAPA_REVELAR;
entrada.target.classList.add('visible');
}
}else if(razon===0){
if(!temporizadoresOcultarRevelar.has(entrada.target)){
const idOcultar=setTimeout(function(){
entrada.target.style.willChange=CAPA_REVELAR;
entrada.target.classList.remove('visible');
temporizadoresOcultarRevelar.delete(entrada.target);
},400);
temporizadoresOcultarRevelar.set(entrada.target,idOcultar);
}
}
});
},{threshold:[0,0.15],rootMargin:'0px 0px -8% 0px'});
elementosRevelar.forEach(function(el){observador.observe(el);});
}else{
elementosRevelar.forEach(function(el){el.classList.add('visible');});
}
const cortinas=document.querySelectorAll('.cortina');
const retrasosCortina=new WeakMap();
const cierresCortina=new WeakMap();
if('IntersectionObserver' in window){
const obsCortinas=new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
if(entrada.intersectionRatio===0){
const pendiente=retrasosCortina.get(entrada.target);
if(pendiente){
clearTimeout(pendiente);
retrasosCortina.delete(entrada.target);
}
if(!cierresCortina.has(entrada.target)){
const idCierre=setTimeout(function(){
entrada.target.classList.remove('abierta');
cierresCortina.delete(entrada.target);
},400);
cierresCortina.set(entrada.target,idCierre);
}
return;
}
if(entrada.intersectionRatio < 0.1)return;
const cierrePendiente=cierresCortina.get(entrada.target);
if(cierrePendiente){
clearTimeout(cierrePendiente);
cierresCortina.delete(entrada.target);
}
if(entrada.target.classList.contains('abierta'))return;
const retraso=Number(entrada.target.dataset.retrasoMs||0);
const pendiente=retrasosCortina.get(entrada.target);
if(retraso > 0){
if(pendiente)clearTimeout(pendiente);
const id=setTimeout(function(){
entrada.target.classList.add('abierta');
},retraso);
retrasosCortina.set(entrada.target,id);
}else{
entrada.target.classList.add('abierta');
}
});
},{threshold:[0,0.1],rootMargin:'0px 0px -5% 0px'});
cortinas.forEach(function(el){obsCortinas.observe(el);});
}else{
cortinas.forEach(function(el){el.classList.add('abierta');});
}
const punteroFino=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const haceParallax=punteroFino&&window.matchMedia('(min-width: 992px)').matches;
const piezasParallax=haceParallax?document.querySelectorAll('[data-parallax]'):[];
if(piezasParallax.length
&&window.matchMedia('(prefers-reduced-motion: no-preference)').matches){
const escrituras=[];
function leerEfectosScroll(ctx){
const alto=ctx.alto;
escrituras.length=0;
piezasParallax.forEach(function(pieza){
const caja=pieza.getBoundingClientRect();
if(caja.bottom < -220||caja.top > alto + 220)return;
const progreso=((caja.top + caja.height / 2)/ alto - 0.5)*-2;
const fuerza=Number(pieza.dataset.parallax||0);
escrituras.push([pieza,progreso*fuerza]);
});
}
function escribirEfectosScroll(){
escrituras.forEach(function(orden){
orden[0].style.transform='translate3d(0,' + orden[1].toFixed(2)+ 'px,0)';
});
}
SmilersScroll.registrar(leerEfectosScroll,escribirEfectosScroll);
SmilersScroll.pedir();
}
(function(){
var escena=document.getElementById('pnEscena');
if(!escena||typeof SmilersScroll==='undefined')return;
var viva=false;
function cabe(){
return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
}
function piezas(selector){
return Array.prototype.slice.call(escena.querySelectorAll(selector));
}
var telon=piezas('.pn-telon');
var contenidos=piezas('.pn-contenido');
var filo=piezas('.pn-filo');
var fondoUno=piezas('.pn-fondo--uno');
var fondoDos=piezas('.pn-fondo--dos');
var DESTINOS={
'--pn-der':telon,'--pn-izq':telon,
'--pn-op':contenidos,'--pn-desenfoque':contenidos,'--pn-x':contenidos,
'--pn-filo':filo,'--pn-filo-op':filo,
'--pn-uno':fondoUno,'--pn-ev-uno':fondoUno,
'--pn-dos':fondoDos,'--pn-ev-dos':fondoDos
};
var escrito={};
function pon(nombre,valor){
if(escrito[nombre]===valor)return;
escrito[nombre]=valor;
DESTINOS[nombre].forEach(function(pieza){pieza.style.setProperty(nombre,valor);});
}
function revisarModo(){
var quiere=cabe();
if(quiere===viva)return;
viva=quiere;
escena.classList.toggle('pn-escena--viva',viva);
if(!viva){
Object.keys(DESTINOS).forEach(function(nombre){
DESTINOS[nombre].forEach(function(pieza){pieza.style.removeProperty(nombre);});
});
escrito={};
}
}
var progreso=0;
var ultimo=-1;
function leerEscena(ctx){
if(!viva)return;
var caja=escena.getBoundingClientRect();
var recorrido=caja.height - ctx.alto;
if(recorrido <=0){progreso=0;return;}
progreso=Math.min(1,Math.max(0,-caja.top / recorrido));
}
function tramo(v,a,b){return Math.min(1,Math.max(0,(v - a)/(b - a)));}
function suave(t){return t*t*(3 - 2*t);}
function escribirEscena(){
if(!viva||progreso===ultimo)return;
ultimo=progreso;
var tapa=suave(tramo(progreso,.05,.32));
var entra=tramo(progreso,.34,.46);
var abre=suave(tramo(progreso,.70,.97));
pon('--pn-der',((1 - tapa)*100).toFixed(2)+ '%');
pon('--pn-izq',(abre*100).toFixed(2)+ '%');
pon('--pn-op',entra.toFixed(3));
pon('--pn-desenfoque',((1 - entra)*14).toFixed(1)+ 'px');
pon('--pn-x',(-abre*12).toFixed(2)+ 'vw');
var cerrando=abre > 0;
var canto=cerrando?abre:tapa;
pon('--pn-filo',(canto*100).toFixed(2)+ '%');
pon('--pn-filo-op',canto > 0&&canto < 1?'1':'0');
var segundo=progreso >=.5?1:0;
pon('--pn-uno',String(1 - segundo));
pon('--pn-dos',String(segundo));
pon('--pn-ev-uno',segundo?'none':'auto');
pon('--pn-ev-dos',segundo?'auto':'none');
}
revisarModo();
SmilersScroll.registrar(leerEscena,escribirEscena,function(){
revisarModo();
ultimo=-1;
},{guarda:escena});
SmilersScroll.pedir();
})();
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
const anio=document.getElementById('anioActual');
if(anio)anio.textContent=new Date().getFullYear();
});;
document.addEventListener('DOMContentLoaded',function(){
const botonesFiltro=document.querySelectorAll('.filtro-btn');
const itemsGaleria=document.querySelectorAll('.item-galeria-grande');
if(botonesFiltro.length&&itemsGaleria.length){
botonesFiltro.forEach(function(boton){
boton.addEventListener('click',function(){
botonesFiltro.forEach(function(b){b.classList.remove('activo');});
boton.classList.add('activo');
const categoria=boton.dataset.filtro;
itemsGaleria.forEach(function(item){
item.classList.remove('aparecer');
const coincide=categoria==='todos'||item.dataset.categoria===categoria;
if(coincide){
item.classList.add('mostrar');
requestAnimationFrame(function(){
requestAnimationFrame(function(){item.classList.add('aparecer');});
});
}else{
item.classList.remove('mostrar');
}
});
});
});
function filtrarSegunDireccion(){
const marca=decodeURIComponent(window.location.hash.slice(1));
if(!marca)return;
const boton=Array.prototype.find.call(botonesFiltro,function(b){
return b.dataset.filtro===marca;
});
if(!boton)return;
boton.click();
const reja=document.querySelector('.filtros-galeria');
if(!reja)return;
const suave=window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
const alto=parseFloat(
getComputedStyle(document.documentElement).getPropertyValue('--alto-navbar'))||62;
const destino=reja.getBoundingClientRect().top + window.scrollY - alto - 20;
window.scrollTo({top:Math.max(0,destino),behavior:suave?'smooth':'auto'});
}
filtrarSegunDireccion();
window.addEventListener('hashchange',filtrarSegunDireccion);
}
const modalLightboxEl=document.getElementById('modalLightbox');
const disparadoresLightbox=document.querySelectorAll('[data-lightbox-src]');
if(modalLightboxEl&&disparadoresLightbox.length){
const imagenModal=modalLightboxEl.querySelector('img');
const leyendaModal=modalLightboxEl.querySelector('.lightbox-leyenda');
const modalBootstrap=new bootstrap.Modal(modalLightboxEl);
disparadoresLightbox.forEach(function(disparador){
disparador.addEventListener('click',function(evento){
evento.preventDefault();
imagenModal.src=disparador.dataset.lightboxSrc;
imagenModal.alt=disparador.dataset.lightboxAlt||'';
leyendaModal.textContent=disparador.dataset.lightboxAlt||'';
modalBootstrap.show();
});
});
}
document.querySelectorAll('[data-comparador]').forEach(function(contenedor){
const marco=contenedor.querySelector('.comparador-marco');
const rango=contenedor.querySelector('.comparador-rango');
if(!marco||!rango)return;
function fijarPosicion(porcentaje){
const acotado=Math.min(100,Math.max(0,porcentaje));
marco.style.setProperty('--pos',acotado + '%');
rango.value=acotado;
}
function porcentajeDesdeEvento(evento){
const rect=marco.getBoundingClientRect();
const x=evento.clientX - rect.left;
return(x / rect.width)*100;
}
let punteroActivo=null;
marco.addEventListener('pointerdown',function(evento){
punteroActivo=evento.pointerId;
if(marco.setPointerCapture){
try{marco.setPointerCapture(evento.pointerId);}catch(e){}
}
fijarPosicion(porcentajeDesdeEvento(evento));
});
marco.addEventListener('pointermove',function(evento){
if(punteroActivo===evento.pointerId){
if(evento.cancelable)evento.preventDefault();
fijarPosicion(porcentajeDesdeEvento(evento));
return;
}
if(evento.pointerType==='mouse'&&evento.buttons===0)return;
if(evento.pointerType==='mouse')fijarPosicion(porcentajeDesdeEvento(evento));
});
function soltar(evento){
if(punteroActivo !==evento.pointerId)return;
punteroActivo=null;
if(marco.releasePointerCapture){
try{marco.releasePointerCapture(evento.pointerId);}catch(e){}
}
}
marco.addEventListener('pointerup',soltar);
marco.addEventListener('pointercancel',soltar);
rango.addEventListener('input',function(){
fijarPosicion(Number(rango.value));
});
});
var acordeones={};
document.querySelectorAll('.acordeon-tratamiento-boton').forEach(function(boton){
var panel=document.getElementById(boton.getAttribute('aria-controls'));
if(!panel)return;
function poner(abierto){
panel.classList.toggle('abierta',abierto);
boton.setAttribute('aria-expanded',String(abierto));
}
boton.addEventListener('click',function(){poner(!panel.classList.contains('abierta'));});
acordeones[panel.id.replace(/^panel-/,'')]=poner;
});
function abrirSegun(ancla){
var poner=acordeones[decodeURIComponent((ancla||'').replace(/^#/,''))];
if(poner)poner(true);
return !!poner;
}
if(abrirSegun(window.location.hash)){
var pedida=document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
var colocar=function(){
if(!pedida)return;
var suave=window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
pedida.scrollIntoView({block:'start',behavior:suave?'smooth':'auto'});
};
window.addEventListener('load',function(){
(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){
requestAnimationFrame(colocar);
});
});
}
window.addEventListener('hashchange',function(){abrirSegun(window.location.hash);});
document.addEventListener('click',function(evento){
var enlace=evento.target.closest&&evento.target.closest('a[href*="#"]');
if(!enlace)return;
var destino=new URL(enlace.href,window.location.href);
var aqui=window.location.pathname.replace(/\.html$/,'');
if(destino.pathname.replace(/\.html$/,'')===aqui)abrirSegun(destino.hash);
});
});;
document.addEventListener('DOMContentLoaded',function(){
var quietud=window.matchMedia('(prefers-reduced-motion: reduce)');
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
var dormido=false;
var visible=true;
var previaToma=null;
function pintar(){
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
if(manual)arrancar();
}
function arrancar(){
parar();
if(dormido||!visible||quietud.matches)return;
reloj=setInterval(function(){ir(actual + 1);},intervalo);
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
});
