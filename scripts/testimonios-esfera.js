/* ==========================================================================
   SMILERS DENTAL CLINIQUE — TESTIMONIOS EN ESFERA (WebGL2)
   --------------------------------------------------------------------------
   Qué hace
   ---------
   Dibuja los testimonios como discos repartidos sobre una esfera (el efecto
   "InfiniteMenu" de ReactBits) y la hace GIRAR CON EL SCROLL en vez de con
   el arrastre del mouse: cada tramo de scroll dentro del pin lleva un
   testimonio distinto al frente, se detiene un momento (ahí aparece su
   texto) y sigue rodando al siguiente.

   Sobre la foto que queda al frente:
     - se ve en blanco y negro  ->  es el ANTES
     - al pasar el cursor / hacer clic  ->  funde al DESPUÉS a color

   Por qué está portado a mano
   ---------------------------
   El componente original es React + el paquete npm "gl-matrix". Este sitio
   es HTML/CSS/JS plano, sin build ni node_modules (igual que Bootstrap, que
   vive auto-hospedado en vendor/), así que:
     - el componente se reescribió como un módulo vanilla, y
     - de gl-matrix solo se incrustó abajo el puñado de funciones que se
       usan (V3 / Q / M4). Son las mismas fórmulas de la librería, nada más
       que sin la dependencia.

   Mejora respecto del original
   ----------------------------
   El demo de ReactBits deja dos discos rotos: los vértices que caen justo
   en los polos (0, ±R, 0) son paralelos al vector "arriba" [0,1,0] y su
   matriz targetTo sale degenerada (se ve un hueco). Aquí, cuando el vértice
   es casi paralelo a "arriba", se usa [1,0,0] y la esfera queda completa.

   Los datos NO viven en este archivo: se leen del <ol class="testimonios-lista">
   del HTML (data-antes / data-despues / data-nombre / data-tratamiento +
   el <blockquote>). Así esa lista sigue siendo el contenido real de la
   página — la que ven Google y los lectores de pantalla, y la que se
   muestra tal cual si no hay WebGL o si el visitante pidió menos
   movimiento.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     1. ÁLGEBRA MÍNIMA (el subconjunto de gl-matrix que se usa)
     ====================================================================== */

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
    /* Gira el vector por el cuaternión (fórmula rápida de gl-matrix:
       v + 2 * (qv x (qv x v + w*v))). */
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
      } else {                       // casi paralelos: interpolación lineal
        escalaA = 1 - t;
        escalaB = t;
      }
      o[0] = escalaA * ax + escalaB * bx;
      o[1] = escalaA * ay + escalaB * by;
      o[2] = escalaA * az + escalaB * bz;
      o[3] = escalaA * aw + escalaB * bw;
      return o;
    },
    /* Giro más corto que lleva la dirección "a" a la dirección "b"
       (ambas ya normalizadas). */
    entreVectores: function (o, a, b) {
      var eje = V3.cruz(V3.crear(), a, b);
      var largo = Math.sqrt(eje[0] * eje[0] + eje[1] * eje[1] + eje[2] * eje[2]);
      var d = Math.min(1, Math.max(-1, V3.punto(a, b)));
      if (largo < 0.000001) {
        // Paralelos (nada que girar) o antiparalelos (media vuelta por
        // cualquier eje perpendicular).
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
    /* targetTo de gl-matrix: matriz de "mirar desde ojo hacia objetivo"
       SIN invertir (es una matriz de modelo, no de vista). */
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


  /* ======================================================================
     2. GEOMETRÍAS
     ====================================================================== */

  /* Disco: un abanico de triángulos con UVs radiales (0.5,0.5 en el centro).
     Es el "portarretrato" circular de cada testimonio. */
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

  /* Icosaedro subdividido y "esferizado": sus vértices son las posiciones
     donde se planta cada disco. Con 1 subdivisión son 42 posiciones. */
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


  /* ======================================================================
     3. AYUDAS DE WebGL
     ====================================================================== */

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
    // 1 píxel transparente mientras cargan las fotos, para no ver basura.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]));
    return tex;
  }


  /* ======================================================================
     4. SHADERS
     ====================================================================== */

  /* Vértice: igual que el original. Coloca el disco de la instancia, lo
     "estira" en el sentido del giro según la velocidad de rotación (de ahí
     la sensación de goma al rodar) y lo vuelve a pegar a la esfera. */
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

  /* Fragmento: aquí vive el antes/después. Hay DOS atlas (uno con las fotos
     "antes", otro con las "después"). Todos los discos se pintan en blanco
     y negro con un temple champán (el mismo trato B/N que el hero); solo el
     disco del testimonio activo funde hacia la foto a color cuando
     uRevelado sube de 0 a 1. */
  var SHADER_FRAGMENTO = `#version 300 es
precision highp float;

uniform sampler2D uTexAntes;
uniform sampler2D uTexDespues;
uniform int uItemCount;
uniform int uAtlasSize;
uniform int uActivo;
uniform float uRevelado;

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

    vec4 antes = texture(uTexAntes, st);
    vec4 despues = texture(uTexDespues, st);

    float gris = dot(antes.rgb, vec3(0.299, 0.587, 0.114));
    vec3 blancoYNegro = vec3(gris) * vec3(1.05, 0.99, 0.87);

    float revelado = (itemIndex == uActivo) ? uRevelado : 0.0;
    vec3 color = mix(blancoYNegro, despues.rgb, revelado);

    outColor = vec4(color, antes.a * vAlpha);
}
`;


  /* ======================================================================
     5. LA ESFERA
     ====================================================================== */

  var RADIO_ESFERA = 2;
  var DURACION_CUADRO = 1000 / 60;

  function EsferaTestimonios(lienzo, items, opciones) {
    opciones = opciones || {};
    this.lienzo = lienzo;
    this.items = items;
    this.escala = opciones.escala || 3.2;
    /* Encuadre: mitad del alto visible en el plano del centro, en unidades
       de mundo. Es lo que decide de verdad qué tan grande sale el disco del
       frente — NO la escala. El fov se deriva de altura/distancia y la
       distancia es 3*escala, así que las dos se cancelan y mover la escala
       deja el encuadre en reposo igual que estaba (solo cambia la fuerza de
       la perspectiva y cuánto pesa el retroceso de cámara al girar). Cuanto
       MENOR el encuadre, más cerrado el plano y más grande el disco. */
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

    this.posicion = 0;      // posición continua sobre la ruta (0 .. n-1)
    this.activo = 0;
    this.revelado = 0;
    this.objetivoRevelado = 0;

    this.camara = {
      matriz: M4.crear(),
      vista: M4.crear(),
      proyeccion: M4.crear(),
      z: 3 * this.escala,
      fov: Math.PI / 4,
      cerca: 0.1,
      lejos: 40
    };

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
      texAntes: gl.getUniformLocation(this.programa, 'uTexAntes'),
      texDespues: gl.getUniformLocation(this.programa, 'uTexDespues'),
      cantidad: gl.getUniformLocation(this.programa, 'uItemCount'),
      atlas: gl.getUniformLocation(this.programa, 'uAtlasSize'),
      activo: gl.getUniformLocation(this.programa, 'uActivo'),
      revelado: gl.getUniformLocation(this.programa, 'uRevelado')
    };

    var a = {
      pos: gl.getAttribLocation(this.programa, 'aModelPosition'),
      uv: gl.getAttribLocation(this.programa, 'aModelUvs'),
      inst: gl.getAttribLocation(this.programa, 'aInstanceMatrix')
    };

    // --- geometría del disco ---
    this.disco = geometriaDisco(56, 1);
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

    // --- una instancia por vértice de la esfera ---
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
    for (var j = 0; j < 4; j++) {           // una mat4 = 4 ranuras de atributo
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

  /* ---- Ruta de vértices ------------------------------------------------
     El shader saca la foto de cada disco con "instancia % cantidad de
     testimonios", así que el testimonio i vive en todos los vértices cuyo
     índice deja resto i. De todos esos se elige uno por paso, buscando que
     el giro respecto del anterior ronde siempre los 70°: así cada avance de
     scroll se siente igual de largo, en vez de a veces un salto enorme y a
     veces casi nada. Para cada paso se guarda la orientación que deja ese
     vértice justo al frente.

     Nota sobre el "frente": por cómo se arma la matriz de instancia, el
     disco del vértice p termina dibujado en la dirección OPUESTA (-p). Por
     eso el vértice que mira a cámara es el que apunta a (0,0,-1) y no a
     (0,0,1) — mismo criterio que usa el original en su snapDirection. */
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
        // El primero: el que ya esté más al frente (arranque sin tirón).
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

  /* ---- Atlas de fotos --------------------------------------------------
     Las fotos van a dos texturas-mosaico (antes / después) de celdas
     cuadradas de 512 px, recortadas tipo "cover" para que ninguna cara
     salga deformada. Se dibujan en un <canvas> 2D y de ahí a la GPU. Si una
     foto falta, su celda queda transparente y el resto sigue funcionando. */
  EsferaTestimonios.prototype._cargarAtlas = function () {
    var gl = this.gl;
    var self = this;
    var CELDA = 512;

    this.texAntes = crearTextura(gl);
    this.texDespues = crearTextura(gl);
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
          img.onload = function () { resolver(img); };
          img.onerror = function () { resolver(null); };
          img.src = item[claveFuente];
        });
      })).then(function (imagenes) {
        imagenes.forEach(function (img, i) {
          if (!img) return;
          var x = (i % self.tamAtlas) * CELDA;
          var y = Math.floor(i / self.tamAtlas) * CELDA;
          /* Recorte cuadrado centrado del ORIGEN (drawImage de 9 argumentos)
             en vez de escalar la foto entera tipo "cover" hacia la celda: al
             escalarla, una foto apaisada sobresale por los lados y se mete
             en la celda vecina, y como se dibujan en orden, cada foto le
             pisaba una franja a la anterior — en el disco se colaba un
             pedazo de otro testimonio. Recortando en el origen nada se sale
             de su celda. */
          var lado = Math.min(img.width, img.height);
          var sx = (img.width - lado) / 2;
          var sy = (img.height - lado) / 2;
          ctx.drawImage(img, sx, sy, lado, lado, x, y, CELDA, CELDA);
        });
        gl.bindTexture(gl.TEXTURE_2D, textura);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lienzo2d);
        gl.bindTexture(gl.TEXTURE_2D, null);
      });
    }

    pintar('antes', this.texAntes);
    pintar('despues', this.texDespues);
  };

  EsferaTestimonios.prototype.redimensionar = function () {
    var gl = this.gl;
    /* En móvil se topa el ratio en 1.5 en vez de 2. La esfera ocupa casi
       toda la pantalla, así que a 2x en un teléfono de 3x son más del doble
       de píxeles que rellenar por cuadro; a 1.5x la foto se sigue viendo
       nítida y el shader hace la mitad del trabajo. */
    var topeDpr = window.innerWidth < 992 ? 1.5 : 2;
    var dpr = Math.min(topeDpr, window.devicePixelRatio || 1);
    var ancho = Math.max(1, Math.round(this.lienzo.clientWidth * dpr));
    var alto = Math.max(1, Math.round(this.lienzo.clientHeight * dpr));

    if (this.lienzo.width !== ancho || this.lienzo.height !== alto) {
      this.lienzo.width = ancho;
      this.lienzo.height = alto;
      this._yaPinto = false;   // el buffer se limpió: hay que volver a dibujar
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    /* Mismo encuadre que el original: el alto visible se fija en una
       fracción del radio, así el disco del frente manda en la escena y los
       vecinos apenas asoman por las esquinas. El fov se calcula con la
       distancia EN REPOSO (3 * escala) y no con la distancia actual: como
       la cámara se aleja mientras la esfera rueda, usar la distancia viva
       cambiaría el encuadre en cada resize según el momento del giro. */
    var aspecto = this.lienzo.clientWidth / Math.max(1, this.lienzo.clientHeight);
    var altura = RADIO_ESFERA * this.encuadre;
    var zReposo = 3 * this.escala;
    this.camara.fov = aspecto > 1
      ? 2 * Math.atan(altura / zReposo)
      : 2 * Math.atan(altura / aspecto / zReposo);
    M4.perspectiva(this.camara.proyeccion, this.camara.fov, aspecto,
      this.camara.cerca, this.camara.lejos);
  };

  EsferaTestimonios.prototype._actualizarCamara = function () {
    M4.apuntarA(this.camara.matriz, V3.de(0, 0, this.camara.z), V3.de(0, 0, 0), V3.de(0, 1, 0));
    M4.invertir(this.camara.vista, this.camara.matriz);
  };

  /* Posición continua sobre la ruta: 0 = primer testimonio al frente,
     n-1 = el último. La mueve el controlador de scroll. */
  EsferaTestimonios.prototype.irA = function (posicion) {
    this.posicion = Math.min(this.items.length - 1, Math.max(0, posicion));
  };

  EsferaTestimonios.prototype.revelar = function (encendido) {
    this.objetivoRevelado = encendido ? 1 : 0;
  };

  EsferaTestimonios.prototype._animar = function (delta) {
    var gl = this.gl;
    var escalaTiempo = delta / DURACION_CUADRO + 0.00001;

    /* --- orientación objetivo: slerp entre los dos pasos que rodean la
       posición actual, con una curva que "aguanta" en cada testimonio y
       hace el viaje en el tramo del medio. */
    var k = Math.min(this.items.length - 2, Math.floor(this.posicion));
    var f = this.posicion - k;
    if (k < 0) { k = 0; f = 0; }
    var suave = f * f * f * (f * (f * 6 - 15) + 10);   // smootherstep
    if (this.items.length > 1) {
      Q.slerp(this.objetivoOrientacion, this.orientaciones[k], this.orientaciones[k + 1], suave);
    }

    // --- la orientación real persigue a la objetivo (de ahí la inercia)
    Q.copiar(this._orientacionPrevia, this.orientacion);
    Q.slerp(this.orientacion, this.orientacion, this.objetivoOrientacion,
      Math.min(1, 0.13 * escalaTiempo));
    Q.normalizar(this.orientacion, this.orientacion);

    /* --- eje y velocidad de giro de este cuadro: alimentan el estirón de
       goma del shader y el retroceso de cámara. */
    var deltaQ = Q.multiplicar(Q.crear(), this.orientacion,
      Q.conjugar(Q.crear(), this._orientacionPrevia));
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
      /* El eje solo se pisa si sale de verdad unitario: los cuaterniones son
         Float32Array, y con giros diminutos deltaQ.xyz se va a cero por
         redondeo aunque "seno" (calculado en doble) todavia pase el umbral.
         Guardar ese (0,0,0) dejaba el eje nulo y apagaba la esfera. */
      var ex = deltaQ[0] / seno, ey = deltaQ[1] / seno, ez = deltaQ[2] / seno;
      if (Math.abs(ex) + Math.abs(ey) + Math.abs(ez) > 0.000001) {
        this.ejeRotacion[0] = ex;
        this.ejeRotacion[1] = ey;
        this.ejeRotacion[2] = ez;
      }
    }
    this._velocidadSuave += (vel - this._velocidadSuave) * Math.min(1, 0.5 * escalaTiempo);
    this.velocidadRotacion = this._velocidadSuave / escalaTiempo;

    // --- cámara: se aleja mientras rueda, vuelve al encuadre al frenar
    var objetivoZ = 3 * this.escala + Math.min(3, this.velocidadRotacion * 90);
    this.camara.z += (objetivoZ - this.camara.z) / (5 / escalaTiempo);
    this._actualizarCamara();

    // --- revelado del "después"
    this.revelado += (this.objetivoRevelado - this.revelado) * Math.min(1, 0.14 * escalaTiempo);

    // --- matriz de cada disco
    var arribaY = V3.de(0, 1, 0);
    var arribaX = V3.de(1, 0, 0);
    var origen = V3.de(0, 0, 0);
    var ESC_DISCO = 0.25;
    var INTENSIDAD = 0.6;

    for (var i = 0; i < this.cantidadInstancias; i++) {
      var p = V3.porCuaternion(V3.crear(), this.posicionesInstancia[i], this.orientacion);

      /* Los discos del fondo se achican y los del frente quedan a tamaño
         completo, así la esfera se lee como volumen y no como recorte. */
      var s = (Math.abs(p[2]) / RADIO_ESFERA) * INTENSIDAD + (1 - INTENSIDAD);
      var escFinal = s * ESC_DISCO;

      /* Vértices casi paralelos a "arriba" (los polos): con [0,1,0] la
         matriz sale degenerada y el disco desaparece — ese es el hueco del
         demo original. Ahí se usa [1,0,0]. */
      var largo = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) || 1;
      var arriba = Math.abs(p[1] / largo) > 0.995 ? arribaX : arribaY;

      var m = M4.crear();
      M4.multiplicar(m, m, M4.desdeTraslacion(M4.crear(), V3.negar(V3.crear(), p)));
      M4.multiplicar(m, m, M4.apuntarA(M4.crear(), origen, p, arriba));
      M4.multiplicar(m, m, M4.desdeEscala(M4.crear(), escFinal));
      M4.multiplicar(m, m, M4.desdeTraslacion(M4.crear(), V3.de(0, 0, -RADIO_ESFERA)));
      M4.copiar(this.matrices[i], m);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferInstancias);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.matricesArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.activo = Math.round(this.posicion);

    /* ¿Sigue moviéndose algo? Durante la MESETA de cada testimonio (más de
       la mitad del scroll de la sección) la esfera está quieta: la
       orientación ya alcanzó su objetivo, la cámara está en su sitio y el
       revelado no se está cruzando. Ahí no hay nada nuevo que dibujar, y
       repintar la esfera igualmente son varios cientos de miles de píxeles
       de shader por cuadro, en la sección más larga de la página. Con este
       flag el bucle sigue vivo (para reaccionar al instante) pero se salta
       el dibujado. */
    var quieta =
      Math.abs(this.velocidadRotacion) < 0.00025 &&
      Math.abs(this.camara.z - (3 * this.escala)) < 0.004 &&
      Math.abs(this.revelado - this.objetivoRevelado) < 0.002;

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
    gl.uniform1i(this.u.activo, this.activo);
    gl.uniform1f(this.u.revelado, this.revelado);

    gl.uniform1i(this.u.texAntes, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texAntes);

    gl.uniform1i(this.u.texDespues, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texDespues);

    gl.bindVertexArray(this.vao);
    gl.drawElementsInstanced(gl.TRIANGLES, this.disco.indices.length,
      gl.UNSIGNED_SHORT, 0, this.cantidadInstancias);
    gl.bindVertexArray(null);
  };

  EsferaTestimonios.prototype.arrancar = function () {
    if (this.corriendo) return;
    this.corriendo = true;
    this.tiempo = 0;
    this._yaPinto = false;   // fuerza un cuadro al volver a entrar en pantalla
    var self = this;
    var paso = function (t) {
      if (!self.corriendo) return;
      var delta = self.tiempo ? Math.min(32, t - self.tiempo) : DURACION_CUADRO;
      self.tiempo = t;
      self._animar(delta);
      if (self.necesitaPintar || !self._yaPinto) {
        self._pintar();
        self._yaPinto = true;
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


  /* ======================================================================
     6. CONTROLADOR: scroll -> esfera + textos
     ====================================================================== */

  function acotar(v) { return Math.min(1, Math.max(0, v)); }

  function iniciarSeccion(seccion) {
    var lienzo = seccion.querySelector('[data-lienzo-testimonios]');
    var boton = seccion.querySelector('[data-revelar]');
    var etiquetaEstado = seccion.querySelector('[data-estado-foto]');
    var panel = seccion.querySelector('[data-panel-testimonio]');
    var salidaCita = seccion.querySelector('[data-cita]');
    var salidaNombre = seccion.querySelector('[data-nombre]');
    var salidaTratamiento = seccion.querySelector('[data-tratamiento]');
    var velo = seccion.querySelector('[data-velo-testimonios]');
    var cierre = seccion.querySelector('[data-cierre-testimonios]');
    var hojas = Array.prototype.slice.call(seccion.querySelectorAll('.tc-hoja'));
    var pasos = Array.prototype.slice.call(seccion.querySelectorAll('[data-paso]'));
    var fichas = Array.prototype.slice.call(seccion.querySelectorAll('[data-testimonio]'));

    if (!lienzo || fichas.length < 2) return;

    /* Los datos salen de la lista del HTML: es el contenido real, no una
       copia. Si mañana se edita un testimonio ahí, la esfera lo toma solo. */
    var items = fichas.map(function (ficha) {
      var cita = ficha.querySelector('blockquote');
      return {
        antes: ficha.getAttribute('data-antes'),
        despues: ficha.getAttribute('data-despues'),
        nombre: ficha.getAttribute('data-nombre') || '',
        tratamiento: ficha.getAttribute('data-tratamiento') || '',
        cita: cita ? cita.textContent.trim() : ''
      };
    });

    /* La clase va ANTES de construir la esfera: hasta que no está puesta,
       .testimonios-escena sigue en display:none, el lienzo mide 0x0 y la
       esfera nacería con un buffer de 1x1 (y una proyección degenerada,
       porque el aspecto sale 0). Si luego falla, se quita y la sección
       vuelve a su lista de tarjetas como si nada. */
    seccion.classList.add('esfera-activa');

    /* La escala es la distancia de cámara: se queda como estaba porque no
       cambia el tamaño del disco en reposo (ver el comentario de
       this.encuadre), solo la perspectiva y el retroceso al girar. */
    function escalaSegunPantalla() {
      return window.innerWidth < 992 ? 2.2 : 3.2;
    }

    /* Lo que SÍ agranda el disco. Con el 0.35 original ocupaba ~43% del lado
       del lienzo y la foto se veía chica, sobre todo en móvil; con estos
       valores pasa a ~53% en escritorio y ~65% en móvil. Si se vuelven a
       tocar, hay que mover con ellos el ancho de .testimonios-revelar en el
       CSS, que es el botón calcado sobre ese disco. */
    function encuadreSegunPantalla() {
      return window.innerWidth < 992 ? 0.232 : 0.285;
    }

    var esfera;
    try {
      esfera = new EsferaTestimonios(lienzo, items, {
        escala: escalaSegunPantalla(),
        encuadre: encuadreSegunPantalla()
      });
    } catch (e) {
      /* Sin WebGL 2 se queda la lista de tarjetas del HTML, que ya funciona
         sola (antes/después por CSS). No hay que tocar nada más. */
      seccion.classList.remove('esfera-activa');
      return;
    }

    var revelando = false;
    var ultimoIndice = -1;
    var ultimoCierre = null;   // última posición escrita en las hojas del cierre
    var progresoSeccion = 0;   // lo mide la fase de lectura del planificador
    /* Últimos valores escritos en el panel y en el botón: ver "actualizar". */
    var ultimaOpacidadVelo = -1;
    var ultimaOpacidadPanel = -1;
    var ultimaOpacidadBoton = -1;
    var ultimoBotonActivo = null;

    function fijarRevelado(encendido) {
      if (revelando === encendido) return;
      revelando = encendido;
      esfera.revelar(encendido);
      if (boton) boton.setAttribute('aria-pressed', encendido ? 'true' : 'false');
      if (etiquetaEstado) etiquetaEstado.textContent = encendido ? 'Después' : 'Antes';
      seccion.classList.toggle('mostrando-despues', encendido);
    }

    /* ---- scroll -> posición --------------------------------------------
       El recorrido arranca y termina con un tramo de "reposo" en el que la
       esfera no gira, para que el primer y el último testimonio se queden
       quietos un momento en vez de aparecer justo en el borde del pin.

       LOS DOS TRAMOS YA NO SON IGUALES, y ese era el fallo del último
       testimonio (Camila Ordóñez). Con 8% y 8%, la esfera llegaba a su
       posición final en el 92% del recorrido... pero las hojas del cierre
       empezaban a entrar en el 82%. O sea que Camila terminaba de asentarse
       cuando el obturador ya la tapaba a más de la mitad: nunca se la veía
       entera, y el imán tampoco la encuadraba nunca porque se apagaba en el
       80% justo para no pelearse con esas hojas.

       Con 6% al principio y 20% al final, la esfera queda quieta en el
       último testimonio desde el 75% del recorrido y el cierre no arranca
       hasta el 86%: son unos 57vh de scroll con Camila al frente, sin nada
       encima, igual que cualquiera de los otros cuatro. El giro en sí pierde
       un 12% de recorrido, que en 520vh son ~62vh repartidos entre cuatro
       tramos — un 3% menos de distancia por giro, imperceptible. */
    var REPOSO_INICIO = 0.06;
    var REPOSO_FIN    = 0.20;
    var TRAMO_GIRO    = 1 - REPOSO_INICIO - REPOSO_FIN;   // 0.74

    /* ---- cierre en obturador --------------------------------------------
       Arranca DESPUÉS de que el último testimonio haya tenido su pausa, y
       -esto es lo otro que fallaba- termina de cerrarse en el 96%, no en el
       100%.

       Por qué el margen del 4%: el progreso llega a 1 justo en el cuadro en
       que el pin se suelta y la sección entrega la pantalla a #cierreCine.
       Terminando el cierre exactamente ahí, cualquier variación de un píxel
       en la altura del viewport dejaba las hojas sin juntar en el momento
       del relevo. Y en un teléfono eso no es "cualquier variación": es lo
       que pasa CADA vez que la barra de direcciones se recoge o vuelve, que
       cambia innerHeight -y con él el recorrido y el progreso- a media
       bajada. De ahí el corte abrupto que se veía en móvil entre el último
       testimonio y la banda de abajo. Con el 96%, quedan ~21vh de scroll ya
       en negro absoluto antes del relevo, y el cambio de una sección a la
       otra ocurre con la pantalla apagada: no hay costura que ver. */
    var CIERRE_DESDE = 0.86;
    var CIERRE_HASTA = 0.96;

    /* ---- meseta por testimonio ------------------------------------------
       Con el reparto lineal, cada testimonio tenía su tramo pero la esfera
       no paraba nunca del todo: el disco entraba y ya estaba saliendo, y no
       daba tiempo de detenerse a comparar el antes/después. MESETA es la
       fracción de cada tramo en la que la posición NO avanza (repartida
       mitad al principio y mitad al final del tramo); el giro se hace en el
       resto, con suavizado en las dos puntas para que no arranque de golpe.
       Con 0.55, más de la mitad del scroll de cada testimonio es pausa. */
    var MESETA = 0.55;

    function conParadas(t) {
      var ultimo = items.length - 1;
      if (t >= ultimo) return ultimo;
      var i = Math.floor(t);
      var u = t - i;
      var margen = MESETA / 2;
      var v = acotar((u - margen) / (1 - MESETA));
      return i + v * v * (3 - 2 * v);
    }

    /* FASE DE LECTURA: única función de este archivo que consulta el layout
       durante el scroll. Va separada de la escritura para no forzar un
       recálculo de layout entre las escrituras de los demás efectos del
       sitio — ver "1b. PLANIFICADOR ÚNICO DE SCROLL" en scripts/script.js. */
    function leerSeccion(ctx) {
      var rect = seccion.getBoundingClientRect();
      var recorrido = seccion.offsetHeight - ctx.alto;
      progresoSeccion = recorrido > 0 ? acotar(-rect.top / recorrido) : 0;
    }

    function actualizar() {
      var progreso = progresoSeccion;

      var t = conParadas(acotar((progreso - REPOSO_INICIO) / TRAMO_GIRO) * (items.length - 1));
      esfera.irA(t);

      /* APERTURA: el velo se disuelve en el primer tramo. Como es del mismo
         ónix que el fondo de la sección, mientras esta entra en pantalla no
         se ve como un bloque negro de más: solo apaga la esfera y el texto
         hasta que el primer testimonio está en su sitio. */
      if (velo) {
        /* Igual que el panel: pasado el 6% esto vale 0 para el resto de la
           sección, y se estaba reescribiendo el mismo "0" en cada cuadro. */
        var opVelo = Number(acotar((0.06 - progreso) / 0.06).toFixed(3));
        if (opVelo !== ultimaOpacidadVelo) {
          ultimaOpacidadVelo = opVelo;
          velo.style.opacity = String(opVelo);
        }
      }

      /* CIERRE: dos hojas negras entran desde arriba y desde abajo hasta
         juntarse en el centro, como el obturador de una cámara. Antes esto
         era un fundido a negro del velo; en obturador el final de la
         sección se lee como un cierre deliberado y no como que se apagó la
         luz. El tramo exacto y por qué es ese, arriba en CIERRE_DESDE.

         Se escribe solo mientras las hojas se mueven: pasado el 100% ya
         están juntas y no hay nada que reescribir en cada cuadro. */
      if (hojas.length === 2) {
        var c = acotar((progreso - CIERRE_DESDE) / (CIERRE_HASTA - CIERRE_DESDE));
        var suave = c * c * (3 - 2 * c);
        var fuera = ((1 - suave) * 100).toFixed(2);
        if (fuera !== ultimoCierre) {
          ultimoCierre = fuera;
          hojas[0].style.transform = 'translate3d(0,-' + fuera + '%,0)';
          hojas[1].style.transform = 'translate3d(0,' + fuera + '%,0)';
          /* El filo dorado acompaña el movimiento y se apaga en el último
             15% del recorrido, para que las hojas ya juntas no dejen una
             costura clara en medio del negro (ver .tc-hoja::after). */
          if (cierre) {
            cierre.style.setProperty('--filo', Math.min(1, (1 - suave) / 0.15).toFixed(3));
          }
        }
      }

      /* Qué tan "asentado" está el testimonio del frente: 1 justo encima,
         0 en pleno viaje. Manda la opacidad del texto y apaga el botón. */
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
        });
        fijarRevelado(false);   // al cambiar de testimonio vuelve al "antes"
      }

      /* Redondeado a dos decimales y escrito solo si cambió. Durante la
         meseta -que es más de la mitad del recorrido de cada testimonio- la
         opacidad vale 1 fija: sin este filtro se reescribían dos estilos por
         cuadro para dejar el elemento exactamente como estaba. */
      var op = Number(suavizada.toFixed(2));
      if (panel && op !== ultimaOpacidadPanel) {
        ultimaOpacidadPanel = op;
        panel.style.opacity = String(op);
        panel.style.transform = 'translateY(' + ((1 - op) * 26).toFixed(1) + 'px)';
      }

      /* Mientras rueda, el "después" se apaga: la comparación solo tiene
         sentido con la foto quieta al frente. */
      if (quietud < 0.5 && revelando) fijarRevelado(false);
      if (boton) {
        /* pointer-events no repinta nada, pero tocarlo invalida el estilo
           calculado del botón y de su chip en cada cuadro. Solo en los dos
           cuadros en que de verdad cambia. */
        var pasa = quietud > 0.75;
        if (pasa !== ultimoBotonActivo) {
          ultimoBotonActivo = pasa;
          boton.style.pointerEvents = pasa ? 'auto' : 'none';
        }
        if (op !== ultimaOpacidadBoton) {
          ultimaOpacidadBoton = op;
          boton.style.opacity = String(op);
        }
      }
    }

    /* ---- antes / después ------------------------------------------------
       Con mouse basta pasar por encima; en pantallas táctiles (donde no
       existe el hover) el toque alterna. También responde al teclado, por
       eso es un <button> de verdad y no un div. */
    if (boton) {
      if (window.matchMedia('(hover: hover)').matches) {
        boton.addEventListener('pointerenter', function () { fijarRevelado(true); });
        boton.addEventListener('pointerleave', function () { fijarRevelado(false); });
      }
      boton.addEventListener('click', function () { fijarRevelado(!revelando); });
      boton.addEventListener('focus', function () { fijarRevelado(true); });
      boton.addEventListener('blur', function () { fijarRevelado(false); });
    }

    /* ---- IMÁN DE TESTIMONIOS --------------------------------------------
       Cuando el scroll se detiene dentro de la sección, la página termina
       de encuadrar el testimonio más cercano: lo lleva al centro exacto de
       su meseta, que es donde la esfera está quieta y el texto se lee al
       100% de opacidad. Sin esto uno se quedaba a menudo entre dos
       testimonios, con el disco a medio girar y la cita medio transparente.

       El cálculo vive AQUÍ y no en script.js porque es aquí donde se sabe
       cómo se reparte el scroll entre testimonios (REPOSO y MESETA): la
       meseta del testimonio i está centrada exactamente en t = i, así que
       basta con deshacer el mapeo progreso -> t para saber a qué altura de
       la página cae ese centro.

       Los dos extremos quedan fuera a propósito: abajo del 4% manda la
       apertura del velo, y a partir de CIERRE_DESDE ya están entrando las
       hojas del obturador; un imán ahí pelearía con esas dos transiciones.

       Ese tope era antes un 0.80 escrito a mano, y como el último testimonio
       se asentaba recién en el 0.92, quedaba SIEMPRE fuera: era el único de
       los cinco que la página no terminaba de encuadrar nunca. Ahora que el
       reparto es asimétrico su meseta cae en el 0.80 y el tope está en el
       0.86, así que entra como los demás. */
    if (window.SmilersScroll && window.SmilersScroll.alDetenerse) {
      window.SmilersScroll.alDetenerse(function () {
        var recorrido = seccion.offsetHeight - (window.innerHeight || 1);
        if (recorrido <= 0) return null;

        var progreso = progresoSeccion;
        if (progreso <= 0.04 || progreso >= CIERRE_DESDE) return null;

        var tramos = items.length - 1;
        if (tramos <= 0) return null;

        var lineal = acotar((progreso - REPOSO_INICIO) / TRAMO_GIRO) * tramos;
        var objetivo = REPOSO_INICIO + (Math.round(lineal) / tramos) * TRAMO_GIRO;
        var tope = seccion.getBoundingClientRect().top + window.scrollY;

        /* "maximo" en 0.62 de pantalla y no el tope común (0.55): entre el
           centro de una meseta y el de la vecina hay medio tramo, que con el
           reparto de arriba son 0.0925 del recorrido — 0.48 de pantalla en
           escritorio (520vh) y 0.43 en móvil (460vh). Con el tope común
           quedaba tan al filo que cualquier variación de alto lo descartaba y
           el imán no se movía nunca. */
        return { y: Math.round(tope + objetivo * recorrido), maximo: 0.62 };
      });
    }

    /* Se engancha al planificador común del sitio si está (index.html carga
       script.js antes que este archivo); si por lo que sea no estuviera,
       cae a un listener propio con el mismo contrato lectura -> escritura. */
    if (window.SmilersScroll) {
      window.SmilersScroll.registrar(leerSeccion, actualizar, function () {
        esfera.escala = escalaSegunPantalla();
        esfera.encuadre = encuadreSegunPantalla();
        esfera.redimensionar();
      }, {
        /* Guarda: esta sección vive en el último tercio del documento, y
           hasta ahora medía su caja en CADA cuadro de scroll de toda la
           portada para acabar escribiendo siempre el mismo progreso 0. Con
           la guarda solo trabaja cuando falta menos de una pantalla para
           llegar. El planificador le da un cuadro completo al entrar y otro
           al salir, así que el velo de apertura y las hojas del cierre
           quedan siempre en su estado final. */
        guarda: seccion,
        alCambiarVisibilidad: function (dentro) {
          /* Las dos hojas del obturador solo necesitan capa propia mientras
             la sección está en juego; fuera de ella son dos rectángulos
             negros quietos y no hay por qué tenerlas reservadas en la GPU
             durante toda la visita (el will-change permanente de .tc-hoja se
             quitó de la hoja de estilos por esto mismo). */
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
        esfera.escala = escalaSegunPantalla();
        esfera.encuadre = encuadreSegunPantalla();
        esfera.redimensionar();
        pedirActualizacion();
      });
    }

    /* La esfera solo dibuja mientras la sección está en pantalla: si no,
       serían 60 cuadros por segundo de WebGL compitiendo con el resto de
       efectos de scroll del sitio. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) { esfera.redimensionar(); esfera.arrancar(); }
          else { esfera.detener(); }
        });
      }, { rootMargin: '200px 0px' }).observe(seccion);
    } else {
      esfera.arrancar();
    }

    leerSeccion({ alto: window.innerHeight || 1 });
    actualizar();
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Con "menos movimiento" activado no se arma la esfera: queda la lista
    // de tarjetas del HTML, que ya es la versión estática de lo mismo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-esfera-testimonios]'),
      iniciarSeccion
    );
  });

})();
