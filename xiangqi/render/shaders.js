/**
 * 工笔重彩 GLSL。量化色带、无 PBR、无镜面高光。
 * 内轮廓主要靠 Sobel；外壳描边见 outline* 。
 */

export const gongbiVertex = /* glsl */ `
#include <common>
#include <uv_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  #include <uv_vertex>
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  #include <worldpos_vertex>
  #include <shadowmap_vertex>

  vNormal = normalize(transformedNormal);
  vViewPosition = -mvPosition.xyz;
}
`;

export const gongbiFragment = /* glsl */ `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform vec3 ramp0;
uniform vec3 ramp1;
uniform vec3 ramp2;
uniform vec3 ramp3;
uniform vec3 thresholds;
uniform sampler2D silkMap;
uniform sampler2D cunMap;
uniform vec2 uResolution;
uniform float uSilkStrength;
uniform float uInkEdge;
uniform float uSilhouette;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // 剪影：纯黑，关掉纹理
  if (uSilhouette > 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 N = normalize(vNormal);
  vec3 L = vec3(0.18, 0.92, 0.35);
  #if (NUM_DIR_LIGHTS > 0)
    L = directionalLights[0].direction;
  #endif

  // Half-Lambert 得到连续 t，再硬切 4 档。禁止平滑 Lambert。
  float ndotl = dot(N, L);
  float t = ndotl * 0.5 + 0.5;

  vec3 color;
  if (t < thresholds.x) {
    color = ramp0;
  } else if (t < thresholds.y) {
    color = ramp1;
  } else if (t < thresholds.z) {
    color = ramp2;
  } else {
    color = ramp3;
  }

  float shadow = 1.0;
  #ifdef USE_SHADOWMAP
    shadow = getShadowMask();
  #endif

  if (shadow < 0.995) {
    // 阴影强制落到最暗或次暗色带
    vec3 shade = mix(ramp0, ramp1, step(0.28, shadow));
    color = mix(color, shade, 1.0 - shadow);

    // 屏幕对齐绢织 + 皴法，低透明度罩染，不是滤镜
    vec2 ss = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    vec3 silk = texture2D(silkMap, ss * 6.0).rgb;
    vec3 cun = texture2D(cunMap, ss * 3.2).rgb;
    float wash = uSilkStrength * (1.0 - shadow);
    color = mix(color, color * silk, wash);
    color = mix(color, color * cun, wash * 0.42);
  }

  // 假内轮廓备用；默认 uInkEdge=0，真内轮廓走 Sobel
  if (uInkEdge > 0.001) {
    float facing = abs(dot(N, normalize(vViewPosition)));
    float rim = 1.0 - facing;
    float inner = smoothstep(0.72, 0.92, rim);
    color = mix(color, ramp0, inner * uInkEdge * 0.35);
  }

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

export const outlineVertex = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>

uniform float uWidth;

void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>

  // BackSide 会翻转法线；挤出必须沿外向，否则外壳往里缩
  vec3 nView = normalize(transformedNormal);
  #ifdef FLIP_SIDED
    nView = -nView;
  #endif

  vec2 nxy = nView.xy;
  float len = length(nxy);
  if (len > 1.0e-4) {
    nxy /= len;
    gl_Position.xy += nxy * uWidth * gl_Position.w;
  }
}
`;

export const outlineFragment = /* glsl */ `
uniform float uGold;
uniform vec3 uInkColor;
uniform vec3 uGoldColor;
uniform float uSilhouette;

void main() {
  if (uSilhouette > 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  // 剪影浓墨 / 结构线暗金，不是纯黑
  gl_FragColor = vec4(mix(uInkColor, uGoldColor, uGold), 1.0);
}
`;

export const normalDepthVertex = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>

varying vec3 vViewNormal;
varying float vViewZ;

void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>

  vViewNormal = normalize(transformedNormal);
  vViewZ = -mvPosition.z;
}
`;

export const normalDepthFragment = /* glsl */ `
uniform float cameraNear;
uniform float cameraFar;

varying vec3 vViewNormal;
varying float vViewZ;

void main() {
  // view-space 法线编码到 0..1；深度线性
  vec3 n = normalize(vViewNormal) * 0.5 + 0.5;
  float linearDepth = (vViewZ - cameraNear) / max(cameraFar - cameraNear, 1.0e-4);
  gl_FragColor = vec4(n, clamp(linearDepth, 0.0, 1.0));
}
`;

export const sobelVertex = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const sobelFragment = /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D tNormalDepth;
uniform vec2 uResolution;
uniform vec3 uInkColor;
uniform float uEnabled;

varying vec2 vUv;

void main() {
  vec4 beauty = texture2D(tDiffuse, vUv);
  if (uEnabled < 0.5) {
    gl_FragColor = beauty;
    return;
  }

  vec2 texel = 1.0 / max(uResolution, vec2(1.0));

  vec4 c00 = texture2D(tNormalDepth, vUv + texel * vec2(-1.0, -1.0));
  vec4 c10 = texture2D(tNormalDepth, vUv + texel * vec2( 0.0, -1.0));
  vec4 c20 = texture2D(tNormalDepth, vUv + texel * vec2( 1.0, -1.0));
  vec4 c01 = texture2D(tNormalDepth, vUv + texel * vec2(-1.0,  0.0));
  vec4 c21 = texture2D(tNormalDepth, vUv + texel * vec2( 1.0,  0.0));
  vec4 c02 = texture2D(tNormalDepth, vUv + texel * vec2(-1.0,  1.0));
  vec4 c12 = texture2D(tNormalDepth, vUv + texel * vec2( 0.0,  1.0));
  vec4 c22 = texture2D(tNormalDepth, vUv + texel * vec2( 1.0,  1.0));

  // 深度 Sobel
  float dGx = -c00.a - 2.0 * c01.a - c02.a + c20.a + 2.0 * c21.a + c22.a;
  float dGy = -c00.a - 2.0 * c10.a - c20.a + c02.a + 2.0 * c12.a + c22.a;
  float depthEdge = length(vec2(dGx, dGy));

  // 法线差 Sobel（解码回 view-space）
  vec3 n00 = c00.rgb * 2.0 - 1.0;
  vec3 n10 = c10.rgb * 2.0 - 1.0;
  vec3 n20 = c20.rgb * 2.0 - 1.0;
  vec3 n01 = c01.rgb * 2.0 - 1.0;
  vec3 n21 = c21.rgb * 2.0 - 1.0;
  vec3 n02 = c02.rgb * 2.0 - 1.0;
  vec3 n12 = c12.rgb * 2.0 - 1.0;
  vec3 n22 = c22.rgb * 2.0 - 1.0;
  vec3 nGx = -n00 - 2.0 * n01 - n02 + n20 + 2.0 * n21 + n22;
  vec3 nGy = -n00 - 2.0 * n10 - n20 + n02 + 2.0 * n12 + n22;
  float normalEdge = length(nGx) + length(nGy);

  // 真正外轮廓：深度跳变很大，交给外壳，Sobel 让位
  float outer = smoothstep(0.045, 0.09, depthEdge);
  float crease = max(normalEdge * 0.55, depthEdge * 6.0);
  float inner = smoothstep(0.55, 1.15, crease) * (1.0 - outer);

  vec3 ink = uInkColor;
  gl_FragColor = vec4(mix(beauty.rgb, ink, inner), beauty.a);
}
`;

export const riverVertex = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const riverFragment = /* glsl */ `
uniform vec3 river0;
uniform vec3 river1;
uniform vec3 river2;
uniform vec3 river3;
uniform vec3 lightDir;
uniform float uTime;
uniform float uSilhouette;
uniform vec2 uResolution;
uniform sampler2D silkMap;
uniform float uSilkStrength;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  if (uSilhouette > 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // 石青平涂 + 法线扰动（sin/cos 流动，不用外部法线贴图）
  float wx = sin(vWorldPos.x * 2.6 + uTime * 0.55) * cos(vWorldPos.z * 1.8 + uTime * 0.4);
  float wz = cos(vWorldPos.x * 1.9 + uTime * 0.33) * sin(vWorldPos.z * 2.3 + uTime * 0.48);
  vec3 N = normalize(vec3(vNormal.x + wx * 0.28, vNormal.y + 0.65, vNormal.z + wz * 0.28));
  float t = dot(N, normalize(lightDir)) * 0.5 + 0.5;

  vec3 color;
  if (t < 0.34) color = river0;
  else if (t < 0.55) color = river1;
  else if (t < 0.78) color = river2;
  else color = river3;

  vec2 ss = gl_FragCoord.xy / max(uResolution, vec2(1.0));
  vec3 silk = texture2D(silkMap, ss * 5.0 + vec2(uTime * 0.01, 0.0)).rgb;
  color = mix(color, color * silk, uSilkStrength * 0.45);

  gl_FragColor = vec4(color, 1.0);
}
`;
