var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;
var indice;
var vertexColorBuffer;
var projectionMatrix = mat4.create();
var mvMatrix = mat4.create();
var lastTime = 0;
var cameraPosition = 0;

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
        this.indice = [];
        this.load = 0;
    }

    if(this.planetName == "Moon") {
        this.rotateAngle2 = .0;
    }

    
}

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

function degToRad(degree) {
    const radian = Math.PI/180;
    return degree * radian;
}

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