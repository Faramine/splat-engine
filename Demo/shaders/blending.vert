#version 300 es

#define PI 3.1415926538

in vec4 aVertexPosition;
in vec2 aTextureCoord;

//unifomrs
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

//uniform textures
uniform sampler2D colorBuffer;
uniform sampler2D fragCountBuffer;

out highp vec2 vTextureCoord;
out highp vec3 vCameraPosition_worldspace;
out highp vec3 vCameraFront_worldspace;
out highp vec3 vCameraToVertex;
out highp vec3 vWorldPosition;

out highp vec3 origin;
out highp vec3 ray;

vec2 rotate2D(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate3D(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

float atan2(in float y, in float x)
{
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

float angle(vec3 v1,vec3 v2){
  vec2 n1 = normalize(v1.xy);
  vec2 n2 = normalize(v2.xy);

  return atan2(n1.x*n2.y-n1.y*n2.x,n1.x*n2.x+n1.y*n2.y);
}

void main(void) {
	vCameraPosition_worldspace = vec3(uViewMatrix[0][3], uViewMatrix[1][3], uViewMatrix[2][3]);
	vWorldPosition = (uViewMatrix * uModelMatrix * aVertexPosition).xyz;

	vec2 pos = aVertexPosition.xy;
	mat4 invprojview = inverse(uProjectionMatrix * uViewMatrix);
	float near = 0.1;
	float far = 100.0;
  origin = (invprojview * vec4(pos, -1.0, 1.0) * near).xyz;
  ray = (invprojview * vec4(pos * (far - near), far + near, far - near)).xyz;

	gl_Position = vec4(pos, 0.0, 1.0);
  //gl_Position = aVertexPosition;
	vTextureCoord = aTextureCoord;
}
