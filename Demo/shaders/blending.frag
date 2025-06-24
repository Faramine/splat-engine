#version 300 es

//uniforms
uniform highp mat4 uViewMatrix;

//uniform textures
uniform sampler2D colorBuffer;
uniform sampler2D alphaBuffer;

//in properties
in highp vec2 vTextureCoord;

in highp vec3 origin;
in highp vec3 ray;

//out properties
layout(location = 0) out highp vec4 fragColor;
layout(location = 1) out highp vec4 fragDepth;

highp float rand(highp vec4 v, highp float seed){
    return fract(sin(dot(v, vec4(12.9898, 78.233, 5481.2, 485.12))) * seed);
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
  highp vec4 colorInput = texture(colorBuffer, vTextureCoord);
  highp vec4 alphaInput = texture(alphaBuffer, vTextureCoord);

  highp vec3 colorSum = colorInput.rgb;
  highp float visibilitySum = colorInput.w;

  highp float alphaRefSum = alphaInput.x;
  highp float fragCount = alphaInput.w;

  // fragColor = vec4(CameraPosition_worldspace,1.0);
  // fragColor = vec4(alphaInput.xyz,clamp(fragCount,0.0,1.0));
  // fragColor = vec4((fragCount!=0.0)?vec3(alphaRefSum/fragCount):vec3(1.0),1.0);
  // return;
  // fragColor = vec4(colorSum/visibilitySum,1.0);


  highp vec3 meanFragmentColor;
  highp float meanFragmentAlpha;
  if(fragCount != 0.0){
    meanFragmentColor = colorSum.rgb/visibilitySum;
    meanFragmentColor = clamp(meanFragmentColor,0.0,1.0);
    meanFragmentAlpha = alphaRefSum/fragCount;
    meanFragmentAlpha = clamp(meanFragmentAlpha,0.0,1.0);
  }else{
    meanFragmentColor = vec3(0.0);
    meanFragmentAlpha = 0.0;
  }

  highp vec4 inputLayer = vec4(meanFragmentColor,meanFragmentAlpha);

  highp float skyAlbedo = dot(normalize(ray),vec3(0.0,1.0,0.0));
  skyAlbedo = clamp((skyAlbedo+0.05)*70.0,0.0,1.0);
  highp vec4 skyColor = vec4(0.349, 0.764, 0.933,1.0);
  highp vec4 groundColor = vec4(0.168, 0.4, 0.490,1.0);
  highp vec4 bgColor = mix(groundColor,skyColor,skyAlbedo);

  fragColor = vec4(mix(inputLayer.xyz,bgColor.xyz,1.0-inputLayer.a),1.0);

}
