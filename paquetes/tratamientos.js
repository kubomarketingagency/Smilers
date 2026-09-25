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
(function(){
'use strict';
if(typeof IntersectionObserver !=='function'||!document.getAnimations)return;
var vigilados=new WeakSet();
function esInfinita(animacion){
var efecto=animacion.effect;
return !!(efecto&&efecto.getComputedTiming&&efecto.getComputedTiming().iterations===Infinity);
}
var observador=new IntersectionObserver(function(registros){
registros.forEach(function(registro){
if(registro.isIntersecting)registro.target.removeAttribute('data-reposo');
else registro.target.setAttribute('data-reposo','');
});
},{rootMargin:'50% 0px'});
function vigilar(el){
if(!el||el.nodeType !==1||vigilados.has(el))return;
vigilados.add(el);
observador.observe(el);
}
function revisar(animaciones){
animaciones.forEach(function(animacion){
if(esInfinita(animacion))vigilar(animacion.effect.target);
});
}
document.addEventListener('animationstart',function(ev){
var el=ev.target;
if(el&&el.nodeType===1&&!vigilados.has(el))revisar(el.getAnimations({subtree:true}));
},true);
function revisarTodas(){revisar(document.getAnimations());}
var CERCA='.tz-mosaico';
var cercania=new IntersectionObserver(function(registros){
registros.forEach(function(registro){
if(registro.isIntersecting)registro.target.setAttribute('data-cerca','');
else registro.target.removeAttribute('data-cerca');
});
},{rootMargin:'50% 0px'});
Array.prototype.forEach.call(document.querySelectorAll(CERCA),function(el){cercania.observe(el);});
if(document.readyState==='complete')revisarTodas();
else window.addEventListener('load',revisarTodas);
setTimeout(revisarTodas,2500);
})();;
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
document.documentElement.classList.toggle('menu-desplegado',nuevoEstado);
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
const relojesCapa=new WeakMap();
const TOPE_CAPA=2200;
function pedirCapa(el){
el.style.willChange=CAPA_REVELAR;
clearTimeout(relojesCapa.get(el));
relojesCapa.set(el,setTimeout(function(){
el.style.willChange='auto';
relojesCapa.delete(el);
},TOPE_CAPA));
}
elementosRevelar.forEach(function(el){
el.addEventListener('transitionend',soltarCapa);
});
const modoRevelar=document.body.dataset.revelar;
const unaVez=modoRevelar==='una-vez';
const soloAbajo=modoRevelar==='al-bajar';
const EN_PIN='.pn-pin, .hero-cine-pin, .cierre-cine-pin, .testimonios-pin, ' +
'.ns-cine__pin, .ns-cierre__pin, .ns-carta__pin';
if('IntersectionObserver' in window){
const alCruzar=function(entradas){
entradas.forEach(function(entrada){
const razon=entrada.intersectionRatio;
if(razon >=0.15){
const ocultarPendiente=temporizadoresOcultarRevelar.get(entrada.target);
if(ocultarPendiente){
clearTimeout(ocultarPendiente);
temporizadoresOcultarRevelar.delete(entrada.target);
}
if(!entrada.target.classList.contains('visible')){
pedirCapa(entrada.target);
entrada.target.classList.add('visible');
}
}else if(razon===0&&!unaVez){
if(soloAbajo&&!(entrada.boundingClientRect.top > 0))return;
if(!temporizadoresOcultarRevelar.has(entrada.target)){
const idOcultar=setTimeout(function(){
pedirCapa(entrada.target);
entrada.target.classList.remove('visible');
temporizadoresOcultarRevelar.delete(entrada.target);
},400);
temporizadoresOcultarRevelar.set(entrada.target,idOcultar);
}
}
});
};
const observador=new IntersectionObserver(alCruzar,{threshold:[0,0.15],rootMargin:'0px 0px -8% 0px'});
const observadorClavado=new IntersectionObserver(alCruzar,{threshold:[0,0.15]});
elementosRevelar.forEach(function(el){
(el.closest(EN_PIN)?observadorClavado:observador).observe(el);
});
}else{
elementosRevelar.forEach(function(el){el.classList.add('visible');});
}
const cortinas=document.querySelectorAll('.cortina');
const retrasosCortina=new WeakMap();
const cierresCortina=new WeakMap();
if('IntersectionObserver' in window){
const obsCortinas=new IntersectionObserver(function(entradas){
entradas.forEach(function(entrada){
if(!entrada.isIntersecting){
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
},{threshold:0,rootMargin:'0px 0px -10% 0px'});
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
function puntoDeEscena(p){
var caja=escena.getBoundingClientRect();
var recorrido=Math.max(0,caja.height - SmilersScroll.alto());
return caja.top + window.scrollY + p*recorrido;
}
if(fondoDos[0]){
fondoDos[0].smilersRiel={
destino:function(){return viva?puntoDeEscena(.99):null;},
desde:function(){return viva?puntoDeEscena(.78):null;}
};
}
var envoltorio=escena.parentNode&&escena.parentNode.closest?escena.parentNode.closest('[data-pantalla]'):null;
if(envoltorio){
envoltorio.smilersRiel={
destino:function(){return viva?puntoDeEscena(0):null;}
};
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
var anclaPedida=window.location.hash;
var tocada=false;
['wheel','touchstart','pointerdown','keydown'].forEach(function(tipo){
window.addEventListener(tipo,function(){tocada=true;},{passive:true,once:true});
});
var colocar=function(){
if(!pedida||tocada||window.location.hash !==anclaPedida)return;
if(Math.abs(pedida.getBoundingClientRect().top)> window.innerHeight*.75)return;
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
});;
(function(){
'use strict';
var visor=document.getElementById('visorFotos');
if(!visor)return;
var PIEZAS='.tz-mosaico__pieza, .galeria-item-lb';
var navbar=document.getElementById('navbarPrincipal');
var hueco=!!(window.CSS&&CSS.supports&&CSS.supports('scrollbar-gutter','stable'));
var marco=visor.querySelector('.visor__marco');
var foto=visor.querySelector('.visor__foto');
var leyenda=visor.querySelector('.visor__leyenda');
var cuenta=visor.querySelector('.visor__cuenta');
var botonCerrar=visor.querySelector('[data-visor-cerrar]');
var botonAnt=visor.querySelector('[data-visor-ant]');
var botonSig=visor.querySelector('[data-visor-sig]');
var quietud=window.matchMedia('(prefers-reduced-motion: reduce)');
function trozo(clase,texto){
var el=document.createElement('span');
el.className=clase;
if(texto)el.textContent=texto;
return el;
}
var cuentaActual=trozo('visor__actual');
var cuentaPista=trozo('visor__pista');
var cuentaTotal=trozo('visor__total');
cuentaPista.setAttribute('aria-hidden','true');
cuenta.textContent='';
cuenta.hidden=true;
cuenta.appendChild(cuentaActual);
cuenta.appendChild(cuentaPista);
cuenta.appendChild(trozo('visor__oculto',' de '));
cuenta.appendChild(cuentaTotal);
var grupo=[];
var indice=0;
var abierto=false;
var foco=null;
var relojCierre=0;
var turno=0;
var SALIDA=420;
var TAPA=430;
function fuenteDe(pieza){
return pieza.getAttribute('data-lightbox-src')||pieza.getAttribute('href');
}
function textoDe(pieza){
var escrito=pieza.getAttribute('data-lightbox-alt');
if(escrito)return escrito;
var miniatura=pieza.querySelector('img');
return miniatura?miniatura.alt:'';
}
function grupoDe(pieza){
var lista=pieza.classList.contains('tz-mosaico__pieza')
?pieza.parentNode.querySelectorAll('.tz-mosaico__pieza')
:document.querySelectorAll('.galeria-item-lb');
return Array.prototype.filter.call(lista,function(el){
return el===pieza||el.getClientRects().length > 0;
});
}
function dos(n){return(n < 10?'0':'')+ n;}
function precargar(fuente,listo){
var imagen=new Image();
var hecho=false;
function fin(){
if(hecho)return;
hecho=true;
listo();
}
imagen.onload=imagen.onerror=fin;
imagen.src=fuente;
if(imagen.complete)fin();
setTimeout(fin,1600);
}
function escribir(){
var pieza=grupo[indice];
var texto=textoDe(pieza);
foto.src=fuenteDe(pieza);
foto.alt=texto;
leyenda.textContent=texto;
cuenta.hidden=grupo.length < 2;
cuentaActual.textContent=dos(indice + 1);
cuentaTotal.textContent=dos(grupo.length);
cuenta.style.setProperty('--avance',((indice + 1)/ grupo.length).toFixed(4));
}
function reiniciar(el,clase){
el.classList.remove(clase);
void el.offsetWidth;
el.classList.add(clase);
}
function pintar(nuevo,primera){
var n=grupo.length;
indice=(nuevo + n)%n;
var mio=++turno;
var varias=n > 1;
botonAnt.hidden=!varias;
botonSig.hidden=!varias;
visor.classList.add('visor--cargando');
precargar(fuenteDe(grupo[indice]),function(){
if(mio !==turno)return;
visor.classList.remove('visor--cargando');
if(quietud.matches){
escribir();
marco.classList.remove('visor--oculta');
return;
}
if(primera){
marco.classList.add('visor--oculta');
escribir();
}
marco.classList.remove('visor--destapa');
reiniciar(marco,'visor--tapa');
setTimeout(function(){
if(mio !==turno)return;
if(!primera)escribir();
marco.classList.remove('visor--oculta','visor--tapa');
reiniciar(marco,'visor--destapa');
},TAPA);
});
if(varias){
[indice + 1,indice - 1].forEach(function(i){
new Image().src=fuenteDe(grupo[(i + n)%n]);
});
}
}
function medirArriba(){
visor.style.setProperty('--visor-arriba',(navbar?navbar.offsetHeight:0)+ 'px');
}
function abrir(piezas,desde){
clearTimeout(relojCierre);
grupo=piezas;
foco=document.activeElement;
esconderPuntero();
if(!abierto){
abierto=true;
var barra=hueco?0:window.innerWidth - document.documentElement.clientWidth;
document.documentElement.classList.add('visor-abierto');
if(barra > 0){
document.body.style.paddingRight=barra + 'px';
if(navbar)navbar.style.paddingRight=barra + 'px';
}
medirArriba();
visor.hidden=false;
void visor.offsetWidth;
visor.classList.add('visor--abierto');
document.addEventListener('keydown',teclado);
window.addEventListener('resize',medirArriba);
}
pintar(desde,true);
botonCerrar.focus({preventScroll:true});
}
function cerrar(sinFoco){
if(!abierto)return;
abierto=false;
turno++;
visor.classList.remove('visor--abierto');
document.removeEventListener('keydown',teclado);
window.removeEventListener('resize',medirArriba);
relojCierre=setTimeout(function(){
visor.hidden=true;
marco.classList.remove('visor--tapa','visor--destapa','visor--oculta');
foto.removeAttribute('src');
leyenda.textContent='';
cuenta.hidden=true;
document.documentElement.classList.remove('visor-abierto');
document.body.style.paddingRight='';
if(navbar)navbar.style.paddingRight='';
if(!sinFoco&&foco&&foco.focus)foco.focus({preventScroll:true});
},SALIDA);
}
function teclado(ev){
if(ev.key==='Escape'){ev.preventDefault();cerrar();return;}
if(ev.key==='ArrowRight'&&grupo.length > 1){ev.preventDefault();pintar(indice + 1);return;}
if(ev.key==='ArrowLeft'&&grupo.length > 1){ev.preventDefault();pintar(indice - 1);return;}
if(ev.key !=='Tab')return;
var botones=[botonCerrar,botonAnt,botonSig].filter(function(b){return !b.hidden;});
var i=botones.indexOf(document.activeElement);
ev.preventDefault();
var siguiente=ev.shiftKey?i - 1:i + 1;
botones[(siguiente + botones.length)%botones.length].focus();
}
document.addEventListener('click',function(ev){
var pieza=ev.target.closest&&ev.target.closest(PIEZAS);
if(!pieza)return;
var esEnlace=pieza.classList.contains('tz-mosaico__pieza');
if(esEnlace&&(ev.button !==0||ev.ctrlKey||ev.metaKey||ev.shiftKey))return;
ev.preventDefault();
var piezas=grupoDe(pieza);
abrir(piezas,Math.max(0,piezas.indexOf(pieza)));
});
botonCerrar.addEventListener('click',function(){cerrar();});
if(navbar){
navbar.addEventListener('click',function(){if(abierto)cerrar(true);},true);
}
botonAnt.addEventListener('click',function(){pintar(indice - 1);});
botonSig.addEventListener('click',function(){pintar(indice + 1);});
visor.addEventListener('click',function(ev){
var t=ev.target;
if(t===visor||t.hasAttribute('data-visor-fondo')||t.classList.contains('visor__escena')){
cerrar();
}
});
var inicioX=0;
var inicioY=0;
marco.addEventListener('pointerdown',function(ev){
inicioX=ev.clientX;
inicioY=ev.clientY;
});
marco.addEventListener('pointerup',function(ev){
var dx=ev.clientX - inicioX;
var dy=ev.clientY - inicioY;
if(grupo.length < 2||Math.abs(dx)< 50||Math.abs(dx)< Math.abs(dy)*1.5)return;
pintar(dx < 0?indice + 1:indice - 1);
});
var puntero=null;
var dentro=false;
var ratonX=0;
var ratonY=0;
var punteroX=0;
var punteroY=0;
var relojPuntero=0;
function esconderPuntero(){
if(!puntero||!dentro)return;
dentro=false;
puntero.classList.remove('tz-puntero--visible','tz-puntero--pulsa');
}
function seguir(){
relojPuntero=0;
var paso=quietud.matches?1:0.3;
punteroX +=(ratonX - punteroX)*paso;
punteroY +=(ratonY - punteroY)*paso;
puntero.style.transform='translate3d(' + punteroX.toFixed(1)+ 'px,' + punteroY.toFixed(1)+ 'px,0)';
if(Math.abs(ratonX - punteroX)> 0.3||Math.abs(ratonY - punteroY)> 0.3){
relojPuntero=requestAnimationFrame(seguir);
}
}
function revisar(debajo){
var pieza=debajo&&debajo.closest&&debajo.closest(PIEZAS);
if(!pieza||abierto){esconderPuntero();return;}
if(!dentro){
dentro=true;
punteroX=ratonX;
punteroY=ratonY;
puntero.classList.add('tz-puntero--visible');
}
if(!relojPuntero)relojPuntero=requestAnimationFrame(seguir);
}
if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
puntero=document.createElement('span');
puntero.className='tz-puntero';
puntero.setAttribute('aria-hidden','true');
var caja=trozo('tz-puntero__caja');
caja.appendChild(trozo('tz-puntero__txt','Ver'));
puntero.appendChild(caja);
document.body.appendChild(puntero);
document.documentElement.classList.add('con-puntero');
document.addEventListener('pointermove',function(ev){
if(ev.pointerType !=='mouse')return;
ratonX=ev.clientX;
ratonY=ev.clientY;
revisar(ev.target);
},{passive:true});
var relojScroll=0;
window.addEventListener('scroll',function(){
if(!dentro||relojScroll)return;
relojScroll=requestAnimationFrame(function(){
relojScroll=0;
revisar(document.elementFromPoint(ratonX,ratonY));
});
},{passive:true});
document.documentElement.addEventListener('mouseleave',esconderPuntero);
document.addEventListener('pointerdown',function(){
if(dentro)puntero.classList.add('tz-puntero--pulsa');
});
document.addEventListener('pointerup',function(){
if(puntero)puntero.classList.remove('tz-puntero--pulsa');
});
}
})();;
(function(){
'use strict';
var secciones=Array.prototype.slice.call(document.querySelectorAll('[data-pantalla]'));
if(secciones.length < 2||typeof SmilersScroll==='undefined')return;
var quietud=window.matchMedia('(prefers-reduced-motion: reduce)');
var cabe=window.matchMedia('(min-width: 768px) and (min-height: 520px)');
var barraGuardada=0;
function alturaBarra(){
if(!barraGuardada){
barraGuardada=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-navbar'))||62;
}
return barraGuardada;
}
function propio(seccion,que){
var gancho=seccion.smilersRiel&&seccion.smilersRiel[que];
var valor=gancho?gancho():null;
return typeof valor==='number'&&isFinite(valor)?valor:null;
}
function destinoDe(seccion,barra){
var suyo=propio(seccion,'destino');
if(suyo !==null)return Math.max(0,Math.round(suyo));
var arriba=seccion.getBoundingClientRect().top + window.scrollY;
if(Math.abs(seccion.offsetHeight - SmilersScroll.alto())< 2)return Math.max(0,Math.round(arriba));
return Math.max(0,Math.round(arriba - barra));
}
var nav=document.createElement('nav');
nav.className='ns-riel-nav ns-riel-nav--oculto';
nav.setAttribute('aria-label','Secciones de la página');
var lista=document.createElement('ul');
lista.className='ns-riel';
var botones=secciones.map(function(seccion){
var fila=document.createElement('li');
var boton=document.createElement('button');
boton.type='button';
boton.className='ns-riel__boton';
if(seccion.hasAttribute('data-pantalla-menor'))boton.classList.add('ns-riel__boton--menor');
boton.dataset.nombre=seccion.dataset.pantalla;
boton.setAttribute('aria-label','Ir a ' + seccion.dataset.pantalla);
boton.addEventListener('click',function(){
var destino=destinoDe(seccion,alturaBarra());
var salto=Math.abs(destino - window.scrollY);
if(!quietud.matches){
SmilersScroll.deslizarA(destino,Math.min(1300,Math.max(600,420 + salto*0.08)));
}else{
window.scrollTo(0,destino);
}
});
fila.appendChild(boton);
lista.appendChild(fila);
return boton;
});
nav.appendChild(lista);
document.body.appendChild(nav);
var activo=-2;
var pintado=-2;
function leer(ctx){
if(!cabe.matches)return;
var barra=alturaBarra();
var mejor=-1;
for(var i=0;i < secciones.length;i++){
var desde=propio(secciones[i],'desde');
if(desde===null)desde=destinoDe(secciones[i],barra)- ctx.alto*0.45;
if(ctx.y >=desde)mejor=i;
}
if(ctx.y + window.innerHeight >=document.documentElement.scrollHeight - 2)mejor=secciones.length - 1;
activo=mejor;
}
function escribir(){
if(activo===pintado)return;
pintado=activo;
nav.classList.toggle('ns-riel-nav--oculto',activo < 0);
botones.forEach(function(boton,i){
var es=i===activo;
boton.classList.toggle('ns-riel__boton--activo',es);
if(es)boton.setAttribute('aria-current','true');
else boton.removeAttribute('aria-current');
});
}
SmilersScroll.registrar(leer,escribir,function(){pintado=-2;barraGuardada=0;});
SmilersScroll.pedir();
var alCambiar=function(){pintado=-2;barraGuardada=0;SmilersScroll.pedir();};
if(cabe.addEventListener)cabe.addEventListener('change',alCambiar);
else if(cabe.addListener)cabe.addListener(alCambiar);
window.addEventListener('load',alCambiar);
})();;
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
setTimeout(una,conCortina?3000:400);
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
