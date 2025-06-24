class MarkScene{
  constructor(){
    this.objectList = [];
    this.materialList = [];

    //Initializing default material
    this.addMaterial(1.0,1.0,1.0);
  }

  addMesh(vertices){
    const markObject = {
      mesh:[],
      id:this.objectList.length,
      matrix:mat4.create(),
      material:0,
    };
    const n_polygons = Math.floor(vertices.length/3);

    for(var i = 0; i<n_polygons; i++){
      markObject.mesh.push({
          v1:getVertice(i*3,vertices),
          v2:getVertice(i*3+1,vertices),
          v3:getVertice(i*3+2,vertices),
        });
    }

    this.objectList.push(markObject);
    return(markObject);
  }

  addMaterial(r,g,b){
    const material = {
      color:{r:r,g:g,b:b,a:1.0},
      shininess:0.5,
      splatID:0,
      }
    this.materialList.push(material);
  }

  /*addMesh(vertices, triangles){
    const mesh = [];

    for(var i = 0; i<Math.floor(triangles.length/3); i++){
      mesh.push(getPolygon(i));
    }

    this.objectList.push(mesh);
  }*/

  populateMesh(n_anchor, object, id){
    const anchor_positions = [];
    const anchor_normals = [];
    const anchor_properties = [];
    const radius = 1.0;

    const mesh = object.mesh;

    var i=0
    var computed_i= 0;
    const max_computed_i=n_anchor*100.0;
    while(i < n_anchor){
      const position = {x:random(-radius,radius),y:random(-radius,radius),z:random(-radius,radius)};
      // const position = {x:0.0, y:i*0.1, z:0.0};
      var info = isInsideMesh(position,mesh)
      if(info && info.distance < 0.1){
        anchor_positions.push(position);
        anchor_normals.push(info.polygon_normal);
        anchor_properties.push({objectID:object.id,materialID:object.material});
        i++;
      }
      computed_i++;
      progress = i/n_anchor;
    }
    //console.log(anchorList);
    return [anchor_positions, anchor_normals, anchor_properties];
  }

  populatePolygon(n_anchor){
    console.log("Populating polygon");
    const polygon = getPolygon(0);

    const anchorList = [];
    const radius = 1.5;

    var i=0
    while(i < n_anchor){
      const position = {x:random(-radius,radius),y:random(-radius,radius),z:random(-radius,radius)};
      if(isInsidePolygon(position,polygon)){
        anchorList.push(position);
        i++;
      }
    }
    //console.log(anchorList);
    return anchorList;
  }

  extractVertices(){
    const n_anchorPerObject = 4096/2;
    // const n_anchorPerObject = 2;
    // const n_anchorPerObject = 1;
    var anchor_positions = [];
    var anchor_normals = [];
    var anchor_properties = [];

    for(var i = 0; i<this.objectList.length;  i++){
      const object = this.objectList[i];
      var [i_anchor_positions, i_anchor_normals, i_anchor_properties] = this.populateMesh(n_anchorPerObject,object);
      anchor_positions = anchor_positions.concat(i_anchor_positions);
      anchor_normals = anchor_normals.concat(i_anchor_normals);
      anchor_properties = anchor_properties.concat(i_anchor_properties);
    }

    return [anchor_positions.length,anchor_positions, anchor_normals, anchor_properties];
  }

  extractTestVertices(){
    const distance = 1.0;

    const normal = {x:0.0,y:-1.0,z:0.0}

    const anchor_positions = [
      {x:0.0,y:0.0,z:0.0},
      {x:0.0,y:0.0,z:-distance},
      {x:0.0,y:0.0,z:distance},
      {x:0.0,y:0.0,z:-distance*2},
      // {x:distance*3.0,y:0.0,z:distance*2},
    ];
    const anchor_normals = [];
    const anchor_properties = [];
    for(var i = 0; i<anchor_positions.length; i++){
      anchor_properties.push({objectID:0,materialID:i});
      anchor_normals.push(normal);
    }
    return [anchor_positions.length,anchor_positions, anchor_normals, anchor_properties];
  }
}
