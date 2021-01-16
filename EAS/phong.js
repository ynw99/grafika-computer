var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;
var vertexColorBuffer;
var rotAngle = 0;
var lastTime = 0;
var mvMatrix = mat4.create();

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
    var pi = Math.PI;
    return degree * (pi/180.0);
}

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

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix"); // Uniform model view matrix
}

/* Setup buffers dengan data */
function setupBuffers() {
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

    var triangleVertices = [
        .8, .75, 0.0, // Kuning
        .7, .5, 0.0,
        .35, .5, 0.0, // 12
        .8, .75, 0.0,
        .43, .75, 0.0,
        .35, .5, 0.0, // 11
        .43, .75, 0.0,
        .15, .75, 0.0,
        .25, .125, 0.0, // 10
        .15, 0.75, 0.0,
        .25, .125, 0.0,
        -.05, .125, 0.0, // 9
        0.275, 0.125, 0.0,
        -.32, .125, 0.0,
        -.375, -.125, 0.0, // 8
        0.275, 0.125, 0.0,
        -.375, -.125, 0.0,
        0.275, -.125, 0.0, // 7
        0.875, 0.125, 0.0,
        0.275, .125, 0.0,
        0.8, -.125, 0.0, // 6
        0.275, 0.125, 0.0,
        0.8, -.125, 0.0,
        0.275, -.125, 0.0, // 5
        0.0, -.125, 0.0,
        0.275, -0.125, 0.0,
        0.4, -0.5, 0.0, // 4
        0.0, -.125, 0.0,
        0.1, -0.5, 0.0,
        0.4, -0.5, 0.0, // 3
        0.1, -0.5, 0.0,
        0.675, -0.5, 0.0,
        0.2, -0.75, 0.0, // 2
        0.2, -0.75, 0.0,
        0.675, -0.5, 0.0,
        0.6, -0.75, 0.0, // 1, Kuning
        0.08, 0.75, 0.0, // Hitam
        0.0, 0.5, 0.0,
        -0.5, 0.75, 0.0, // 6
        0.0, 0.5, 0.0,
        -0.3, 0.5, 0.0,
        -0.5, 0.75, 0.0, // 5
        -0.3,  0.5,  0.0,
        -0.50,  0.75,  0.0,
        -0.75,  -0.75,  0.0, // 4
        -0.75,  -0.75,  0.0,
        -0.5, -0.5,   0.0,
        -0.3,  0.5,  0.0, // 3
        -0.75,  -0.75,  0.0,
        0.1, -0.75,  0.0,
        -0.5, -0.5,   0.0, // 2
        -0.5, -0.5,   0.0,
        0.1, -0.75,  0.0,
        0.0, -0.5,   0.0 // 1, Hitam
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = triangleVertices.length/3;
    
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var colors = [
        1.0, 1.0, 0.0, 1.0, // Kuning
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 12
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 11
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 10
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 9
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 8
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 7
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 6
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 5
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 4
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 3
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 2
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, // 1, Kuning
        0.0, 0.0, 0.0, 1.0, // Hitam
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0, // 6
        0.0, 0.0, 0.0, 1.0, 
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0, // 5
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0, // 4
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0, // 3
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0, // 2
        0.0, 0.0, 0.0, 1.0, 
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0 // 1, Hitam
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = colors.length/4;  
}

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsedTime = timeNow - lastTime;
        rotAngle = (rotAngle+1.0) % 360;
    }
    lastTime = timeNow;
}

/* Fungsi Draw */
function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    mat4.identity(mvMatrix);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle));
    mat4.rotateZ(mvMatrix, mvMatrix, -degToRad(rotAngle));

    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
    canvas = document.getElementById("myCanvas");
    gl = createGLContext(canvas);
    setupShaders(); 
    setupBuffers();
    gl.clearColor(1.0/255.0, 56.0/255.0, 128.0/255.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    tick();
}