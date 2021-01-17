main();

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function initProgramInfo(gl) {
    const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec4 aVertexNormal;

      uniform mat4 uProjectionMatrix;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uNormalMatrix;

      uniform vec4 uLightPosition;
      uniform vec4 uLightAmbient;
      uniform vec4 uLightDiffuse;
      uniform vec4 uLightSpecular;

      uniform vec4 uModelAmbient;
      uniform vec4 uModelDiffuse;
      uniform vec4 uModelSpecular;
      uniform float uModelShininess;

      varying lowp vec4 vColor;

      void main() {
        vec4 vertexPositionEye4 = uModelViewMatrix * aVertexPosition;
        vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

        gl_Position = uProjectionMatrix * vertexPositionEye4;

        vec3 vertexNormalEye = normalize((uNormalMatrix * aVertexNormal).xyz);
        vec3 vectorToLightSource = normalize(uLightPosition.xyz - vertexPositionEye3);

        float diffuseWeightning = max(dot(vertexNormalEye, vectorToLightSource), 0.0);

        vec3 reflectionVector = normalize(reflect(-vectorToLightSource, vertexNormalEye));
        vec3 viewVectorEye = -normalize(vertexPositionEye3);

        float reflectionView = max(dot(reflectionVector, viewVectorEye), 0.0);
        float specularWeightning = pow(reflectionView, uModelShininess);

        vColor = (uLightAmbient * uModelAmbient)
            + (uLightDiffuse * uModelDiffuse) * diffuseWeightning
            + (uLightSpecular * uModelSpecular) * specularWeightning;
      }
    `;

    const fsSource = `
      varying lowp vec4 vColor;

      void main(void) {
        gl_FragColor = vColor;
      }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (shaderProgram == null) {
      return null;
    }      

    return {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
        lightAmbient: gl.getUniformLocation(shaderProgram, 'uLightAmbient'),
        lightDiffuse: gl.getUniformLocation(shaderProgram, 'uLightDiffuse'),
        lightSpecular: gl.getUniformLocation(shaderProgram, 'uLightSpecular'),
        modelAmbient: gl.getUniformLocation(shaderProgram, 'uModelAmbient'),
        modelDiffuse: gl.getUniformLocation(shaderProgram, 'uModelDiffuse'),
        modelSpecular: gl.getUniformLocation(shaderProgram, 'uModelSpecular'),
        modelShininess: gl.getUniformLocation(shaderProgram, 'uModelShininess'),
      },
    };
}

function initCamera(gl) {
  return {
    fieldOfView: 45.0 * Math.PI / 180.0,
    aspect: gl.canvas.clientWidth / gl.canvas.clientHeight,
    zNear: 0.1,
    zFar: 1000000000000.0,
    distance: 10.0,
    tilt: 45.0,
    getProjectionMatrix: function() {
      const projectionMatrix = mat4.create();
      mat4.perspective(projectionMatrix, this.fieldOfView,
          this.aspect, this.zNear, this.zFar);
      mat4.translate(projectionMatrix, projectionMatrix, [ 0.0, 0.0, -this.distance ]);
      mat4.rotate(projectionMatrix, projectionMatrix,
          this.tilt * Math.PI / 180.0, [ 1.0, 0.0, 0.0 ]);

      return projectionMatrix;
    }
  }
}

function initLight() {
  return {
    ambient: [ 0.1, 0.1, 0.1, 1.0 ],
    diffuse: [ 0.8, 0.8, 0.8, 1.0 ],
    specular: [ 1.0, 1.0, 1.0, 1.0 ],
    distance: 5.0,
    position: 0.0,
    getPosition: function() {
      const rotation = mat4.create();
      mat4.rotate(rotation, rotation,
          this.position * Math.PI / 180.0, [ 0.0, 1.0, 0.0 ]);

      const position = vec4.fromValues(0.0, 0.0, -this.distance, 1.0);
      vec4.transformMat4(position, position, rotation);

      return position;
    }
  };
}


function initBuffers(gl) {
    const positions = [
      // Front face
      -1.0, -1.0,  1.0,
      1.0, -1.0,  1.0,
      1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,

      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
      1.0,  1.0,  1.0,
      1.0,  1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
      1.0, -1.0, -1.0,
      1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,

      // Right face
      1.0, -1.0, -1.0,
      1.0,  1.0, -1.0,
      1.0,  1.0,  1.0,
      1.0, -1.0,  1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    

    const vertexNormals = [
      // Front
      0.0,  0.0,  1.0,
      0.0,  0.0,  1.0,
      0.0,  0.0,  1.0,
      0.0,  0.0,  1.0,

      // Back
      0.0,  0.0, -1.0,
      0.0,  0.0, -1.0,
      0.0,  0.0, -1.0,
      0.0,  0.0, -1.0,

      // Top
      0.0,  1.0,  0.0,
      0.0,  1.0,  0.0,
      0.0,  1.0,  0.0,
      0.0,  1.0,  0.0,

      // Bottom
      0.0, -1.0,  0.0,
      0.0, -1.0,  0.0,
      0.0, -1.0,  0.0,
      0.0, -1.0,  0.0,

      // Right
      1.0,  0.0,  0.0,
      1.0,  0.0,  0.0,
      1.0,  0.0,  0.0,
      1.0,  0.0,  0.0,

      // Left
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0
    ];

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                  gl.STATIC_DRAW);
    
    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
      normal: normalBuffer,
      indices: indexBuffer,
      count: 36,
    };
}

function initModels(gl) {
  const cubicModel = {
    buffers: initBuffers(gl),
    rotation: { x: 0.0, y: 0.0, z: 0.0, },
    material: {
      ambient: [ 1.0, 0.4, 0.0, 1.0 ],
      diffuse: [ 1.0, 0.8, 0.0, 1.0 ],
      specular: [ 1.0, 1.0, 1.0, 1.0 ],
      shininess: 100.0,
    },
  };

  const models = [
    cubicModel,
  ]

  models.forEach(model => {
    model.getModelViewMatrix = function() {
      const modelViewMatrix = mat4.create();

      mat4.rotate(modelViewMatrix, modelViewMatrix,
          this.rotation.x * Math.PI / 180.0, [ 1.0, 0.0, 0.0 ]);
      mat4.rotate(modelViewMatrix, modelViewMatrix,
          this.rotation.y * Math.PI / 180.0, [ 0.0, 1.0, 0.0 ]);
      mat4.rotate(modelViewMatrix, modelViewMatrix,
          this.rotation.z * Math.PI / 180.0, [ 0.0, 0.0, 1.0 ]);

      return modelViewMatrix;
    };

    model.getNormalMatrix = function() {
      const normalMatrix = mat4.create();
      mat4.invert(normalMatrix, this.getModelViewMatrix());
      mat4.transpose(normalMatrix, normalMatrix);

      return normalMatrix;
    };
  });

  return models;
}

function drawModel(gl, programInfo, model) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
        3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal,
        3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
        false, model.getModelViewMatrix());
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix,
        false, model.getNormalMatrix());

    gl.uniform4fv(programInfo.uniformLocations.modelAmbient, model.material.ambient);
    gl.uniform4fv(programInfo.uniformLocations.modelDiffuse, model.material.diffuse);
    gl.uniform4fv(programInfo.uniformLocations.modelSpecular, model.material.specular);
    gl.uniform1f(programInfo.uniformLocations.modelShininess, model.material.shininess);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.buffers.indices);

    gl.drawElements(gl.TRIANGLES, model.buffers.count, gl.UNSIGNED_SHORT, 0);
}

function drawScene(gl, programInfo, camera, light, models) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
        false, camera.getProjectionMatrix());
  
    gl.uniform4fv(programInfo.uniformLocations.lightPosition, light.getPosition());
    gl.uniform4fv(programInfo.uniformLocations.lightAmbient, light.ambient);
    gl.uniform4fv(programInfo.uniformLocations.lightDiffuse, light.diffuse);
    gl.uniform4fv(programInfo.uniformLocations.lightSpecular, light.specular);
  
    models.forEach(model => {
      drawModel(gl, programInfo, model);
    });
}

function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  const programInfo = initProgramInfo(gl);
  if (programInfo == null) {
    return;
  }

  const camera = initCamera(gl);

  const light = initLight();

  const models = initModels(gl);

  let spacePressed = false;
  let leftPressed = false;
  let rightPressed = false;

  window.onkeydown = (e) => {
    switch (e.keyCode) {
      case 32: spacePressed = true; break;
      case 37: leftPressed = true; break;
      case 39: rightPressed = true; break;
    }
  }

  window.onkeyup = (e) => {
    switch (e.keyCode) {
      case 32: spacePressed = false; break;
      case 37: leftPressed = false; break;
      case 39: rightPressed = false; break;
    }
  }

  let then = null;
  const render = (now) => {
    now *= 0.001;

    if (then) {
      const elapsed = now - then;

      if (leftPressed) {
        light.position -= elapsed * 100.0;
      }

      if (rightPressed) {
        light.position += elapsed * 100.0;
      }

      if (!spacePressed) {
        models.forEach(model => {
          model.rotation.x += elapsed * 100.0;
          model.rotation.y += elapsed * 50.0;
          model.rotation.z += elapsed * 50.0;
        });
      }
    }

    then = now;

    drawScene(gl, programInfo, camera, light, models);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}