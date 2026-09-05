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

    // Blanco y negro NEUTRO. Aqui habia un vec3(1.05, 0.99, 0.87)
    // multiplicando el gris: mas rojo, menos azul, o sea un viraje sepia de
    // los de foto antigua. Sobre una cara sana lo que hacia era darle un
    // tono amarillento y enfermizo al "antes" -y de paso exagerar el cambio
    // al revelar el despues, que es justo lo que un antes/despues no debe
    // hacer-. Ahora el gris se queda gris.
    float gris = dot(antes.rgb, vec3(0.299, 0.587, 0.114));
    vec3 blancoYNegro = vec3(gris);

    float revelado = (itemIndex == uActivo) ? uRevelado : 0.0;
    vec3 color = mix(blancoYNegro, despues.rgb, revelado);

    outColor = vec4(color, antes.a * vAlpha);
}
`;

  var RADIO_ESFERA = 2;
  var DURACION_CUADRO = 1000 / 60;

  function EsferaTestimonios(lienzo, items, opciones) {
    opciones = opciones || {};
    this.lienzo = lienzo;
    this.items = items;
    this.escala = opciones.escala || 3.2;

    this.encuadre = opciones.encuadre || 0.35;

    this.velocidadRevelado = opciones.velocidadRevelado || 0.14;

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
  };

  EsferaTestimonios.prototype._actualizarCamara = function () {
    M4.apuntarA(this.camara.matriz, V3.de(0, 0, this.camara.z), V3.de(0, 0, 0), V3.de(0, 1, 0));
    M4.invertir(this.camara.vista, this.camara.matriz);
  };

  EsferaTestimonios.prototype.irA = function (posicion) {
    this.posicion = Math.min(this.items.length - 1, Math.max(0, posicion));
  };

  EsferaTestimonios.prototype.revelar = function (encendido) {
    this.objetivoRevelado = encendido ? 1 : 0;
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

    this.revelado += (this.objetivoRevelado - this.revelado) * Math.min(1, this.velocidadRevelado * escalaTiempo);

    var arribaY = V3.de(0, 1, 0);
    var arribaX = V3.de(1, 0, 0);
    var origen = V3.de(0, 0, 0);
    var ESC_DISCO = 0.25;
    var INTENSIDAD = 0.6;

    for (var i = 0; i < this.cantidadInstancias; i++) {
      var p = V3.porCuaternion(V3.crear(), this.posicionesInstancia[i], this.orientacion);

      var s = (Math.abs(p[2]) / RADIO_ESFERA) * INTENSIDAD + (1 - INTENSIDAD);
      var escFinal = s * ESC_DISCO;

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
    this._yaPinto = false;
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

    seccion.classList.add('esfera-activa');

    var hayHover = window.matchMedia('(hover: hover)').matches;

    function escalaSegunPantalla() {
      return window.innerWidth < 992 ? 2.2 : 3.2;
    }

    function encuadreSegunPantalla() {
      return window.innerWidth < 992 ? 0.232 : 0.285;
    }

    var esfera;
    try {
      esfera = new EsferaTestimonios(lienzo, items, {
        escala: escalaSegunPantalla(),
        encuadre: encuadreSegunPantalla(),

        velocidadRevelado: hayHover ? 0.14 : 0.34
      });
    } catch (e) {

      seccion.classList.remove('esfera-activa');
      return;
    }

    var revelando = false;
    var ultimoIndice = -1;
    var ultimoCierre = null;
    var progresoSeccion = 0;

    var ultimaOpacidadVelo = -1;
    var ultimaOpacidadPanel = -1;
    var ultimaOpacidadBoton = -1;
    var ultimoBotonActivo = null;

    var pistaGastada = false;

    function apagarPista() {
      if (pistaGastada) return;
      pistaGastada = true;
      seccion.classList.remove('tst-pista-toque');
    }

    function ajustarPista() {

      pistaGastada = false;
      seccion.classList.remove('tst-pista-toque');
      requestAnimationFrame(function () {

        if (!pistaGastada) seccion.classList.add('tst-pista-toque');
      });
    }

    function fijarRevelado(encendido) {
      if (revelando === encendido) return;

      if (encendido) apagarPista();
      revelando = encendido;
      esfera.revelar(encendido);
      if (boton) boton.setAttribute('aria-pressed', encendido ? 'true' : 'false');
      if (etiquetaEstado) etiquetaEstado.textContent = encendido ? 'Después' : 'Antes';
      seccion.classList.toggle('mostrando-despues', encendido);
    }

    var UNIDADES = {
      apertura:  24,
      meseta:    58,
      giro:      38,
      obturador: 68,
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
      var progreso = progresoSeccion;

      var t = conParadas(acotar((progreso - REPOSO_INICIO) / TRAMO_GIRO) * (items.length - 1));
      esfera.irA(t);

      if (velo) {

        var opVelo = Number(acotar((APERTURA - progreso) / APERTURA).toFixed(3));
        if (opVelo !== ultimaOpacidadVelo) {
          ultimaOpacidadVelo = opVelo;
          velo.style.opacity = String(opVelo);
        }
      }

      if (hojas.length === 2) {
        var c = acotar((progreso - CIERRE_DESDE) / (CIERRE_HASTA - CIERRE_DESDE));

        var suave = c * c * c * (c * (c * 6 - 15) + 10);
        var fuera = ((1 - suave) * 100).toFixed(2);
        if (fuera !== ultimoCierre) {
          ultimoCierre = fuera;
          hojas[0].style.transform = 'translate3d(0,-' + fuera + '%,0)';
          hojas[1].style.transform = 'translate3d(0,' + fuera + '%,0)';

          if (cierre) {
            cierre.style.setProperty('--filo', Math.min(1, (1 - suave) / 0.15).toFixed(3));
          }
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
        ajustarPista();
        fijarRevelado(false);
      }

      var op = Number(suavizada.toFixed(2));
      if (panel && op !== ultimaOpacidadPanel) {
        ultimaOpacidadPanel = op;
        panel.style.opacity = String(op);
        panel.style.transform = 'translateY(' + ((1 - op) * 26).toFixed(1) + 'px)';
      }

      if (quietud < 0.5 && revelando) fijarRevelado(false);
      if (boton) {

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

    if (boton) {
      if (hayHover) {
        boton.addEventListener('pointerenter', function () { fijarRevelado(true); });
        boton.addEventListener('pointerleave', function () { fijarRevelado(false); });
        boton.addEventListener('click', function () { fijarRevelado(!revelando); });
        boton.addEventListener('focus', function () { fijarRevelado(true); });
        boton.addEventListener('blur', function () { fijarRevelado(false); });
      } else {

        var yaTocado = false;

        boton.addEventListener('pointerdown', function (evento) {
          if (evento.pointerType === 'mouse') return;

          yaTocado = true;
          fijarRevelado(!revelando);
        });

        boton.addEventListener('click', function () {

          if (yaTocado) { yaTocado = false; return; }
          fijarRevelado(!revelando);
        });
      }
    }

    function yDeTestimonio(indice) {
      var recorrido = seccion.offsetHeight - (window.innerHeight || 1);
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
        apagarPista();
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

    if (window.SmilersScroll && window.SmilersScroll.alDetenerse) {
      window.SmilersScroll.alDetenerse(function () {
        var progreso = progresoSeccion;
        if (progreso <= APERTURA || progreso >= CIERRE_DESDE) return null;

        var tramos = items.length - 1;
        if (tramos <= 0) return null;

        var lineal = acotar((progreso - REPOSO_INICIO) / TRAMO_GIRO) * tramos;
        var destino = yDeTestimonio(Math.round(lineal));
        if (destino === null) return null;

        return { y: destino, maximo: 0.62 };
      });
    }

    if (window.SmilersScroll) {
      window.SmilersScroll.registrar(leerSeccion, actualizar, function () {

        fijarAlto();
        esfera.escala = escalaSegunPantalla();
        esfera.encuadre = encuadreSegunPantalla();
        esfera.redimensionar();
      }, {

        guarda: seccion,
        alCambiarVisibilidad: function (dentro) {

          seccion.classList.toggle('tst-en-juego', dentro);

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
        esfera.escala = escalaSegunPantalla();
        esfera.encuadre = encuadreSegunPantalla();
        esfera.redimensionar();
        pedirActualizacion();
      });
    }

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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-esfera-testimonios]'),
      iniciarSeccion
    );
  });

})();
