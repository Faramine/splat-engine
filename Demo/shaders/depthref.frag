#version 300 es

uniform sampler2D input_splatMask;
uniform sampler2D input_minMaxDepthMap;

uniform highp float screenWidth;
uniform highp float screenHeight;

uniform highp float depthMin;
uniform highp float depthMax;

uniform highp float uDepthMin;
uniform highp float uDepthMax;

in highp vec4 worldPosition;
in highp vec2 vTextureCoord;

in highp vec3 cameraPosition;

layout(location = 0) out highp vec4 fragDepthRef;

void main(void) {
  highp vec4 mask = texture(input_splatMask, vTextureCoord);
  highp vec2 fragCoord = vec2(
    gl_FragCoord.x/screenWidth,
    gl_FragCoord.y/screenHeight);
  highp vec4 minMaxDepthMap = texture(input_minMaxDepthMap, fragCoord);

  highp float alpha = mask.x;

  highp float depth = length(worldPosition.xyz-cameraPosition);
  //getting the bounds of the depth values over all the fragments at this position
    // highp float minDepth = minMaxDepthMap.x;
    // highp float maxDepth = minMaxDepthMap.w;
    // highp float minDepth = depthMin;
    // highp float maxDepth = depthMax;
    // highp float minDepth = 0.0;
    // highp float maxDepth = 8.0;
    highp float minDepth = uDepthMin-pow(2.0,0.5);
    highp float maxDepth = uDepthMax+pow(2.0,0.5);
  //computing the normalized depth value
  highp float depthRef;
  highp float normalizedDepth = (depth-minDepth)/(maxDepth-minDepth);
  depthRef = alpha*(normalizedDepth-1.0)+1.0;

  fragDepthRef = vec4(depthRef,0.0,0.0,0.0);
}
