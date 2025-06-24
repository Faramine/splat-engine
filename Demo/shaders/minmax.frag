#version 300 es

uniform sampler2D input_splatMask;

in highp vec4 worldPosition;
in highp vec2 vTextureCoord;

in highp vec3 cameraPosition;

layout(location = 0) out highp vec4 fragDepthMinMax;

void main(void) {
  highp float depth = length(worldPosition.xyz-cameraPosition);
  fragDepthMinMax = vec4(depth,0.0,0.0,depth);
}
