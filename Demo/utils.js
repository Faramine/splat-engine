function random(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
}

function v3length(v){
  var r = 0;
  r += Math.pow(v.x,2.0);
  r += Math.pow(v.y,2.0);
  r += Math.pow(v.z,2.0);
  return Math.pow(r,0.5);
}

function vec3add(u,v){
  return {x:u.x+v.x,
          y:u.y+v.y,
          z:u.z+v.z,};
}

function vec3sub(u,v){
  return {x:u.x-v.x,
          y:u.y-v.y,
          z:u.z-v.z,};
}

function vec3factor(u,f){
  return {x:u.x*f,
          y:u.y*f,
          z:u.z*f,};
}

function normalize(v){
  const l = v3length(v);
  if(l){
    return {x:v.x/l,y:v.y/l,z:v.z/l}
  }else{
    return v;
  };
}

function cross(U,V){
  return {x:U.y*V.z - U.z*V.y,
          y:U.z*V.x - U.x*V.z,
          z:U.x*V.y - U.y*V.x};
}

function dot(v1,v2){
  return v1.x*v2.x+v1.y*v2.y+v1.z*v2.z;
}
