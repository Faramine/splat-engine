class Camera{
  constructor(){
    this.key_vector = {x:0.0,y:0.0,z:0.0};
    this.camera_position = {x:0.0,y:0.0,z:-2.0};
    this.camera_yaw = 0.0;
    this.camera_yaw_velocity = 0.0;
    this.camera_pitch = 0.0;
    this.camera_pitch_velocity = 0.0;
  }

  setCameraFromMouse(x,y){
    this.camera_yaw += x*0.003;
    this.camera_pitch += y*0.003;
    this.camera_pitch = clamp(this.camera_pitch,-0.5*Math.PI,0.5*Math.PI)
  }

  setCameraFromKeys(keys){
    this.key_vector = {
      x:keys.q-keys.d,
      y:0.0,
      z:keys.z-keys.s,
    }
  }

  update(deltaTime){
    //console.log(this.camera_yaw_velocity);
    //this.camera_yaw += this.camera_yaw_velocity;

    const a = this.camera_yaw;
    const cosa = Math.cos(a);
    const sina = Math.sin(a);
    const kx = this.key_vector.x;
    const kz = this.key_vector.z;
    const offset_vector = normalize({
      x:cosa*kx - sina*kz,
      y:0.0,
      z:sina*kx + cosa*kz,
    });

    const speed = 0.03;
    this.camera_position = vec3add(this.camera_position,vec3factor(offset_vector,speed));
  }

  get viewMatrix() {
    const vm = mat4.create();
    mat4.rotate(vm,  // destination matrix
                vm,  // matrix to rotate
                this.camera_pitch,     // amount to rotate in radians
                [1, 0, 0]);       // axis to rotate around (Z)
    mat4.rotate(vm,  // destination matrix
                vm,  // matrix to rotate
                this.camera_yaw,// amount to rotate in radians
                [0, 1, 0]);       // axis to rotate around (X)
    mat4.translate( vm,     // destination matrix
                  vm,     // matrix to translate
                  [this.camera_position.x, this.camera_position.y, this.camera_position.z]);  // amount to translate
    return vm;
  }
}
