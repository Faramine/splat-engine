#version 300 es

uniform sampler2D input_splatMask;
uniform sampler2D input_anchorPositions;
uniform sampler2D input_anchorNormals;
uniform sampler2D input_anchorProperties;
uniform sampler2D input_depthRefMap;
uniform sampler2D input_minMaxDepthMap;
uniform sampler2D input_alphaRefMap;

uniform highp float screenWidth;
uniform highp float screenHeight;

uniform highp float depthMin;
uniform highp float depthMax;

uniform highp float uDepthMin;
uniform highp float uDepthMax;

uniform highp vec4 uMaterialColorList[16];
uniform highp vec4 uMaterialPropertyList[16];

uniform highp mat4 uViewMatrix;

in highp vec4 worldPosition;
in highp vec4 relativePosition;
in highp vec2 vTextureCoord;

in highp vec3 cameraPosition;

flat in highp int anchorID;
in highp vec4 anchorNormal;
flat in highp int materialID;

layout(location = 0) out highp vec4 fragColor;
layout(location = 1) out highp vec4 fragAlpha;

highp float randv4tof(highp vec4 v, highp float seed){
    return fract(sin(dot(v, vec4(12.9898, 78.233, 5481.2, 485.12))) * seed);
}

highp float randftof(highp float v, highp float seed){
    return fract(sin(dot(vec4(v), vec4(12.9898, 78.233, 5481.2, 485.12))) * seed);
}

highp vec3 rgb2hsv(highp vec3 c)
{
    highp vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    highp vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    highp vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    highp float d = q.x - min(q.w, q.y);
    highp float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

highp vec3 hsv2rgb(highp vec3 c)
{
    highp vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    highp vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(void) {
  highp vec4 mask = texture(input_splatMask, vTextureCoord);
  highp vec2 fragCoord = vec2(
    gl_FragCoord.x/screenWidth,
    gl_FragCoord.y/screenHeight);
  highp vec4 depthRefMap = texture(input_depthRefMap, fragCoord);
  highp vec4 minMaxDepthMap = texture(input_minMaxDepthMap, fragCoord);
  highp vec4 alphaRefMap = texture(input_alphaRefMap, fragCoord);


  highp float brightness = clamp(dot(-anchorNormal.xyz,normalize(vec3(1.0,1.0,1.0)))*1.0+0.5,0.4,1.0);

  //highp vec3 baseColor = vec3(0.9,0.8,0.2);
  highp vec3 baseColor = uMaterialColorList[materialID+1].xyz;
  highp vec3 hsvColor = rgb2hsv(baseColor);

  bool shading = true;

  if(shading){
    hsvColor.x -= (1.0-brightness)*0.1;
    hsvColor.y = 1.0-brightness+0.7;
    hsvColor.z = brightness-0.03;

    hsvColor.x += (randftof(float(anchorID),43758.5453)-0.5)*0.05;
    hsvColor.y += (randftof(float(anchorID),81212.8513)-0.5)*0.05;
    hsvColor.z += (randftof(float(anchorID),92177.1105)-0.5)*0.25;
  }

  //getting fragment color
  highp vec3 rgbColor = clamp(hsv2rgb(hsvColor),0.0,1.0);

  highp float epsilon = 0.1;
  highp float gamma = 1.0;

  //getting the alpha of the current fragment from mask
  highp float alpha = mask.x;
  // if(alpha < epsilon)discard;
  //getting the bounds of the alpha values over all the fragments at this position
  highp float alphaRef = 1.0-alphaRefMap.x;
  //computing the alpha factor - function of the normalized alpha value
    // highp float alphaFactor = normalizedAlph;
  highp float alphaFactor = 1.0+gamma*alphaRef;


  //getting the depth of the current fragment from mask
  highp float depth = length(worldPosition.xyz-cameraPosition);
  //getting the reference depth value previously computed for this position
  highp float depthRef = depthRefMap.x;
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
  highp float normalizedDepth = (depth-minDepth)/(maxDepth-minDepth);

    highp float depthFactor = 1.0-pow(1.0-clamp(normalizedDepth-depthRef+0.5,0.0,1.0),1.0);
  highp float visibility = (1.0-min(depthFactor*alphaFactor,1.0))*alpha;

  //computing the depth factor - function of the normalized depth value
  // depthFactor = 0.0;

  //visibility factor computation

  fragColor = vec4(rgbColor*visibility,visibility);
  fragAlpha = vec4(alphaRef,0.0,0.0,1.0);

  // fragAlpha = vec4(vec3(normalizedDepth),1.0);

}
