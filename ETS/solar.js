var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;
var indexBuffer;
var vertexColorBuffer;
var projectionMatrix = mat4.create();
var mvMatrix = mat4.create();
var lastTime = 0;
var cameraPosition = 0;

/* Membuat kelas untuk membuat Planet */
class Planet {
    constructor(planetName, x, y, z, r, rotateAngle, red, green, blue) {
        this.planetName = planetName;
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = r;
        this.rotateAngle = rotateAngle;
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.vertice = [];
        this.indices = [];
        this.load = 0;

        if(this.planetName == "Moon") {
            this.rotateAngle2 = .0;
        }
    }

    setupBuffers() {
      vertexPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

      if(this.load == 0) {
        var SPHERE_DIV = 12;
        var i, ai, si, ci;
        var j, aj, sj, cj;
        var p1, p2;

        // Vertices
        for(j = 0; j<= SPHERE_DIV; j++) {
          aj = j * Math.PI / SPHERE_DIV;
          sj = Math.sin(aj);
          cj = Math.cos(aj);

          for(i = 0; i <= SPHERE_DIV; i++) {
            ai = i * 2 * Math.PI / SPHERE_DIV;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            this.vertice.push(si * sj);
            this.vertice.push(cj);
            this.vertice.push(ci * sj);
          }
        }
      }

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

      if(this.load = 0) {
        // Indices
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        for(j = 0; j < SPHERE_DIV; i++) {
          for(i = 0; i < SPHERE_DIV; i++) {
            p1 = j * (SPHERE_DIV + 1) + i;
            p2 = p1 + (SPHERE_DIV + 1);

            this.indices.push(p1);
            this.indices.push(p2);
            this.indices.push(p1 + 1);

            this.indices.push(p1 + 1);
            this.indices.push(p2);
            this.indices.push(p2 + 1);
          }
        }
      }

      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

      if(this.load == 0) {
        this.colors = [];
        for(i = 0; i <= 169; i++) {
          this.colors.push(this.red/255.0, this.green/255.0, this.blue/255.0, 1.0);
        }
        this.load = 1;
      }

      // Colors
      vertexColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors));
    }

    draw() {
      var numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
      gl.vertexAttribPointer(
        shaderProgram.vertexPositionAttribute,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );

      var numComponents = 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
      gl.vertexAttribPointer(
        shaderProgram.vertexColorAttribute,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );

      // Model view matrix
      mat4.identity(mvMatrix);
      mat4.translate(mvMatrix, mvMatrix, [this.x/this.z, this.y/this.z, this.z/this.z]);
      mat4.scale(mvMatrix, mvMatrix, new Array(3).fill(this.r/26));
      gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

/* Deklarasi Object Planet */
var sun = new Planet("Sun", 0.0, 0.0, 25.0, 1.0, 0.0, 255.0, 165.0, 0.0);
var mercury = new Planet("Mercury", 0.1, -2.0, 25.0, 0.3, 0.0, 210.0, 105.0, 30.0);
var venus = new Planet("Venus", -2.5, 2.0, 25.0, 0.3, 180.0,  255.0, 0.0, 0.0);
var earth = new Planet("Earth", 0.0, -5.0, 25.0, 0.3, 0.0, 0.0, 0.0, 255.0);
var moon = new Planet("Moon", 0.0, -6.0, 25.0, 0.15, 0.0, 105.0, 105.0, 105.0);
var march = new Planet("March", -6.0, 4.0, 25.0, 0.3, 180.0, 165.0, 42.0, 42.0);
var jupyter = new Planet("Jupyter", -8.0, 6.0, 25.0, 0.5, 180.0, 255.0, 255.0, 255.0);
var saturnus = new Planet("Saturnus", -10.0, 5.0, 25.0, 0.4, 180.0, 255.0, 228.0 ,196.0);
var uranus = new Planet("Uranus", 15.0, 5.0, 25.0, 0.35, 90.0, 95.0, 158.0, 160.0);
var neptunus = new Planet("Neptunus", 0.0, -25.0, 25.0, 0.35, 0.0, 123.0, 104.0, 238.0);

/* Fungsi untuk membuat WebGL Context */
function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i=0; i < names.length; i++) {
      try {
        context = canvas.getContext(names[i]);
      } catch(e) {}
      if (context) {
        break;
      }
    }
    if (context) {
      context.viewportWidth = canvas.width;
      context.viewportHeight = canvas.height;
    } else {
      alert("Failed to create WebGL context!");
    }
    return context;
  }

  /* Fungsi untuk memuat properti shader dari HTML */
function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
    
    if (!shaderScript) {
        return null;
    }
    
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { 
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    
    return shader;
}

/* Setup untuk fragment and vertex shaders */
function setupShaders() {
    vertexShader = loadShaderFromDOM("vs-src");
    fragmentShader = loadShaderFromDOM("fs-src");
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }
    
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
}

/* Fungsi untuk mengubah sudut ke radian */
function degToRad(degree) {
    const rad = Math.PI/180;
    return degree * rad;
}

/* Fungsi untuk membuat proyeksi */
function projection() {

}

/* Fungsi untuk membuat animasi */
function tick() {
    requestAnimFrame(tick);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw();
    animate();
}

/* Fungsi utama */
function startup() {
    canvas = document.getElementById('myCanvas');
    gl = createGLContext(canvas);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.cleareColor(.0, .0, .0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    setupShaders();
    tick();
}