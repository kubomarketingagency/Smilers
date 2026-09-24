(function () {
  'use strict';

  var V3 = {
    crear: function () { return new Float32Array(3); },
    de: function (x, y, z) { var o = new Float32Array(3); o[0] = x; o[1] = y; o[2] = z; return o; },
    copiar: function (o, a) { o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; return o; },
    negar: function (o, a) { o[0] = -a[0]; o[1] = -a[1]; o[2] = -a[2]; return o; },
    escalar: function (o, a, s) { o[0] = a[0] * s; o[1] = a[1] * s; o[2] = a[2] * s; return o; },
    punto: function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
    cruz: function (o, a, b) {
      var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2];
      o[0] = ay * bz - az * by;
      o[1] = az * bx - ax * bz;
      o[2] = ax * by - ay * bx;
      return o;
    },
    normalizar: function (o, a) {
      var l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
      if (l > 0) { o[0] = a[0] / l; o[1] = a[1] / l; o[2] = a[2] / l; }
      else { o[0] = 0; o[1] = 0; o[2] = 0; }
      return o;
    },

    porCuaternion: function (o, a, q) {
      var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
      var x = a[0], y = a[1], z = a[2];
      var uvx = qy * z - qz * y, uvy = qz * x - qx * z, uvz = qx * y - qy * x;
      var uuvx = qy * uvz - qz * uvy, uuvy = qz * uvx - qx * uvz, uuvz = qx * uvy - qy * uvx;
      o[0] = x + 2 * (uvx * qw + uuvx);
      o[1] = y + 2 * (uvy * qw + uuvy);
      o[2] = z + 2 * (uvz * qw + uuvz);
      return o;
    }
  };

  var Q = {
    crear: function () { var o = new Float32Array(4); o[3] = 1; return o; },
    copiar: function (o, a) { o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; o[3] = a[3]; return o; },
    conjugar: function (o, a) { o[0] = -a[0]; o[1] = -a[1]; o[2] = -a[2]; o[3] = a[3]; return o; },
    ejeAngulo: function (o, eje, rad) {
      var s = Math.sin(rad * 0.5);
      o[0] = eje[0] * s; o[1] = eje[1] * s; o[2] = eje[2] * s; o[3] = Math.cos(rad * 0.5);
      return o;
    },
    multiplicar: function (o, a, b) {
      var ax = a[0], ay = a[1], az = a[2], aw = a[3];
      var bx = b[0], by = b[1], bz = b[2], bw = b[3];
      o[0] = ax * bw + aw * bx + ay * bz - az * by;
      o[1] = ay * bw + aw * by + az * bx - ax * bz;
      o[2] = az * bw + aw * bz + ax * by - ay * bx;
      o[3] = aw * bw - ax * bx - ay * by - az * bz;
      return o;
    },
    normalizar: function (o, a) {
      var l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
      if (l > 0) { o[0] = a[0] / l; o[1] = a[1] / l; o[2] = a[2] / l; o[3] = a[3] / l; }
      else { o[0] = 0; o[1] = 0; o[2] = 0; o[3] = 1; }
      return o;
    },
    slerp: function (o, a, b, t) {
      var ax = a[0], ay = a[1], az = a[2], aw = a[3];
      var bx = b[0], by = b[1], bz = b[2], bw = b[3];
      var coseno = ax * bx + ay * by + az * bz + aw * bw;
      if (coseno < 0) { coseno = -coseno; bx = -bx; by = -by; bz = -bz; bw = -bw; }
      var escalaA, escalaB;
      if (1 - coseno > 0.000001) {
        var omega = Math.acos(coseno);
        var seno = Math.sin(omega);
        escalaA = Math.sin((1 - t) * omega) / seno;
        escalaB = Math.sin(t * omega) / seno;
      } else {
        escalaA = 1 - t;
        escalaB = t;
      }
      o[0] = escalaA * ax + escalaB * bx;
      o[1] = escalaA * ay + escalaB * by;
      o[2] = escalaA * az + escalaB * bz;
      o[3] = escalaA * aw + escalaB * bw;
      return o;
    },

    entreVectores: function (o, a, b) {
      var eje = V3.cruz(V3.crear(), a, b);
      var largo = Math.sqrt(eje[0] * eje[0] + eje[1] * eje[1] + eje[2] * eje[2]);
      var d = Math.min(1, Math.max(-1, V3.punto(a, b)));
      if (largo < 0.000001) {

        if (d > 0) { o[0] = 0; o[1] = 0; o[2] = 0; o[3] = 1; return o; }
        var perp = Math.abs(a[0]) < 0.9 ? V3.de(1, 0, 0) : V3.de(0, 1, 0);
        V3.normalizar(eje, V3.cruz(eje, a, perp));
        return Q.ejeAngulo(o, eje, Math.PI);
      }
      V3.normalizar(eje, eje);
      return Q.ejeAngulo(o, eje, Math.acos(d));
    }
  };

  var M4 = {
    crear: function () {
      var o = new Float32Array(16);
      o[0] = 1; o[5] = 1; o[10] = 1; o[15] = 1;
      return o;
    },
    copiar: function (o, a) { o.set(a); return o; },

    /* Las mismas matrices que desdeTraslacion y desdeEscala, escritas sobre
       una que ya existe: el bucle de cada fotograma no crea ninguna. */
    identidad: function (o) {
      o.fill(0);
      o[0] = 1; o[5] = 1; o[10] = 1; o[15] = 1;
      return o;
    },
    traslacion: function (o, x, y, z) {
      M4.identidad(o);
      o[12] = x; o[13] = y; o[14] = z;
      return o;
    },
    escala: function (o, s) {
      M4.identidad(o);
      o[0] = s; o[5] = s; o[10] = s;
      return o;
    },
    multiplicar: function (o, a, b) {
      var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      for (var i = 0; i < 4; i++) {
        var b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
        o[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        o[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        o[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        o[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      }
      return o;
    },
    desdeTraslacion: function (o, v) {
      var m = M4.crear();
      m[12] = v[0]; m[13] = v[1]; m[14] = v[2];
      o.set(m);
      return o;
    },
    desdeEscala: function (o, s) {
      var m = M4.crear();
      m[0] = s; m[5] = s; m[10] = s;
      o.set(m);
      return o;
    },

    apuntarA: function (o, ojo, objetivo, arriba) {
      var z0 = ojo[0] - objetivo[0], z1 = ojo[1] - objetivo[1], z2 = ojo[2] - objetivo[2];
      var l = z0 * z0 + z1 * z1 + z2 * z2;
      if (l > 0) { l = 1 / Math.sqrt(l); z0 *= l; z1 *= l; z2 *= l; }
      var x0 = arriba[1] * z2 - arriba[2] * z1;
      var x1 = arriba[2] * z0 - arriba[0] * z2;
      var x2 = arriba[0] * z1 - arriba[1] * z0;
      l = x0 * x0 + x1 * x1 + x2 * x2;
      if (l > 0) { l = 1 / Math.sqrt(l); x0 *= l; x1 *= l; x2 *= l; }
      o[0] = x0; o[1] = x1; o[2] = x2; o[3] = 0;
      o[4] = z1 * x2 - z2 * x1; o[5] = z2 * x0 - z0 * x2; o[6] = z0 * x1 - z1 * x0; o[7] = 0;
      o[8] = z0; o[9] = z1; o[10] = z2; o[11] = 0;
      o[12] = ojo[0]; o[13] = ojo[1]; o[14] = ojo[2]; o[15] = 1;
      return o;
    },
    perspectiva: function (o, fovy, aspecto, cerca, lejos) {
      var f = 1 / Math.tan(fovy / 2);
      var nf = 1 / (cerca - lejos);
      o[0] = f / aspecto; o[1] = 0; o[2] = 0; o[3] = 0;
      o[4] = 0; o[5] = f; o[6] = 0; o[7] = 0;
      o[8] = 0; o[9] = 0; o[10] = (lejos + cerca) * nf; o[11] = -1;
      o[12] = 0; o[13] = 0; o[14] = 2 * lejos * cerca * nf; o[15] = 0;
      return o;
    },
    invertir: function (o, a) {
      var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      var b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10;
      var b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
      var b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
      var b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
      var b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31;
      var b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
      var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) return null;
      det = 1 / det;
      o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return o;
    }
  };

  /* La cara de cada testimonio: un disco en el plano XY, centrado en el
     origen, armado como un abanico desde el centro. Las uv mapean el
     cuadrado que lo envuelve a 0..1, asi que la celda del atlas es cuadrada
     y el disco ensena su circulo inscrito.

     Hubo en medio una version con tarjetas verticales de 9:16, que era lo que
     pedia un video vertical entero. Pero un video no tiene por que entrar
     entero: dentro del circulo cabe mas ancho de lo que el circulo mide, y
     entonces lo que se ve es la cara —y lo que YouTube dibuja en los cantos
     se queda fuera—. Ver `.tst-video__medio` en el 13. */
  function geometriaDisco(pasos, radio) {
    var vertices = [0, 0, 0];
    var uvs = [0.5, 0.5];
    var indices = [];
    for (var i = 0; i < pasos; i++) {
      var alfa = (2 * Math.PI * i) / pasos;
      var x = Math.cos(alfa), y = Math.sin(alfa);
      vertices.push(radio * x, radio * y, 0);
      uvs.push(x * 0.5 + 0.5, y * 0.5 + 0.5);
      if (i > 0) indices.push(0, i, i + 1);
    }
    indices.push(0, pasos, 1);
    return {
      vertices: new Float32Array(vertices),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  function posicionesEsfera(subdivisiones, radio) {
    var t = (Math.sqrt(5) + 1) / 2;
    var vs = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    var caras = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    for (var d = 0; d < subdivisiones; d++) {
      var cache = {};
      var nuevas = [];

      var medio = function (a, b) {
        var clave = a < b ? a + '_' + b : b + '_' + a;
        if (cache[clave] !== undefined) return cache[clave];
        var pa = vs[a], pb = vs[b];
        vs.push([(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2]);
        cache[clave] = vs.length - 1;
        return cache[clave];
      };

      for (var c = 0; c < caras.length; c++) {
        var f = caras[c];
        var ab = medio(f[0], f[1]), bc = medio(f[1], f[2]), ca = medio(f[2], f[0]);
        nuevas.push([f[0], ab, ca], [f[1], bc, ab], [f[2], ca, bc], [ab, bc, ca]);
      }
      caras = nuevas;
    }

    return vs.map(function (v) {
      var p = V3.normalizar(V3.crear(), V3.de(v[0], v[1], v[2]));
      return V3.escalar(p, p, radio);
    });
  }

  function crearShader(gl, tipo, fuente) {
    var sh = gl.createShader(tipo);
    gl.shaderSource(sh, fuente);
    gl.compileShader(sh);
    if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }

  function crearPrograma(gl, fuenteVert, fuenteFrag, ubicacionesAtributo) {
    var prog = gl.createProgram();
    var vs = crearShader(gl, gl.VERTEX_SHADER, fuenteVert);
    var fs = crearShader(gl, gl.FRAGMENT_SHADER, fuenteFrag);
    if (!vs || !fs) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    for (var atrib in ubicacionesAtributo) {
      gl.bindAttribLocation(prog, ubicacionesAtributo[atrib], atrib);
    }
    gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) return prog;
    console.error(gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }

  function crearBuffer(gl, datos, uso) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, datos, uso);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return b;
  }

  function crearTextura(gl) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]));
    return tex;
  }

  var SHADER_VERTICE = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);

    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);

        // El original hace normalize(cross(centerPos, rotationAxis)) a secas.
        // Ese producto cruz vale cero en dos casos reales: cuando el disco
        // cae justo sobre el eje de giro, y cuando el eje llega nulo. Ahi
        // normalize() da NaN y, como NaN * 0 sigue siendo NaN, la posicion
        // se contamina aunque la velocidad sea cero: un solo cuadro asi
        // manda todos los vertices a NaN y la esfera entera desaparece.
        vec3 stretch = cross(centerPos, rotationAxis);
        float stretchLen = length(stretch);
        if (stretchLen > 1e-6) {
            vec3 stretchDir = stretch / stretchLen;
            vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
            float strength = dot(stretchDir, relativeVertexPos);
            float invAbsStrength = min(0., abs(strength) - 1.);
            strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
            worldPosition.xyz += stretchDir * strength;
        }
    }

    worldPosition.xyz = radius * normalize(worldPosition.xyz);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

  var SHADER_FRAGMENTO = `#version 300 es
precision highp float;

uniform sampler2D uTexFoto;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    // Margen de medio texel: sin esto el filtrado lineal chupa el píxel de
    // la celda vecina y aparece un borde de otra foto en el filo del disco.
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = clamp(st, 0.002, 0.998);
    st = st * cellSize + cellOffset;

    // A color y sin mas. Hubo aqui un blanco y negro que se revelaba en
    // color al pasar el raton -el gesto de antes/despues-, y con todos los
    // testimonios en video ya no hay nada que revelar: lo que se ve es el
    // primer fotograma de cada uno, y un fotograma en gris no anuncia un
    // video.
    vec4 foto = texture(uTexFoto, st);
    outColor = vec4(foto.rgb, foto.a * vAlpha);
}
`;

  var RADIO_ESFERA = 2;
  /* Lo que mide un disco frente al radio de la esfera. Lo usan el bucle que
     coloca las instancias y medidaDisco(), que tiene que dar la misma medida
     que se ve. */
  var ESC_DISCO = 0.25;
  /* El radio del disco en unidades de geometria. Por ESC_DISCO son 0,325 de
     radio en el mundo, y eso es cuatro quintos del alto del lienzo. Fue 1
     —dos tercios— y luego 1,2, y ha ido subiendo a peticion de la clinica;
     mas arriba empieza a pisar el rotulo de la seccion, que cuelga siempre a
     la misma altura y en una pantalla baja es lo primero que se toca. */
  var DISCO_RADIO = 1.3;
  /* Cuanto mas ancho que el circulo va el video dentro, y a que altura del
     fotograma cae la cara de quien habla. Son las mismas dos cifras que el
     CSS (`--tst-zoom` y `--tst-foco` en el 13): con ellas recorta el atlas la
     foto del disco, de modo que el disco y el video que se pone encima
     ensenan lo mismo y el relevo entre uno y otro no se nota. Si se cambia
     una hay que cambiarla en los dos sitios. */
  /* El encuadre de un testimonio: cuanto se acerca el circulo (`zoom`) y en
     que punto del fotograma se centra (`foco` a lo alto, `eje` a lo ancho,
     los dos en tanto por uno). Son los valores por defecto; cada testimonio
     trae los suyos en el HTML, porque cada uno se grabo a su manera —uno
     esta de pie en el centro, otro sentado abajo, otro se acerca a la
     camara— y con un encuadre unico habia caras que salian fuera del disco.

     Lo que el zoom deja ver es `1/zoom` del ancho del fotograma, asi que el
     eje no puede salirse de [1/(2z), 1 - 1/(2z)]: mas alla, el video no
     llegaria a cubrir el circulo. Se recorta aqui y tambien en el CSS. */
  var ZOOM_VIDEO = 1.5;
  var FOCO_VIDEO = 0.375;
  var EJE_VIDEO = 0.5;

  function acotarEje(eje, zoom) {
    var borde = 0.5 / zoom;
    return Math.max(borde, Math.min(1 - borde, eje));
  }
  var DURACION_CUADRO = 1000 / 60;

  function EsferaTestimonios(lienzo, items, opciones) {
    opciones = opciones || {};
    this.lienzo = lienzo;
    this.items = items;
    this.escala = opciones.escala || 3.2;

    this.encuadre = opciones.encuadre || 0.35;

    this.gl = lienzo.getContext('webgl2', { antialias: true, alpha: true });
    if (!this.gl) throw new Error('Sin WebGL 2');

    this.tiempo = 0;
    this.corriendo = false;
    this.solicitud = 0;

    this.orientacion = Q.crear();
    this.objetivoOrientacion = Q.crear();
    this.ejeRotacion = V3.de(1, 0, 0);
    this.velocidadRotacion = 0;
    this._velocidadSuave = 0;
    this._orientacionPrevia = Q.crear();

    this.posicion = 0;
    this.activo = 0;

    this.camara = {
      matriz: M4.crear(),
      vista: M4.crear(),
      proyeccion: M4.crear(),
      z: 3 * this.escala,
      fov: Math.PI / 4,
      cerca: 0.1,
      lejos: 40
    };

    /* Piezas de trabajo que el bucle reutiliza en cada fotograma. Antes cada
       fotograma creaba unas trescientas matrices y vectores nuevos, y en un
       telefono el recolector de basura se notaba como tirones. */
    this._dormida = false;
    this._q1 = Q.crear();
    this._q2 = Q.crear();
    this._p = V3.crear();
    this._m = M4.crear();
    this._tmp = M4.crear();
    this._ojo = V3.crear();
    this._origen = V3.de(0, 0, 0);
    this._arribaY = V3.de(0, 1, 0);
    this._arribaX = V3.de(1, 0, 0);

    this._iniciar();
  }

  EsferaTestimonios.prototype._iniciar = function () {
    var gl = this.gl;

    this.programa = crearPrograma(gl, SHADER_VERTICE, SHADER_FRAGMENTO, {
      aModelPosition: 0,
      aModelUvs: 2,
      aInstanceMatrix: 3
    });
    if (!this.programa) throw new Error('No compiló el shader');

    this.u = {
      mundo: gl.getUniformLocation(this.programa, 'uWorldMatrix'),
      vista: gl.getUniformLocation(this.programa, 'uViewMatrix'),
      proyeccion: gl.getUniformLocation(this.programa, 'uProjectionMatrix'),
      giro: gl.getUniformLocation(this.programa, 'uRotationAxisVelocity'),
      cantidad: gl.getUniformLocation(this.programa, 'uItemCount'),
      atlas: gl.getUniformLocation(this.programa, 'uAtlasSize'),
      texFoto: gl.getUniformLocation(this.programa, 'uTexFoto')
    };

    var a = {
      pos: gl.getAttribLocation(this.programa, 'aModelPosition'),
      uv: gl.getAttribLocation(this.programa, 'aModelUvs'),
      inst: gl.getAttribLocation(this.programa, 'aInstanceMatrix')
    };

    this.disco = geometriaDisco(64, DISCO_RADIO);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    var bufPos = crearBuffer(gl, this.disco.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufPos);
    gl.enableVertexAttribArray(a.pos);
    gl.vertexAttribPointer(a.pos, 3, gl.FLOAT, false, 0, 0);

    var bufUv = crearBuffer(gl, this.disco.uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufUv);
    gl.enableVertexAttribArray(a.uv);
    gl.vertexAttribPointer(a.uv, 2, gl.FLOAT, false, 0, 0);

    var bufIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.disco.indices, gl.STATIC_DRAW);

    this.posicionesInstancia = posicionesEsfera(1, RADIO_ESFERA);
    this.cantidadInstancias = this.posicionesInstancia.length;

    this.matricesArray = new Float32Array(this.cantidadInstancias * 16);
    this.matrices = [];
    for (var i = 0; i < this.cantidadInstancias; i++) {
      var vista = new Float32Array(this.matricesArray.buffer, i * 16 * 4, 16);
      vista.set(M4.crear());
      this.matrices.push(vista);
    }

    this.bufferInstancias = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferInstancias);
    gl.bufferData(gl.ARRAY_BUFFER, this.matricesArray.byteLength, gl.DYNAMIC_DRAW);
    for (var j = 0; j < 4; j++) {
      var loc = a.inst + j;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, j * 16);
      gl.vertexAttribDivisor(loc, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    this.matrizMundo = M4.crear();
    this._construirRuta();
    this._cargarAtlas();
    this._actualizarCamara();
    this.redimensionar();
  };

  EsferaTestimonios.prototype._construirRuta = function () {
    var n = this.items.length;
    var frente = V3.de(0, 0, -1);
    var COS_OBJETIVO = Math.cos(70 * Math.PI / 180);

    var direcciones = this.posicionesInstancia.map(function (p) {
      return V3.normalizar(V3.crear(), p);
    });

    var orientacion = Q.crear();
    this.ruta = [];
    this.orientaciones = [];

    for (var i = 0; i < n; i++) {
      var mejor = -1, mejorPuntaje = Infinity;
      for (var v = 0; v < direcciones.length; v++) {
        if (v % n !== i) continue;
        var d = V3.porCuaternion(V3.crear(), direcciones[v], orientacion);
        var coseno = V3.punto(d, frente);

        var puntaje = (i === 0) ? -coseno : Math.abs(coseno - COS_OBJETIVO);
        if (puntaje < mejorPuntaje) { mejorPuntaje = puntaje; mejor = v; }
      }

      var actual = V3.porCuaternion(V3.crear(), direcciones[mejor], orientacion);
      var giro = Q.entreVectores(Q.crear(), actual, frente);
      orientacion = Q.normalizar(Q.crear(), Q.multiplicar(Q.crear(), giro, orientacion));

      this.ruta.push(mejor);
      this.orientaciones.push(Q.copiar(Q.crear(), orientacion));
    }

    Q.copiar(this.orientacion, this.orientaciones[0]);
    Q.copiar(this.objetivoOrientacion, this.orientaciones[0]);
    Q.copiar(this._orientacionPrevia, this.orientaciones[0]);
  };

  /* Un solo atlas y con las celdas cuadradas, que es lo que envuelve al
     disco. Eran dos -el antes y el despues- y con eso se bajaba cada foto dos
     veces; ahora hay una sola imagen por testimonio, que es el fotograma de
     su video. */
  EsferaTestimonios.prototype._cargarAtlas = function () {
    var gl = this.gl;
    var self = this;
    var CELDA = 512;

    this.texFoto = crearTextura(gl);
    this.tamAtlas = Math.ceil(Math.sqrt(Math.max(1, this.items.length)));

    function pintar(claveFuente, textura) {
      var lienzo2d = document.createElement('canvas');
      lienzo2d.width = self.tamAtlas * CELDA;
      lienzo2d.height = self.tamAtlas * CELDA;
      var ctx = lienzo2d.getContext('2d');

      Promise.all(self.items.map(function (item) {
        return new Promise(function (resolver) {
          var img = new Image();
          img.crossOrigin = 'anonymous';
          /* Como ImageBitmap: se descodifica fuera del hilo principal y se
             queda descodificada, asi que drawImage ya no la descodifica ahi
             mismo, en medio del scroll (eran tirones de 120-140ms en un
             telefono). Se pinta en el atlas exactamente igual que antes. */
          img.onload = function () {
            if (window.createImageBitmap) {
              createImageBitmap(img).then(resolver, function () { resolver(img); });
            } else {
              resolver(img);
            }
          };
          img.onerror = function () { resolver(null); };
          img.src = item[claveFuente];
        });
      })).then(function (imagenes) {
        imagenes.forEach(function (img, i) {
          if (!img) return;
          var x = (i % self.tamAtlas) * CELDA;
          var y = Math.floor(i / self.tamAtlas) * CELDA;

          /* El mismo recorte que hace el circulo sobre el video: un cuadrado
             de lo ancho que tiene la foto partido por el zoom, puesto a la
             altura de la cara (`foco`) y en su vertical (`eje`). Asi el disco
             de la esfera y el video que se pone encima ensenan el mismo trozo
             del fotograma, y el relevo entre ellos no se ve. */
          var ficha = self.items[i] || {};
          var zoom = ficha.zoom || ZOOM_VIDEO;
          var foco = ficha.foco || FOCO_VIDEO;
          var eje = acotarEje(ficha.eje || EJE_VIDEO, zoom);
          var lado = Math.min(img.width / zoom, img.height);
          var sx = Math.max(0, Math.min(img.width - lado,
                                        img.width * eje - lado / 2));
          var sy = Math.max(0, Math.min(img.height - lado,
                                        img.height * foco - lado / 2));
          ctx.drawImage(img, sx, sy, lado, lado, x, y, CELDA, CELDA);
          if (img.close) img.close();
        });
        gl.bindTexture(gl.TEXTURE_2D, textura);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lienzo2d);
        gl.bindTexture(gl.TEXTURE_2D, null);
        self._yaPinto = false;
        self._dormida = false;
      });
    }

    pintar('foto', this.texFoto);
  };

  EsferaTestimonios.prototype.redimensionar = function () {
    var gl = this.gl;

    var topeDpr = window.innerWidth < 992 ? 1.5 : 2;
    var dpr = Math.min(topeDpr, window.devicePixelRatio || 1);
    var ancho = Math.max(1, Math.round(this.lienzo.clientWidth * dpr));
    var alto = Math.max(1, Math.round(this.lienzo.clientHeight * dpr));

    if (this.lienzo.width !== ancho || this.lienzo.height !== alto) {
      this.lienzo.width = ancho;
      this.lienzo.height = alto;
      this._yaPinto = false;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    var aspecto = this.lienzo.clientWidth / Math.max(1, this.lienzo.clientHeight);
    var altura = RADIO_ESFERA * this.encuadre;
    var zReposo = 3 * this.escala;
    this.camara.fov = aspecto > 1
      ? 2 * Math.atan(altura / zReposo)
      : 2 * Math.atan(altura / aspecto / zReposo);
    M4.perspectiva(this.camara.proyeccion, this.camara.fov, aspecto,
      this.camara.cerca, this.camara.lejos);
    this._dormida = false;
  };

/* El disco de delante, medido en pixeles de pantalla. Lo pide la escena
   para poner el video justo encima, que un iframe no se puede pintar dentro
   de WebGL y tiene que ir por fuera, del tamano exacto.

   Se calcula y no se mide a ojo, que asi no hay dos cifras que mantener: si
   manana cambia la escala, el encuadre o el radio del disco, el video cambia
   con ellos.

   La cuenta sigue lo que hace el shader. El disco se coloca con su centro a
   (1 - ESC_DISCO) * RADIO_ESFERA del origen, pero el vertice pasa despues por
   radius * normalize(...): deja de ser plano y se convierte en un casquete de
   esa misma esfera. El borde queda a un angulo atan(medida / centro) del eje,
   y de ahi salen el desvio lateral y la profundidad reales, que son los que
   hay que proyectar.

   Se escala con `clientHeight` y no con el ancho: en la perspectiva el ancho
   ya viene dividido por el aspecto, y al multiplicar por el ancho del lienzo
   el aspecto se cancela. */
  EsferaTestimonios.prototype.medidaDisco = function () {
    var centro = (1 - ESC_DISCO) * RADIO_ESFERA;
    /* La camara en reposo, no la de ahora: cuando la esfera gira se echa
       hacia atras, y el video solo se ve con la esfera parada. */
    var angulo = Math.atan((ESC_DISCO * DISCO_RADIO) / centro);
    var lateral = centro * Math.sin(angulo);
    var hondo = centro * Math.cos(angulo);
    var mitad = (3 * this.escala - hondo) * Math.tan(this.camara.fov / 2);
    if (!(mitad > 0)) return 0;
    /* `lateral / mitad` es el radio en fracciones de media pantalla, asi que
       multiplicado por el alto entero sale el diametro. */
    return (lateral / mitad) * this.lienzo.clientHeight;
  };

  EsferaTestimonios.prototype._actualizarCamara = function () {
    var ojo = this._ojo;
    ojo[0] = 0; ojo[1] = 0; ojo[2] = this.camara.z;
    M4.apuntarA(this.camara.matriz, ojo, this._origen, this._arribaY);
    M4.invertir(this.camara.vista, this.camara.matriz);
  };

  EsferaTestimonios.prototype.irA = function (posicion) {
    var nueva = Math.min(this.items.length - 1, Math.max(0, posicion));
    if (nueva !== this.posicion) this._dormida = false;
    this.posicion = nueva;
  };

  EsferaTestimonios.prototype._animar = function (delta) {
    var gl = this.gl;
    var escalaTiempo = delta / DURACION_CUADRO + 0.00001;

    var k = Math.min(this.items.length - 2, Math.floor(this.posicion));
    var f = this.posicion - k;
    if (k < 0) { k = 0; f = 0; }
    var suave = f * f * f * (f * (f * 6 - 15) + 10);
    if (this.items.length > 1) {
      Q.slerp(this.objetivoOrientacion, this.orientaciones[k], this.orientaciones[k + 1], suave);
    }

    Q.copiar(this._orientacionPrevia, this.orientacion);
    Q.slerp(this.orientacion, this.orientacion, this.objetivoOrientacion,
      Math.min(1, 0.13 * escalaTiempo));
    Q.normalizar(this.orientacion, this.orientacion);

    var deltaQ = Q.multiplicar(this._q1, this.orientacion,
      Q.conjugar(this._q2, this._orientacionPrevia));
    if (deltaQ[3] < 0) {
      deltaQ[0] = -deltaQ[0]; deltaQ[1] = -deltaQ[1];
      deltaQ[2] = -deltaQ[2]; deltaQ[3] = -deltaQ[3];
    }
    var w = Math.min(1, Math.max(-1, deltaQ[3]));
    var rad = 2 * Math.acos(w);
    var seno = Math.sqrt(Math.max(0, 1 - w * w));
    var vel = 0;
    if (seno > 0.000001) {
      vel = rad / (2 * Math.PI);

      var ex = deltaQ[0] / seno, ey = deltaQ[1] / seno, ez = deltaQ[2] / seno;
      if (Math.abs(ex) + Math.abs(ey) + Math.abs(ez) > 0.000001) {
        this.ejeRotacion[0] = ex;
        this.ejeRotacion[1] = ey;
        this.ejeRotacion[2] = ez;
      }
    }
    this._velocidadSuave += (vel - this._velocidadSuave) * Math.min(1, 0.5 * escalaTiempo);
    this.velocidadRotacion = this._velocidadSuave / escalaTiempo;

    var objetivoZ = 3 * this.escala + Math.min(3, this.velocidadRotacion * 90);
    this.camara.z += (objetivoZ - this.camara.z) / (5 / escalaTiempo);
    this._actualizarCamara();

    var arribaY = this._arribaY;
    var arribaX = this._arribaX;
    var origen = this._origen;
    var INTENSIDAD = 0.6;
    var p = this._p;
    var m = this._m;
    var tmp = this._tmp;

    for (var i = 0; i < this.cantidadInstancias; i++) {
      V3.porCuaternion(p, this.posicionesInstancia[i], this.orientacion);

      var s = (Math.abs(p[2]) / RADIO_ESFERA) * INTENSIDAD + (1 - INTENSIDAD);
      var escFinal = s * ESC_DISCO;

      var largo = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) || 1;
      var arriba = Math.abs(p[1] / largo) > 0.995 ? arribaX : arribaY;

      M4.identidad(m);
      M4.multiplicar(m, m, M4.traslacion(tmp, -p[0], -p[1], -p[2]));
      M4.multiplicar(m, m, M4.apuntarA(tmp, origen, p, arriba));
      M4.multiplicar(m, m, M4.escala(tmp, escFinal));
      M4.multiplicar(m, m, M4.traslacion(tmp, 0, 0, -RADIO_ESFERA));
      M4.copiar(this.matrices[i], m);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferInstancias);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.matricesArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.activo = Math.round(this.posicion);

    var quieta =
      Math.abs(this.velocidadRotacion) < 0.00025 &&
      Math.abs(this.camara.z - (3 * this.escala)) < 0.004;

    this.necesitaPintar = !quieta;
  };

  EsferaTestimonios.prototype._pintar = function () {
    var gl = this.gl;
    gl.useProgram(this.programa);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(this.u.mundo, false, this.matrizMundo);
    gl.uniformMatrix4fv(this.u.vista, false, this.camara.vista);
    gl.uniformMatrix4fv(this.u.proyeccion, false, this.camara.proyeccion);
    gl.uniform4f(this.u.giro,
      this.ejeRotacion[0], this.ejeRotacion[1], this.ejeRotacion[2],
      this.velocidadRotacion * 1.1);
    gl.uniform1i(this.u.cantidad, this.items.length);
    gl.uniform1i(this.u.atlas, this.tamAtlas);

    gl.uniform1i(this.u.texFoto, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texFoto);

    gl.bindVertexArray(this.vao);
    gl.drawElementsInstanced(gl.TRIANGLES, this.disco.indices.length,
      gl.UNSIGNED_SHORT, 0, this.cantidadInstancias);
    gl.bindVertexArray(null);
  };

  EsferaTestimonios.prototype.arrancar = function () {
    if (this.corriendo) return;
    this.corriendo = true;
    this.tiempo = 0;
    this._yaPinto = false;
    this._dormida = false;
    var self = this;
    var paso = function (t) {
      if (!self.corriendo) return;
      var delta = self.tiempo ? Math.min(32, t - self.tiempo) : DURACION_CUADRO;
      self.tiempo = t;
      if (!self._dormida) {
        self._animar(delta);
        if (self.necesitaPintar || !self._yaPinto) {
          self._pintar();
          self._yaPinto = true;
        } else {
          /* Quieta y ya pintada: la imagen no va a cambiar hasta que algo la
             mueva (irA, redimensionar o el atlas cuando llega), y cada
             uno de esos la despierta. Mientras, no se calcula nada. */
          self._dormida = true;
        }
      }
      self.solicitud = requestAnimationFrame(paso);
    };
    this.solicitud = requestAnimationFrame(paso);
  };

  EsferaTestimonios.prototype.detener = function () {
    this.corriendo = false;
    if (this.solicitud) cancelAnimationFrame(this.solicitud);
    this.solicitud = 0;
  };

  function acotar(v) { return Math.min(1, Math.max(0, v)); }

  function iniciarSeccion(seccion) {
    var lienzo = seccion.querySelector('[data-lienzo-testimonios]');
    var panel = seccion.querySelector('[data-panel-testimonio]');
    var salidaCita = seccion.querySelector('[data-cita]');
    var salidaNombre = seccion.querySelector('[data-nombre]');
    var salidaTratamiento = seccion.querySelector('[data-tratamiento]');
    var velo = seccion.querySelector('[data-velo-testimonios]');
    var cierre = seccion.querySelector('[data-cierre-testimonios]');
    var hojas = Array.prototype.slice.call(seccion.querySelectorAll('.tc-hoja'));
    var pasos = Array.prototype.slice.call(seccion.querySelectorAll('[data-paso]'));
    var fichas = Array.prototype.slice.call(seccion.querySelectorAll('[data-testimonio]'));
    var cajaEsfera = seccion.querySelector('.testimonios-esfera');
    var marcoVideo = seccion.querySelector('[data-video-esfera]');
    var huecoVideo = marcoVideo ? marcoVideo.querySelector('[data-video-hueco]') : null;

    if (!lienzo || fichas.length < 2) return;
    if (!window.WebGL2RenderingContext) return;

    var items = fichas.map(function (ficha) {
      var cita = ficha.querySelector('blockquote');
      return {
        video: ficha.getAttribute('data-video') || '',
        foto: ficha.getAttribute('data-foto'),
        nombre: ficha.getAttribute('data-nombre') || '',
        tratamiento: ficha.getAttribute('data-tratamiento') || '',
        cita: cita ? cita.textContent.trim() : '',
        zoom: parseFloat(ficha.getAttribute('data-zoom')) || ZOOM_VIDEO,
        foco: parseFloat(ficha.getAttribute('data-foco')) || FOCO_VIDEO,
        eje: parseFloat(ficha.getAttribute('data-eje')) || EJE_VIDEO
      };
    });

    seccion.classList.add('esfera-activa');

    function escalaSegunPantalla() {
      return window.innerWidth < 992 ? 2.2 : 3.2;
    }

    /* El encuadre es la altura de escena que cabe en la camara: cuanto mas
       alta, mas campo y mas pequena sale la tarjeta. */
    function encuadreSegunPantalla() {
      return window.innerWidth < 992 ? 0.232 : 0.235;
    }

    /* La esfera —WebGL y su atlas de fotogramas— no se crea al abrir la
       pagina sino cuando la seccion queda a dos pantallas y media. Era lo
       mas caro de la portada: tres tareas largas y las fotos compitiendo
       con la de arriba, para algo que esta al final del recorrido. La
       seccion, en cambio, se monta desde el principio (su clase y su alto),
       que de eso depende donde cae todo lo que va detras. */
    var esfera = null;
    var fallida = false;
    var tActual = 0;

    function crearEsfera() {
      if (esfera || fallida) return esfera;
      try {
        esfera = new EsferaTestimonios(lienzo, items, {
          escala: escalaSegunPantalla(),
          encuadre: encuadreSegunPantalla()
        });
      } catch (e) {
        fallida = true;
        seccion.classList.remove('esfera-activa');
        return null;
      }
      esfera.irA(tActual);
      fijarDisco();
      /* La API de YouTube tarda medio segundo en llegar la primera vez, y
         ese medio segundo se veria como un hueco negro donde va el video.
         Se pide ahora, que la seccion ya esta cerca. */
      if (window.SmilersVideo) window.SmilersVideo.preparar();
      return esfera;
    }

    /* El video se monta encima del disco de delante, asi que tiene que medir
       lo mismo que el. La esfera lo calcula (medidaDisco) y aqui se escribe
       en la variable que lee el CSS. */
    function fijarDisco() {
      if (!esfera || !cajaEsfera) return;
      var lado = esfera.medidaDisco();
      if (!(lado > 0)) return;
      cajaEsfera.style.setProperty('--tst-lado', Math.round(lado) + 'px');
    }

    /* El encuadre del testimonio que toca, escrito donde lo lee el CSS. Son
       las mismas tres cifras con las que el atlas recorto su disco. */
    function encuadrar(item) {
      if (!huecoVideo || !item) return;
      huecoVideo.style.setProperty('--tst-zoom', String(item.zoom));
      huecoVideo.style.setProperty('--tst-foco', String(item.foco));
      huecoVideo.style.setProperty('--tst-eje', String(item.eje));
    }

    var videoPuesto = false;
    var videoMontado = -1;
    /* El video no arranca hasta que la seccion esta en pantalla. Sin esto
       arrancaba al abrir la pagina: la escena empieza en el primer testimonio
       y la esfera esta quieta en el desde el minuto cero, aunque falten ocho
       pantallas para llegar. Sin planificador no hay quien avise, asi que ahi
       se da por bueno. */
    var enJuego = !window.SmilersScroll;
    var ultimoIndice = -1;
    var ultimoCierre = null;
    var progresoSeccion = 0;

    var ultimaOpacidadVelo = -1;
    var ultimaOpacidadPanel = -1;

    /* Una unidad es casi 1vh de scroll (ver `vhPorUnidad`). El cierre
       (`obturador`) mide lo mismo que el telon de Nosotros antes de las
       cifras: el 8% de aquella escena, unos 39vh en escritorio y 34vh en el
       telefono. Era de 68 y pedia casi el doble de scroll para lo mismo. */
    var UNIDADES = {
      apertura:  24,
      meseta:    58,
      giro:      38,
      obturador: 39,
      cola:       1
    };

    var N = items.length;
    var TRAMOS = Math.max(1, N - 1);
    var TOTAL = UNIDADES.apertura + N * UNIDADES.meseta + TRAMOS * UNIDADES.giro
              + UNIDADES.obturador + UNIDADES.cola;

    var REPOSO_INICIO = (UNIDADES.apertura + UNIDADES.meseta / 2) / TOTAL;
    var TRAMO_GIRO    = TRAMOS * (UNIDADES.meseta + UNIDADES.giro) / TOTAL;

    var APERTURA = UNIDADES.apertura / TOTAL;

    var CIERRE_DESDE = (UNIDADES.apertura + N * UNIDADES.meseta + TRAMOS * UNIDADES.giro) / TOTAL;
    var CIERRE_HASTA = CIERRE_DESDE + UNIDADES.obturador / TOTAL;

    var MESETA = UNIDADES.meseta / (UNIDADES.meseta + UNIDADES.giro);

    function vhPorUnidad() { return window.innerWidth < 992 ? 0.861 : 1.007; }
    function fijarAlto() {
      seccion.style.setProperty('--alto-cine', (100 + Math.round(TOTAL * vhPorUnidad())) + 'vh');
    }
    fijarAlto();

    function conParadas(t) {
      var ultimo = items.length - 1;
      if (t >= ultimo) return ultimo;
      var i = Math.floor(t);
      var u = t - i;
      var margen = MESETA / 2;
      var v = acotar((u - margen) / (1 - MESETA));
      return i + v * v * (3 - 2 * v);
    }

    function leerSeccion(ctx) {
      var rect = seccion.getBoundingClientRect();
      var recorrido = seccion.offsetHeight - ctx.alto;
      progresoSeccion = recorrido > 0 ? acotar(-rect.top / recorrido) : 0;
    }

    function actualizar() {
      if (fallida) return;
      var progreso = progresoSeccion;

      var t = conParadas(acotar((progreso - REPOSO_INICIO) / TRAMO_GIRO) * (items.length - 1));
      tActual = t;
      if (esfera) esfera.irA(t);

      if (velo) {

        var opVelo = Number(acotar((APERTURA - progreso) / APERTURA).toFixed(3));
        if (opVelo !== ultimaOpacidadVelo) {
          ultimaOpacidadVelo = opVelo;
          velo.style.opacity = String(opVelo);
        }
      }

      if (hojas.length === 2) {
        /* Como las hojas de Nosotros: la misma curva y el filo solo
           mientras se mueven. */
        var c = acotar((progreso - CIERRE_DESDE) / (CIERRE_HASTA - CIERRE_DESDE));
        var suave = c * c * (3 - 2 * c);
        var fuera = ((1 - suave) * 101).toFixed(2);
        if (fuera !== ultimoCierre) {
          ultimoCierre = fuera;
          hojas[0].style.transform = 'translate3d(-' + fuera + '%,0,0)';
          hojas[1].style.transform = 'translate3d(' + fuera + '%,0,0)';

          if (cierre) cierre.style.setProperty('--filo', c > 0 && c < 1 ? '1' : '0');
        }
      }

      var indice = Math.round(t);
      var quietud = 1 - Math.min(1, Math.abs(t - indice) / 0.26);
      var suavizada = quietud * quietud * (3 - 2 * quietud);

      if (indice !== ultimoIndice) {
        ultimoIndice = indice;
        var item = items[indice];
        if (salidaCita) salidaCita.textContent = item.cita;
        if (salidaNombre) salidaNombre.textContent = item.nombre;
        if (salidaTratamiento) salidaTratamiento.textContent = item.tratamiento;
        pasos.forEach(function (paso, i) {
          paso.classList.toggle('es-activo', i === indice);

          if (i === indice) paso.setAttribute('aria-current', 'true');
          else paso.removeAttribute('aria-current');
        });
      }

      /* El video solo se monta con la esfera quieta en su testimonio:
         mientras gira, lo que hay ahi es el disco dando la vuelta, y un
         iframe encima no gira con el. Al salir se desmonta, que si no
         seguiria sonando detras de otro.

         Los dos topes no son el mismo: aparece con la esfera ya parada (0,82)
         y se va en cuanto empieza a moverse de verdad (0,50). Con un solo
         tope a media altura el circulo salia con la esfera todavia girando y
         se le veia flotar por delante, que es lo que se veia feo.

         La meseta de cada testimonio es ancha —58 unidades, que es casi media
         pantalla de scroll— y dentro de ella la esfera esta clavada, asi que
         mover un poco la rueda mientras se ve un video no lo apaga. */
      if (marcoVideo && window.SmilersVideo) {
        var quien = items[indice] && items[indice].video ? indice : -1;
        /* Dos umbrales y no uno: el video SE PIDE mucho antes de que SE VEA.
           Pedirlo cuesta —YouTube tarda de medio segundo a dos en tener el
           nuevo rodando— y, pidiendolo en el mismo momento en que aparecia el
           circulo, esa espera se veia entera, con el fotograma quieto
           delante. Ahora se pide con la esfera todavia llegando (el circulo
           sigue apagado, asi que no se ve nada) y cuando aparece ya rueda. */
        var pide = quien >= 0 && quietud > 0.3 && enJuego;
        var toca = quien >= 0 && quietud > (videoPuesto ? 0.5 : 0.82) && enJuego;
        if (pide && quien !== videoMontado) {
          encuadrar(items[quien]);
          window.SmilersVideo.poner(huecoVideo, items[quien].foto);
          window.SmilersVideo.montar(huecoVideo, items[quien].video, items[quien].nombre);
          videoMontado = quien;
        }
        if (toca !== videoPuesto) {
          videoPuesto = toca;
          seccion.classList.toggle('tst-con-video', toca);
          if (!toca) {
            window.SmilersVideo.apagar(huecoVideo);
            videoMontado = -1;
          }
        }
      }

      var op = Number(suavizada.toFixed(2));
      if (panel && op !== ultimaOpacidadPanel) {
        ultimaOpacidadPanel = op;
        panel.style.opacity = String(op);
        panel.style.transform = 'translateY(' + ((1 - op) * 26).toFixed(1) + 'px)';
      }

    }

    function yDeTestimonio(indice) {
      var recorrido = seccion.offsetHeight - (window.SmilersScroll ? window.SmilersScroll.alto() : (window.innerHeight || 1));
      var tramos = items.length - 1;
      if (recorrido <= 0 || tramos <= 0) return null;
      var progreso = REPOSO_INICIO + (acotar(indice / tramos)) * TRAMO_GIRO;
      var tope = seccion.getBoundingClientRect().top + window.scrollY;
      return Math.round(tope + progreso * recorrido);
    }

    pasos.forEach(function (paso, indice) {
      var quien = items[indice];
      if (quien && quien.nombre) {
        paso.setAttribute('aria-label', 'Ir al testimonio de ' + quien.nombre);
      }

      var yaAtendido = false;

      function irAlTestimonio() {
        var destino = yDeTestimonio(indice);
        if (destino === null) return;
        var salto = Math.abs(destino - window.scrollY);
        if (window.SmilersScroll && window.SmilersScroll.deslizarA) {

          window.SmilersScroll.deslizarA(destino, Math.min(760, 120 + salto * 0.32), true);
        } else {
          window.scrollTo({ top: destino, behavior: 'smooth' });
        }
      }

      paso.addEventListener('pointerdown', function (ev) {
        if (ev.pointerType !== 'touch') return;
        yaAtendido = true;
        irAlTestimonio();
      });

      paso.addEventListener('click', function () {
        if (yaAtendido) { yaAtendido = false; return; }
        irAlTestimonio();
      });
    });

    /* Sin iman: cada testimonio tiene su meseta (`UNIDADES.meseta`), el
       tramo en que la esfera se queda quieta en el mientras se sigue
       bajando, y eso es la pausa. Hubo un guion que, un cuarto de segundo
       despues de pararse la pagina, la arrastraba hasta el testimonio mas
       cercano: se notaba como un scroll pausado que luego arrancaba solo.
       Ver 02-base.css. */

    if (window.SmilersScroll) {
      window.SmilersScroll.registrar(leerSeccion, actualizar, function () {

        fijarAlto();
        if (!esfera) return;
        esfera.escala = escalaSegunPantalla();
        esfera.encuadre = encuadreSegunPantalla();
        esfera.redimensionar();
        fijarDisco();
      }, {

        guarda: seccion,
        alCambiarVisibilidad: function (dentro) {

          seccion.classList.toggle('tst-en-juego', dentro);
          enJuego = dentro;
          /* Al salir de pantalla si se para de verdad: dentro de la seccion
             el video sigue rodando callado entre testimonio y testimonio,
             que soltarlo de nuevo le hace ensenar el titulo a YouTube. */
          if (!dentro && window.SmilersVideo) window.SmilersVideo.parar(huecoVideo);

          var valor = dentro ? 'transform' : '';
          for (var i = 0; i < hojas.length; i++) hojas[i].style.willChange = valor;
          if (panel) panel.style.willChange = dentro ? 'opacity, transform' : '';
        }
      });
    } else {
      var tickeando = false;
      var pedirActualizacion = function () {
        if (tickeando) return;
        tickeando = true;
        requestAnimationFrame(function () {
          tickeando = false;
          leerSeccion({ alto: window.innerHeight || 1 });
          actualizar();
        });
      };
      window.addEventListener('scroll', pedirActualizacion, { passive: true });
      window.addEventListener('resize', function () {
        fijarAlto();
        if (esfera) {
          esfera.escala = escalaSegunPantalla();
          esfera.encuadre = encuadreSegunPantalla();
          esfera.redimensionar();
          fijarDisco();
        }
        pedirActualizacion();
      });
    }

    if ('IntersectionObserver' in window) {
      /* Con la seccion a dos pantallas y media: las fotos del atlas empiezan
         a bajar ya (solo red, nada de trabajo en el hilo principal) y la
         esfera se crea en cuanto el scroll se detiene. Crearla cuesta un
         fotograma entero en un telefono, y con la pagina quieta no se pierde
         ninguno. Si se llega sin parar, la crea el observador de abajo al
         entrar, como antes. */
      var pendiente = false;
      var adelantadas = [];
      var vigia = new IntersectionObserver(function (entradas) {
        if (!entradas[entradas.length - 1].isIntersecting) return;
        vigia.disconnect();
        pendiente = true;
        items.forEach(function (item) {
          [item.antes, item.despues].forEach(function (src) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = img.onerror = function () { adelantadas.splice(adelantadas.indexOf(img), 1); };
            adelantadas.push(img);
            img.src = src;
          });
        });
      }, { rootMargin: '250% 0px' });
      vigia.observe(seccion);
      if (window.SmilersScroll && window.SmilersScroll.alDetenerse) {
        window.SmilersScroll.alDetenerse(function () {
          if (pendiente) {
            pendiente = false;
            crearEsfera();
          }
          return null;
        });
      }

      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          var e = entrada.isIntersecting ? crearEsfera() : esfera;
          if (!e) return;
          if (entrada.isIntersecting) { e.redimensionar(); fijarDisco(); e.arrancar(); }
          else { e.detener(); }
        });
      }, { rootMargin: '200px 0px' }).observe(seccion);
    } else if (crearEsfera()) {
      esfera.arrancar();
    }

    leerSeccion({ alto: window.SmilersScroll ? window.SmilersScroll.alto() : (window.innerHeight || 1) });
    actualizar();
  }

  document.addEventListener('DOMContentLoaded', function () {

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-esfera-testimonios]'),
      iniciarSeccion
    );
  });

})();
