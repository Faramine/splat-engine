const container_ID = "app-content"; //target div for the svg canvas
const canvas_ID = "gl_canvas";

const loading_bar = document.getElementById("loading-bar");
const loading_text = document.getElementById("loading-text");

var progress = 0;
function setLoadingBar(x){
  //loading_bar.style.width = `${x*100}%`;
  //loading_text.innerHTML = `Loading : ${Math.floor(x*100)}%`;
  //console.log(`Loading : ${x*100}%`);
}
setLoadingBar(progress);

(function asyncLoop() {
    setLoadingBar(progress);
    progress += random(0.2,0.5);
    if (progress < 1.0) {
        setTimeout(asyncLoop, 1);
    }
})();


var container_block = document.getElementById(container_ID);
const canvas_size = {width: container_block.offsetWidth, height: container_block.offsetHeight};

container_block.innerHTML =
`<canvas id="${canvas_ID}" width="${canvas_size.width}" height="${canvas_size.height}">
</canvas>`;

const canvas = document.getElementById(canvas_ID);
const my_GLcanvas = new GLcanvas(canvas);

// Vertex shader program

async function fetchString(url){
  const response = await fetch(url);
  const string = await response.text();
  return string;
}

var then = 0;
var vs_splatting = null;
var fs_splatting = null;
var fs_minmax = null;
var vs_blending = null;
var fs_blending = null;
var objSource_0 = null;
var objSource_1 = null;

async function getFiles() {
  vs_splatting = await fetchString('./Demo/shaders/splatting.vert');
  fs_splatting = await fetchString('./Demo/shaders/splatting.frag');
  fs_minmax = await fetchString('./Demo/shaders/minmax.frag');
  fs_alpharef = await fetchString('./Demo/shaders/alpharef.frag');
  fs_depthref = await fetchString('./Demo/shaders/depthref.frag');

  vs_blending = await fetchString('./Demo/shaders/blending.vert');
  fs_blending = await fetchString('./Demo/shaders/blending.frag');




  objSource_0 = await fetchString('./Demo/objects/donut.obj');
  objSource_1 = await fetchString('./Demo/objects/frame.obj');
}

var viewMatrix = []
var depthMin = []
var depthMax = []

const vertexPositionArray = [];
const texturePositionArray = [];
var anchorIdArray = [];
const indexArray = [];

const fieldOfView = 45 * Math.PI / 180;   // in radians
const aspect = canvas_size.width / canvas_size.height;
const zNear = 0.1;
const zFar = 100.0;
const projectionMatrix = mat4.create();

mat4.perspective(projectionMatrix,
                 fieldOfView,
                 aspect,
                 zNear,
                 zFar);
const modelMatrix = mat4.create();

const colorArray = new Float32Array([0.9,0.1,0.8,0.3]);
const anchorPositions = [];
var anchorPositions32 = null;

function populateSphere(n_anchor){
  const anchorList = [];
  const radius = 1.0;
  var i=0
  while(i < n_anchor){
    const position = {x:random(-radius,radius),y:random(-radius,radius),z:random(-radius,radius)};
    if(v3length(position)<1.0 && v3length(position)>0.5){
      anchorList.push(position);
      i++
    }
  }
  console.log(anchorList);
  return anchorList;
}

//Camera initialization and camera events---------------------------------------
const camera = new Camera();
const keys={
  z:false,
  s:false,
  q:false,
  d:false,
}

canvas.onmousedown = function(event) {
  switch (event.which) {
  case 1:
    canvas.requestPointerLock();
    break;
  case 3:
    document.exitPointerLock();
    for (const property in keys) {
      keys[property] = false;
    }
    camera.setCameraFromKeys(keys);
    break;
  }
}

window.addEventListener('contextmenu', function (e) {
  // do something here...
  e.preventDefault();
}, false);

canvas.addEventListener('mousemove', e => {
  if(document.pointerLockElement == canvas){
    camera.setCameraFromMouse(e.movementX,e.movementY);
  }
});

document.body.addEventListener('keydown', (e) => {
  if(document.pointerLockElement == canvas){
    if(keys.hasOwnProperty(e.key))keys[e.key] = true;
    camera.setCameraFromKeys(keys);
  }
});

document.body.addEventListener('keyup', (e) => {
  if(document.pointerLockElement == canvas){
    if(keys.hasOwnProperty(e.key))keys[e.key] = false;
    camera.setCameraFromKeys(keys);
  }
});
//------------------------------------------------------------------------------

var n_anchor = null;
var anchor_positions = null;
var anchor_normals = null;
var anchor_properties = null;

var scene = null;

async function main(){
  await getFiles();
  // var brush_mask_texture = my_GLcanvas.loadTexture('./Demo/images/airbrush_mask_0.png');
  // var brush_mask_texture = my_GLcanvas.loadTexture('./Demo/images/square_mask_0.png');
  // var brush_mask_texture = my_GLcanvas.loadTexture('./Demo/images/leaf_mask_0.png');
  var brush_mask_texture = my_GLcanvas.loadTexture('./Demo/images/brush_mask_0.png');
  var object_data_0 = parseOBJ(objSource_0);
  var object_data_1 = parseOBJ(objSource_1);

  scene = new MarkScene();

  scene.addMaterial(252/255, 186/255, 3/255);
  scene.addMaterial(180/255, 30/255, 30/255);
  scene.addMaterial(0/255, 171/255, 202/255);
  scene.addMaterial(90/255, 220/255, 50/255);

  const mesh_0 = scene.addMesh(object_data_1.position);
  mat4.translate(mesh_0.matrix,mesh_0.matrix,[-1.0,1.0,-1.0]);
  mesh_0.material = 0;

  const mesh_1 = scene.addMesh(object_data_1.position);
  mat4.translate(mesh_1.matrix,mesh_1.matrix,[0.0,0.0,0.0]);
  mesh_1.material = 1;

  const star_time = Date.now();
  [n_anchor, anchor_positions, anchor_normals, anchor_properties] = scene.extractVertices();
  // [n_anchor, anchor_positions, anchor_normals, anchor_properties] = scene.extractTestVertices();
  const end_time = Date.now();
  console.log(`Total anchor points generated : ${n_anchor} (${end_time-star_time} ms)`);

  const materialColorList = [];
  const materialPropertyList = [];

  const objectMatrixList = [];

  {
    for(var i = 0; i<scene.objectList.length; i++){
      const object = scene.objectList[i];
      const matrix = object.matrix;
      objectMatrixList.push(...matrix);
    }
    //console.log(objectMatrixList)
  }

  {
    for(var i = 0; i<scene.materialList.length; i++){
      const material = scene.materialList[i];
      materialColorList.push(
        material.color.r,
        material.color.g,
        material.color.b,
        material.color.a,
      )
      materialPropertyList.push(
        material.shininess,
        0.0,
        0.0,
        material.splatID,
      )
    }
  }


  {
    const anchorPositionsRGBA = [];
    const anchorNormalsRGBA = [];
    const anchorPropertiesRGBA = [];

    for(var i = 0; i<n_anchor; i++){
      vertexPositionArray.push(
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0,
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0
      );
      texturePositionArray.push(
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0
      );
      indexArray.push(
        4*i,  4*i+1,  4*i+2,      4*i,  4*i+2,  4*i+3
      );
      anchorPositionsRGBA.push(anchor_positions[i].x,anchor_positions[i].y,anchor_positions[i].z,0.0);
      anchorNormalsRGBA.push(anchor_normals[i].x,anchor_normals[i].y,anchor_normals[i].z,0.0);
      anchorPropertiesRGBA.push(anchor_properties[i].objectID,anchor_properties[i].materialID,0.0,0.0);
    }
    var anchorPositionsRGBA_texture = my_GLcanvas.arrayTexture(anchorPositionsRGBA);
    var anchorNormalsRGBA_texture = my_GLcanvas.arrayTexture(anchorNormalsRGBA);
    var anchorPropertiesRGBA_texture = my_GLcanvas.arrayTexture(anchorPropertiesRGBA);
  }


  // SPLATTING + MIN MAX PASS --------------------------------------------------
  console.log("Initializing program : SPLATTING + MIN MAX PASS");
  //Initializing program
  const program_dminmax = my_GLcanvas.initShaderProgram(vs_splatting, fs_minmax);
  my_GLcanvas.addProgramOutput(program_dminmax);
  program_dminmax.blending.rgb.expression = my_GLcanvas.gl.MIN;
  program_dminmax.blending.alpha.expression = my_GLcanvas.gl.MAX;
  program_dminmax.clearColor = [Number.MAX_VALUE,0.0,0.0,Number.MIN_VALUE];
  // program_dminmax.normalize = true;
  //Adding inputs
  my_GLcanvas.defineInput(program_dminmax,'input_splatMask',brush_mask_texture);
  my_GLcanvas.defineInput(program_dminmax,'input_anchorPositions',anchorPositionsRGBA_texture);
  my_GLcanvas.defineInput(program_dminmax,'input_anchorNormals',anchorNormalsRGBA_texture);
  my_GLcanvas.defineInput(program_dminmax,'input_anchorProperties',anchorPropertiesRGBA_texture);
  //Adding Attributes
  my_GLcanvas.defineAttribute(program_dminmax,'aVertexPosition', 3, vertexPositionArray,indexArray);
  my_GLcanvas.defineAttribute(program_dminmax,'aTextureCoord', 2, texturePositionArray,indexArray);
  //Adding uniforms
  my_GLcanvas.defineUniform(program_dminmax,'uModelMatrix','Matrix4fv',modelMatrix);
  viewMatrix.push(my_GLcanvas.addUniform(program_dminmax,'uViewMatrix','Matrix4fv'));
  my_GLcanvas.defineUniform(program_dminmax,'uProjectionMatrix','Matrix4fv',projectionMatrix);
  my_GLcanvas.defineUniform(program_dminmax,'uMaterialColorList','4fv',materialColorList);
  my_GLcanvas.defineUniform(program_dminmax,'uObjectMatrix','4fv',objectMatrixList);

  // SPLATTING + ALPHA REF PASS --------------------------------------------------
  console.log("Initializing program : SPLATTING + ALPHA REF PASS");
  //Initializing program
  const program_aref = my_GLcanvas.initShaderProgram(vs_splatting, fs_alpharef);
  my_GLcanvas.addProgramOutput(program_aref);
  program_aref.blending.rgb.expression = my_GLcanvas.gl.FUNC_ADD;
  program_aref.blending.rgb.sfactor = my_GLcanvas.gl.ZERO;
  program_aref.blending.rgb.dfactor = my_GLcanvas.gl.ONE_MINUS_SRC_COLOR;
  program_aref.clearColor = [1.0,0.0,0.0,0.0];
  //Adding inputs
  my_GLcanvas.defineInput(program_aref,'input_splatMask',brush_mask_texture);
  my_GLcanvas.defineInput(program_aref,'input_anchorPositions',anchorPositionsRGBA_texture);
  my_GLcanvas.defineInput(program_aref,'input_anchorNormals',anchorNormalsRGBA_texture);
  my_GLcanvas.defineInput(program_aref,'input_anchorProperties',anchorPropertiesRGBA_texture);
  //Adding Attributes
  my_GLcanvas.defineAttribute(program_aref,'aVertexPosition', 3, vertexPositionArray,indexArray);
  my_GLcanvas.defineAttribute(program_aref,'aTextureCoord', 2, texturePositionArray,indexArray);
  //Adding uniforms
  my_GLcanvas.defineUniform(program_aref,'uModelMatrix','Matrix4fv',modelMatrix);
  viewMatrix.push(my_GLcanvas.addUniform(program_aref,'uViewMatrix','Matrix4fv'));
  my_GLcanvas.defineUniform(program_aref,'uProjectionMatrix','Matrix4fv',projectionMatrix);
  my_GLcanvas.defineUniform(program_aref,'uMaterialColorList','4fv',materialColorList);
  my_GLcanvas.defineUniform(program_aref,'uObjectMatrix','4fv',objectMatrixList);

  // SPLATTING + DEPTH REF PASS --------------------------------------------------
  console.log("Initializing program : SPLATTING + DEPTH REF PASS");
  //Initializing program
  const program_dref = my_GLcanvas.initShaderProgram(vs_splatting, fs_depthref);
  my_GLcanvas.addProgramOutput(program_dref);
  program_dref.blending.rgb.expression = my_GLcanvas.gl.MIN;
  program_dref.clearColor = [Number.MAX_VALUE,0.0,0.0,0.0];
  //Adding inputs
  my_GLcanvas.defineInput(program_dref,'input_splatMask',brush_mask_texture);
  my_GLcanvas.defineInput(program_dref,'input_anchorPositions',anchorPositionsRGBA_texture);
  my_GLcanvas.defineInput(program_dref,'input_anchorNormals',anchorNormalsRGBA_texture);
  my_GLcanvas.defineInput(program_dref,'input_anchorProperties',anchorPropertiesRGBA_texture);
  my_GLcanvas.defineInput(program_dref,'input_minMaxDepthMap',program_dminmax.outputList[0]);
  //Adding Attributes
  my_GLcanvas.defineAttribute(program_dref,'aVertexPosition', 3, vertexPositionArray,indexArray);
  my_GLcanvas.defineAttribute(program_dref,'aTextureCoord', 2, texturePositionArray,indexArray);
  //Adding uniforms
  my_GLcanvas.defineUniform(program_dref,'screenWidth','1f',my_GLcanvas.canvas.width);
  my_GLcanvas.defineUniform(program_dref,'screenHeight','1f',my_GLcanvas.canvas.height);
  my_GLcanvas.defineUniform(program_dref,'depthMin','1f',program_dminmax.minmax);
  my_GLcanvas.defineUniform(program_dref,'depthMax','1f',program_dminmax.minmax);
  depthMin.push(my_GLcanvas.addUniform(program_dref,'uDepthMin','1f'));
  depthMax.push(my_GLcanvas.addUniform(program_dref,'uDepthMax','1f'));
  my_GLcanvas.defineUniform(program_dref,'uModelMatrix','Matrix4fv',modelMatrix);
  viewMatrix.push(my_GLcanvas.addUniform(program_dref,'uViewMatrix','Matrix4fv'));
  my_GLcanvas.defineUniform(program_dref,'uProjectionMatrix','Matrix4fv',projectionMatrix);
  my_GLcanvas.defineUniform(program_dref,'uMaterialColorList','4fv',materialColorList);
  my_GLcanvas.defineUniform(program_dref,'uObjectMatrix','4fv',objectMatrixList);

  // SPLATTING + VISIBILITY COMPUTATION AND SUM --------------------------------
  console.log("Initializing program : SPLATTING + VISIBILITY COMPUTATION AND SUM");
  //Initializing program
  const program_splatting = my_GLcanvas.initShaderProgram(vs_splatting, fs_splatting);
  my_GLcanvas.addProgramOutput(program_splatting);
  my_GLcanvas.addProgramOutput(program_splatting);
  program_aref.blending.rgb.expression = my_GLcanvas.gl.FUNC_ADD;
  program_aref.blending.alpha.expression = my_GLcanvas.gl.FUNC_ADD;
  program_splatting.blending.rgb.dfactor = my_GLcanvas.gl.ONE;
  program_splatting.blending.alpha.dfactor = my_GLcanvas.gl.ONE;
  program_splatting.blending.rgb.sfactor = my_GLcanvas.gl.ONE;
  program_splatting.blending.alpha.sfactor = my_GLcanvas.gl.ONE;
  //Adding inputs
  my_GLcanvas.defineInput(program_splatting,'input_splatMask',brush_mask_texture);
  my_GLcanvas.defineInput(program_splatting,'input_anchorPositions',anchorPositionsRGBA_texture);
  my_GLcanvas.defineInput(program_splatting,'input_anchorNormals',anchorNormalsRGBA_texture);
  my_GLcanvas.defineInput(program_splatting,'input_anchorProperties',anchorPropertiesRGBA_texture);
  my_GLcanvas.defineInput(program_splatting,'input_depthRefMap',program_dref.outputList[0]);
  my_GLcanvas.defineInput(program_splatting,'input_minMaxDepthMap',program_dminmax.outputList[0]);
  my_GLcanvas.defineInput(program_splatting,'input_alphaRefMap',program_aref.outputList[0]);
  //Adding Attributes
  my_GLcanvas.defineAttribute(program_splatting,'aVertexPosition', 3, vertexPositionArray,indexArray);
  my_GLcanvas.defineAttribute(program_splatting,'aTextureCoord', 2, texturePositionArray,indexArray);
  //Adding uniforms
  my_GLcanvas.defineUniform(program_splatting,'screenWidth','1f',my_GLcanvas.canvas.width);
  my_GLcanvas.defineUniform(program_splatting,'screenHeight','1f',my_GLcanvas.canvas.height);
  my_GLcanvas.defineUniform(program_splatting,'depthMin','1f',program_dminmax.minmax);
  my_GLcanvas.defineUniform(program_splatting,'depthMax','1f',program_dminmax.minmax);
  depthMin.push(my_GLcanvas.addUniform(program_splatting,'uDepthMin','1f'));
  depthMax.push(my_GLcanvas.addUniform(program_splatting,'uDepthMax','1f'));
  my_GLcanvas.defineUniform(program_splatting,'uModelMatrix','Matrix4fv',modelMatrix);
  viewMatrix.push(my_GLcanvas.addUniform(program_splatting,'uViewMatrix','Matrix4fv'));
  my_GLcanvas.defineUniform(program_splatting,'uProjectionMatrix','Matrix4fv',projectionMatrix);
  my_GLcanvas.defineUniform(program_splatting,'uMaterialColorList','4fv',materialColorList);
  my_GLcanvas.defineUniform(program_splatting,'uObjectMatrix','4fv',objectMatrixList);

  // BLENDING ------------------------------------------------------------------
  console.log("Initializing program : BLENDING");
  const program_3 = my_GLcanvas.initShaderProgram(vs_blending, fs_blending);
  // my_GLcanvas.addProgramOutput(program_3);
  my_GLcanvas.defineAttribute(program_3,'aVertexPosition', 3,
    [-1.0, -1.0,  0.0, 1.0, -1.0,  0.0, 1.0,  1.0,  0.0, -1.0,  1.0,  0.0],[0,1,2,0,2,3]);
  my_GLcanvas.defineAttribute(program_3,'aTextureCoord', 2,
    [ 0.0,  0.0, 1.0,  0.0, 1.0,  1.0, 0.0,  1.0], [0,1,2,0,2,3]);

  my_GLcanvas.defineInput(program_3,'colorBuffer',program_splatting.outputList[0]);
  my_GLcanvas.defineInput(program_3,'alphaBuffer',program_splatting.outputList[1]);

  my_GLcanvas.defineUniform(program_3,'uModelMatrix','Matrix4fv',modelMatrix);
  viewMatrix.push(my_GLcanvas.addUniform(program_3,'uViewMatrix','Matrix4fv'));
  my_GLcanvas.defineUniform(program_3,'uProjectionMatrix','Matrix4fv',projectionMatrix);

  requestAnimationFrame(render);
}

var then = 0;
var minmax;
var vM;
var iM;
function render(now){
  const deltaTime = now - then;
  then = now;

  camera.update(deltaTime);
  vM = camera.viewMatrix;
  iM = mat4.create();
  mat4.invert(iM,vM);

  minmax = {min:Number.MAX_VALUE,max:Number.MIN_VALUE};

  for(var i = 0; i < anchor_positions.length; i++){
    const anchorPos = anchor_positions[i];
    const camPos = camera.camera_position;
    camPos.z *= 1.0;
    const depth = v3length(vec3sub(anchorPos,camPos));
    if(depth<minmax.min)minmax.min = depth;
    if(depth>minmax.max)minmax.max = depth;
  }
  // console.log(minmax);

  for(var i = 0; i < viewMatrix.length; i++)
    my_GLcanvas.updateUniform(viewMatrix[i],vM);
  for(var i = 0; i < depthMin.length; i++)
    my_GLcanvas.updateUniform(depthMin[i],minmax.min);
  for(var i = 0; i < depthMax.length; i++)
    my_GLcanvas.updateUniform(depthMax[i],minmax.max);

  my_GLcanvas.runPipeline();

  requestAnimationFrame(render);
}

main();
