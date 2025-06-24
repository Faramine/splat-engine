function polygonCenter(p){
  const sx = p.v1.x + p.v2.x + p.v3.x;
  const sy = p.v1.y + p.v2.y + p.v3.y;
  const sz = p.v1.z + p.v2.z + p.v3.z;

  return {
      x:sx/3.0,
      y:sy/3.0,
      z:sz/3.0,
    }
}

function distanceToPolygon(v,p){
  const c = polygonCenter(p);
  return v3length({x:c.x-v.x,y:c.y-v.y,z:c.z-v.z,});
}

function closestPolygon(v,m){
  var closest_polygon_list = [];
  var min_dist = Number.MAX_VALUE;
  for(var i = 1; i<m.length; i++){
    const n = getPolygonNorm(m[i]);
    const d = distanceToPlane(v,m[i],n);
    if(d == 0){/*console.log("ALERT - NULL distance value");console.log(m[i]);*/continue;};
    if(d<min_dist){
      //console.log("New closest distance found : " + d);
      closest_polygon_list = [m[i]];
      min_dist = d;
    }else if(d == min_dist){
      //console.log("Same distance " + d);
      //The polygon is coplanar to the closest polygon/plane found so far
      closest_polygon_list.push(m[i]);
    }else{
      //console.log("Dismissed larger distance : " + d);
    }
  }

  //console.log("Closest polygons on the closest plane")
  //console.log(closest_polygon_list)

  /*
  const min_poly_dist = distanceToPolygon(v,closest_polygon);
  for(var i = 1; i<closest_polygon_list.length; i++){
    const poly_dist = distanceToPolygon(v,closest_polygon_list[i]);
    if(poly_dist < min_poly_dist){
      closest_polygon = closest_polygon_list[i];
      min_dist = poly_dist;
    }
  }
  */

  return closest_polygon_list;
}

function getPolygonNorm(p){
  const U = {x:p.v2.x-p.v1.x,y:p.v2.y-p.v1.y,z:p.v2.z-p.v1.z};
  const V = {x:p.v3.x-p.v1.x,y:p.v3.y-p.v1.y,z:p.v3.z-p.v1.z};
  return normalize(cross(U,V));
}



function sidePolygon(v,p){
  const c = polygonCenter(p);
  const vc = {x:v.x-c.x,
              y:v.y-c.y,
              z:v.z-c.z,};
  const n = getPolygonNorm(p);
  const d = -dot(vc,n);
  return (d>0);
}

function distanceToPlane(v,p,n){
  const vp = {x:v.x-p.v1.x,
              y:v.y-p.v1.y,
              z:v.z-p.v1.z,};

  return Math.abs(dot(vp,n));
}

function isInsideMesh(v,m){
  //console.log("Vertex position :");
  //console.log(v);
  const closest_polygon_list = closestPolygon(v,m);
  //console.log(`Found ${closest_polygon_list.length} polygons on the closest plane`);

  var inside = false;
  var info = {
    polygon_center:null,
    polygon_normal:null,
    distance:null,
  }

  var i = null;
  for(i = 0; i<closest_polygon_list.length ; i++){
    const side = sidePolygon(v,closest_polygon_list[i]);
    //console.log("Side : "+side);
    const bounds = isInsideBounds(v,closest_polygon_list[i]);
    //console.log("Bounds : " + (bounds?"in bounds":"out of bounds"));
    inside ||= side && bounds;
    if(inside)break;
  }

  if(inside){
    const polygon = closest_polygon_list[i];
    info.polygon_center = polygonCenter(polygon);
    info.polygon_normal = getPolygonNorm(polygon);
    info.distance = distanceToPlane(v,polygon,info.polygon_normal);
    return info;
  }else{
    return null
  }
}

function isInsideBounds(v,p){
  const n = getPolygonNorm(p);

  const edge_norm_1 = cross(vec3sub(p.v2,p.v1),n);
  const edge_norm_2 = cross(vec3sub(p.v3,p.v2),n);
  const edge_norm_3 = cross(vec3sub(p.v1,p.v3),n);

  const side_1 = -dot(vec3sub(v,p.v1),edge_norm_1);
  const side_2 = -dot(vec3sub(v,p.v2),edge_norm_2);
  const side_3 = -dot(vec3sub(v,p.v3),edge_norm_3);

  return side_1>0 && side_2>0 && side_3>0;
}

function isInsidePolygon(v,p){
  const n = getPolygonNorm(p);
  const d = distanceToPlane(v,p,n);
  const b = isInsideBounds(v,p);

  return d<0.2 && b;
}

function getVertex(i,vertices){
  const ix = i*3;
  const iy = ix+1;
  const iz = ix+2;

  return {x:vertices[ix],y:vertices[iy],z:vertices[iz]}
}

function getPolygon(i,triangles){
  const i1 = i*3;
  const i2 = i1+1;
  const i3 = i1+2;

  return {
      v1:getVertice(triangles[i1]),
      v2:getVertice(triangles[i2]),
      v3:getVertice(triangles[i3]),
    }
}
