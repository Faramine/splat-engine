#version 300 es

#define PI 3.1415926538
#define MAX_TEXTURE_WIDTH 4096

in vec4 aVertexPosition;
in vec2 aTextureCoord;

uniform sampler2D input_splatMask;
uniform sampler2D input_anchorPositions;
uniform sampler2D input_anchorNormals;
uniform sampler2D input_anchorProperties;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform highp vec4 uMaterialColorList[16];
uniform highp vec4 uMaterialPropertyList[16];
uniform highp vec4 uObjectMatrix[64];

out vec4 worldPosition;
out vec4 relativePosition;
out highp vec2 vTextureCoord;

out highp vec3 cameraPosition;

flat out highp int anchorID;
//flat out highp int objectID;
flat out highp int materialID;


out highp vec4 anchorNormal;

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

float atan2(in float y, in float x){
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

float angle(vec3 v1,vec3 v2){
  vec2 n1 = normalize(v1.xy);
  vec2 n2 = normalize(v2.xy);

  return atan2(n1.x*n2.y-n1.y*n2.x,n1.x*n2.x+n1.y*n2.y);
}

void main(void) {
  vTextureCoord = aTextureCoord;

  int anchorIndex = int(floor(float(gl_VertexID)/4.0));
	anchorID = anchorIndex;
	ivec2 anchorTexel = ivec2(
														anchorIndex % MAX_TEXTURE_WIDTH,
														anchorIndex / MAX_TEXTURE_WIDTH
													);
  //vec4 anchorPosition = vec4(uAnchorPositions[anchorIndex],0.0);
  vec4 anchorPosition = texelFetch(input_anchorPositions,anchorTexel,0);
	// anchorPosition.xyz = vec3(0.0,0.0,-8.0);

	highp vec4 propertyVector = texelFetch(input_anchorProperties,anchorTexel,0);
	int objectID = int(floor(propertyVector.x));
	materialID = int(floor(propertyVector.y));

	highp mat4 objectModelMatrix;
	objectModelMatrix[0] = -uObjectMatrix[objectID*4+0];
	objectModelMatrix[1] = -uObjectMatrix[objectID*4+1];
	objectModelMatrix[2] = -uObjectMatrix[objectID*4+2];
	objectModelMatrix[3] = uObjectMatrix[objectID*4+3];

	vec4 projectedPosition = (uViewMatrix * objectModelMatrix * uModelMatrix * anchorPosition);
  anchorNormal = texelFetch(input_anchorNormals,anchorTexel,0);
  vec4 projectedNormal = vec4(normalize((uViewMatrix * uModelMatrix * anchorNormal).xy),0.0,0.0);

	highp mat4 inverseViewMatrix = inverse(uViewMatrix);

  vec3 CameraRight_worldspace = vec3(inverseViewMatrix[0][0], inverseViewMatrix[0][1], inverseViewMatrix[0][2]);
  vec3 CameraUp_worldspace = vec3(inverseViewMatrix[1][0], inverseViewMatrix[1][1], inverseViewMatrix[1][2]);
  vec3 CameraFront_worldspace = vec3(inverseViewMatrix[2][0], inverseViewMatrix[2][1], inverseViewMatrix[2][2]);
	highp vec3 CameraPosition_worldspace = -vec3(inverseViewMatrix[3][0], inverseViewMatrix[3][1], inverseViewMatrix[3][2]);

	// float size = 1.0;
  float size = 0.1;

  vec4 vertexPosition = vec4(
    anchorPosition.xyz
    + CameraRight_worldspace * aVertexPosition.x * size
    + CameraUp_worldspace * aVertexPosition.y * size,
    aVertexPosition.w);

	float rotation_angle = angle(projectedNormal.xyz,vec3(0.0,-1.0,0.0));
  vertexPosition.xyz = rotate3D(vertexPosition.xyz-anchorPosition.xyz,CameraFront_worldspace,rotation_angle)+anchorPosition.xyz;


	vec3 vectorToCamera = normalize(CameraPosition_worldspace - anchorPosition.xyz);
  float distanceToCamera = projectedPosition.z;

	float anchorDistanceToCamera = length(anchorPosition.xyz-CameraPosition_worldspace);
	float vertexDistanceToCamera = length(vertexPosition.xyz-CameraPosition_worldspace);

	worldPosition = vertexPosition;
	cameraPosition = CameraPosition_worldspace;
  gl_Position = uProjectionMatrix * uViewMatrix * objectModelMatrix * uModelMatrix * vertexPosition;
}
