//
// Start here
//
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

class GLcanvas {
  constructor(canvas) {
    this.canvas = canvas
    this.gl = canvas.getContext('webgl2');
    var ext = null;
    ext = this.gl.getExtension('EXT_color_buffer_float');
    if (!ext) {
        alert("Extension loading error");
        return;
    }
    ext = this.gl.getExtension('OES_texture_float_linear');
    if (!ext) {
        alert("Extension loading error");
        return;
    }

    // If we don't have a GL context, give up now

    if (!this.gl) {
      alert('Unable to initialize WebGL. Your browser or machine may not support it.');
      return;
    }

    this.programList = [];
  }

  //
  // initBuffers
  //
  // Initialize the buffers we'll need. For this demo, we just
  // have one object -- a simple three-dimensional cube.
  //

  setIndex(index, indexArray){
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray), this.gl.STATIC_DRAW);
  }

  setBuffer(label,numComponents, buffer, array, index, indexArray){
    const shaderProgram = this.programList[0].glShaderProgram;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(array), this.gl.STATIC_DRAW);
    {
      const type = this.gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.vertexAttribPointer(
          this.gl.getAttribLocation(shaderProgram,label),
          numComponents,
          type,
          normalize,
          stride,
          offset);
      this.gl.enableVertexAttribArray(
          this.gl.getAttribLocation(shaderProgram,label)
        );
    }
  }

  setUniform(shaderProgram,label,type,data){
    switch(type){
      case '1f':
        this.gl.uniform1f(
            this.gl.getUniformLocation(shaderProgram,label),
            data);
        break;
      case 'Matrix4fv':
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(shaderProgram,label),
            false,
            data);
        break;
      case '1fv':
        this.gl.uniform1fv(
            this.gl.getUniformLocation(shaderProgram,label),
            data);
        break;
      case '2fv':
        this.gl.uniform2fv(
            this.gl.getUniformLocation(shaderProgram,label),
            data);
        break;
      case '3fv':
        this.gl.uniform3fv(
            this.gl.getUniformLocation(shaderProgram,label),
            data);
        break;
      case '4fv':
        this.gl.uniform4fv(
            this.gl.getUniformLocation(shaderProgram,label),
            data);
        break;
    }
  }

  addInput(shaderProgramInfo,label){
    const input = {
      label:label,
      data:null,
      updateFlag: false,
    }

    shaderProgramInfo.inputList.push(input);
    //console.log(`Added input ${input.label}`);
    return input;
  }

  updateInput(input,data){
    input.data = data;
    input.updateFlag = true;
  }

  defineInput(shaderProgramInfo,label,data){
    const input = this.addInput(shaderProgramInfo,label);
    this.updateInput(input,data);
    return input;
  }

  addUniform(shaderProgramInfo,label,type){
    const uniform = {
      label:label,
      type:type,
      data:null,
      updateFlag: false,
    }
    shaderProgramInfo.uniformList.push(uniform);
    //console.log(`Added uniform ${uniform.label}`);
    return uniform;
  }

  updateUniform(uniform,data){
    uniform.data = data;
    uniform.updateFlag = true;
  }

  defineUniform(shaderProgramInfo,label,type,data){
    const uniform = this.addUniform(shaderProgramInfo,label,type);
    this.updateUniform(uniform,data);
    return uniform;
  }

  addAttribute(shaderProgramInfo,label,numComponents){
    const attribute_index = shaderProgramInfo.attributeList.length;
    const attribute = {
            label:label,
            numComponents:numComponents,
            data: new Array(),
            index: this.gl.createBuffer(),
            indexdata:null,
            buffer: this.gl.createBuffer(),
            location: this.gl.getAttribLocation(shaderProgramInfo.glShaderProgram,label),
            updateFlag: false,
    }
    shaderProgramInfo.attributeList.push(attribute)
    return attribute;
  }

  updateAttriubte(attribute,data,indexdata){
    //const attribute
    attribute.data = data;
    attribute.indexdata = indexdata;
    attribute.updateFlag = true;
  }

  defineAttribute(shaderProgramInfo,label,numComponents,data,indexdata){
    const attribute = this.addAttribute(shaderProgramInfo,label,numComponents);
    this.updateAttriubte(attribute,data,indexdata);
    return attribute;
  }

  //
  // Initialize a texture and load an image.
  // When the image finished loading copy it into the texture.
  //

  arrayTexture(array){
    const max_width = 4096;
    const n = array.length/4;
    const n_lines = Math.floor(n/max_width)+1;

    while(array.length/4 < n_lines*max_width){
      //console.log(`filling up the rest of the array [${array.length/4}/${n_lines*max_width}]`);
      array.push(0.0,0.0,0.0,0.0);
    }

    const gl = this.gl;

    var texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    {
      // fill texture with 3x2 pixels
      const level = 0;
      const internalFormat = gl.RGBA32F;
      const width = max_width;
      const height = n_lines;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.FLOAT;
      const data = new Float32Array(array);
      const alignment = 1;
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                    format, type, data);

      // set the filtering so we don't need mips and it's not filtered
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    return texture;
  }
  loadTexture(url) {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = this.gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);

    const image = new Image();
    image.onload = () => {
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);

      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
         // Yes, it's a power of 2. Generate mips.
         this.gl.generateMipmap(this.gl.TEXTURE_2D);
      } else {
         // No, it's not a power of 2. Turn of mips and set
         // wrapping to clamp to edge
         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      }
    };
    image.src = url;

    return texture;
  }

  drawScene(shaderProgram, output) {
    const glShaderProgram = shaderProgram.glShaderProgram;
    this.gl.useProgram(glShaderProgram);

    var vertexCount = 0;

    for(var j=0; j<shaderProgram.attributeList.length;j++){
      const attribute = shaderProgram.attributeList[j];
      this.setIndex(attribute.index,attribute.indexdata);
      vertexCount = attribute.indexdata.length;
      //if(attribute.updateFlag == true){
        //console.log(`Updating attribute ${attribute.label}`);
        this.setBuffer(attribute.label,attribute.numComponents,attribute.buffer,attribute.data,attribute.index,attribute.indexdata);
        attribute.updateFlag = false;
      //}
    }
    //shaderProgram.attributeList = [];

    for(var j=0; j<shaderProgram.uniformList.length;j++){
      const uniform = shaderProgram.uniformList[j];
      if(uniform.label == "depthMin"){
        // console.log(this.programList[0].minmax.min);
        if(this.programList[0].minmax)this.setUniform(glShaderProgram,uniform.label,uniform.type, this.programList[0].minmax.min);
      }else if(uniform.label == "depthMax"){
        // console.log(this.programList[0].minmax.max);
        if(this.programList[0].minmax)this.setUniform(glShaderProgram,uniform.label,uniform.type, this.programList[0].minmax.max);
      }else{
        if(uniform.updateFlag == true){
          //console.log(`Updating uniform ${uniform.label}`);
          this.setUniform(glShaderProgram,uniform.label,uniform.type, uniform.data);
          uniform.updateFlag = false;
        }
      }
    }
    //shaderProgram.uniformList = [];

    //input
    for(var i=0; i<shaderProgram.inputList.length; i++){
      const label = shaderProgram.inputList[i].label;
      const location = this.gl.getUniformLocation(glShaderProgram,label);
        this.gl.uniform1i(location,i);
        this.gl.activeTexture(this.gl["TEXTURE"+i]);
      this.gl.bindTexture(this.gl.TEXTURE_2D, shaderProgram.inputList[i].data);
    }

    //output
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, output);
    if(output)
    this.gl.drawBuffers(this.getColorAttachementList(shaderProgram));


    this.gl.clearColor(
      shaderProgram.clearColor[0],
      shaderProgram.clearColor[1],
      shaderProgram.clearColor[2],
      shaderProgram.clearColor[3],
    );  // Clear to black, fully opaque
    this.gl.clearDepth(1.0);                 // Clear everything

    this.gl.enable(this.gl.BLEND);
    //this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.blendFuncSeparate(
      shaderProgram.blending.rgb.sfactor,
      shaderProgram.blending.rgb.dfactor,
      shaderProgram.blending.alpha.sfactor,
      shaderProgram.blending.alpha.dfactor)
    this.gl.blendEquationSeparate(
      shaderProgram.blending.rgb.expression,
      shaderProgram.blending.alpha.expression);
    this.gl.enable(this.gl.CULL_FACE);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); // Clear the canvas before we start drawing on it.
    {
      const type = this.gl.UNSIGNED_SHORT;
      const offset = 0;
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }

    if(shaderProgram.normalize){
      // console.log("Normalization operation started");
      const pixels = this.getTextureMinMax(shaderProgram.outputList[0]);
      //console.log(pixels);
      var min = Number.MAX_VALUE;
      var max = Number.MIN_VALUE;
      for(var i = 0; i<pixels.length;i+=4){
        if(pixels[i]<min)min = pixels[i];
        if(pixels[i+3]>max)max = pixels[i];
      }
      shaderProgram.minmax = {min:min, max:max};
    }
  }

  runPipeline(){
    for(var i = 0; i<this.programList.length; i++){
      const shaderProgram = this.programList[i];
      //i++;
      const output = (i < this.programList.length-1)?shaderProgram.frameBuffer:null;
      //const output = null;

      this.drawScene(shaderProgram, output);
    }
  }

  //
  // Initialize a shader program, so WebGL knows how to draw our data
  //
  initShaderProgram(vsSource, fsSource) {
    const program = {
      vertexShader: this.loadShader(this.gl, this.gl.VERTEX_SHADER, vsSource),
      fragmentShader: this.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource),
      glShaderProgram: this.gl.createProgram(),
      inputList: [],
      frameBuffer: null,
      blending: {
        rgb:{
          sfactor:this.gl.ONE,
          dfactor:this.gl.ZERO,
          expression:this.gl.FUNC_ADD
        },
        alpha:{
          sfactor:this.gl.ONE,
          dfactor:this.gl.ZERO,
          expression:this.gl.FUNC_ADD
        }},
      clearColor: [0.0,0.0,0.0,0.0],
      outputList: [],
      attributeList: [],
      uniformList: [],
      normalize: false,
      minmax: null,
    }

    // Create the shader program
    this.gl.attachShader(program.glShaderProgram, program.vertexShader);
    this.gl.attachShader(program.glShaderProgram, program.fragmentShader);
    this.gl.linkProgram(program.glShaderProgram);
    if (!this.gl.getProgramParameter(program.glShaderProgram, this.gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(program.glShaderProgram));
      return null;
    }

    // Create and bind the framebuffer
    program.frameBuffer = this.gl.createFramebuffer();

    this.programList.push(program);
    return(program);
  }

  addProgramOutput(program){
    // Create a texture to render to
    const targetTextureWidth = this.canvas.width;
    const targetTextureHeight = this.canvas.height;
    const outTexture = this.gl.createTexture();
    const i = program.outputList.length;
    this.gl.bindTexture(this.gl.TEXTURE_2D, outTexture);

    {
      // define size and format of level 0
      const level = 0;
      // const internalFormat = this.gl.RGBA;
      const internalFormat = this.gl.RGBA32F;
      const border = 0;
      const format = this.gl.RGBA;
      // const type = this.gl.UNSIGNED_BYTE;
      const type = this.gl.FLOAT;
      const data = null;
      this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);

      // set the filtering so we don't need mips
      this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    }

    // attach the texture as the first color attachment
    const attachmentPoint = this.gl[`COLOR_ATTACHMENT${i}`];
    const level = 0;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, program.frameBuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachmentPoint, this.gl.TEXTURE_2D, outTexture, level);

    program.outputList.push(outTexture);
  }

  getTextureMinMax(texture){
    const gl = this.gl;

    // make a framebuffer
    const fb = gl.createFramebuffer();

    // make this the current frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture to the framebuffer.
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, texture, 0);

    // check if you can read from this type of texture.
    const canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);

    var pixels;
    if (canRead) {
      const x = 0;
      const y = 0;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const format = gl.RGBA;
      pixels = new Float32Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
      gl.readPixels(x, y, width, height, format, gl.FLOAT, pixels, 0);
    }

    // Unbind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return pixels;
  }

  getColorAttachementList(program){
    const colorAttachementList = [];
    const n = program.outputList.length;
    for(var i=0; i<n; i++){
      const attachmentPoint = this.gl[`COLOR_ATTACHMENT${i}`];
      colorAttachementList.push(attachmentPoint);
    }
    return colorAttachementList;
  }

  //Shader compilation
  loadShader(gl, type, source) {
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
}
