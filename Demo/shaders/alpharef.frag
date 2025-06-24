#version 300 es

uniform sampler2D input_splatMask;

in highp vec4 worldPosition;
in highp vec2 vTextureCoord;

in highp vec3 cameraPosition;

layout(location = 0) out highp vec4 alphaRef;

void main(void) {
  highp vec4 mask = texture(input_splatMask, vTextureCoord);
  highp float alpha = mask.x;

  alphaRef = vec4(alpha,0.0,0.0,0.0);
  //The blending factors and equation of the current framebuffer allow for
  //the product of all the (1.0-alpha) of each computed fragment
}
