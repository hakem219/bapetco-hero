// Simplex 3D Noise GLSL
export const noise3D = `
//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

// Fractal Brownian Motion
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for(int i = 0; i < 6; i++) {
    if(i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}
`;

// Vertex shader for particles - UPDATED for smaller, subtler particles
export const particleVertexShader = `
${noise3D}

uniform float uTime;
uniform float uBuildProgress;
uniform float uNoiseScale;
uniform float uPointSizeBase;
uniform float uPointSizeVariation;
uniform vec3 uCameraPosition;

attribute vec3 aStartPosition;
attribute vec3 aTargetPosition;
attribute float aDelay;
attribute float aNoiseFreq;
attribute float aSize;
attribute float aSubsystem;

varying float vProgress;
varying float vDepth;
varying float vSubsystem;
varying float vDistanceToCamera;
varying float vHeight;

void main() {
  // Calculate effective progress for this particle based on delay
  float delayWindow = 0.3;
  float effectiveProgress = smoothstep(aDelay, aDelay + delayWindow, uBuildProgress);
  
  // Ease the progress for smoother animation
  effectiveProgress = effectiveProgress * effectiveProgress * (3.0 - 2.0 * effectiveProgress);
  
  // Interpolate between start and target positions
  vec3 pos = mix(aStartPosition, aTargetPosition, effectiveProgress);
  
  // Add noise-based drift - reduced for more stable appearance
  float driftAmount = (1.0 - effectiveProgress) * 1.2 + 0.02;
  float noiseTime = uTime * 0.1;
  
  vec3 drift;
  drift.x = snoise(pos * aNoiseFreq * uNoiseScale + vec3(noiseTime, 0.0, 0.0)) * driftAmount;
  drift.y = snoise(pos * aNoiseFreq * uNoiseScale + vec3(0.0, noiseTime, 100.0)) * driftAmount * 0.3;
  drift.z = snoise(pos * aNoiseFreq * uNoiseScale + vec3(0.0, 0.0, noiseTime + 200.0)) * driftAmount;
  
  pos += drift;
  
  // Transform to view space
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Calculate point size with distance attenuation - SMALLER particles
  float distanceToCamera = length(mvPosition.xyz);
  float sizeAttenuation = 180.0 / distanceToCamera;
  
  // Very subtle pulse - almost imperceptible
  float pulse = 1.0 + 0.03 * sin(uTime * 1.5 + aDelay * 10.0);
  
  // Final size calculation - much smaller base size
  float baseSize = aSize * uPointSizeBase;
  float variationSize = sin(aDelay * 50.0) * uPointSizeVariation;
  gl_PointSize = (baseSize + variationSize) * sizeAttenuation * pulse;
  
  // Clamp point size - smaller range
  gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);
  
  // Pass varyings to fragment shader
  vProgress = effectiveProgress;
  vDepth = -mvPosition.z;
  vSubsystem = aSubsystem;
  vDistanceToCamera = distanceToCamera;
  vHeight = aTargetPosition.y;
}
`;

// Fragment shader for particles - METALLIC DARK BLUE-GRAY REALISTIC
export const particleFragmentShader = `
uniform float uTime;
uniform float uGlowIntensity;
uniform vec3 uPrimaryColor;
uniform vec3 uAccentColor;
uniform float uOpacity;

varying float vProgress;
varying float vDepth;
varying float vSubsystem;
varying float vDistanceToCamera;
varying float vHeight;

void main() {
  // Create circular point
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;
  
  if (dist > 1.0) discard;
  
  // Sharp crisp circle
  float alpha = 1.0 - smoothstep(0.0, 0.9, dist);
  alpha = pow(alpha, 0.6);
  
  // Depth fade for atmospheric perspective
  float depthFade = smoothstep(300.0, 40.0, vDepth);
  
  // METALLIC DARK BLUE-GRAY color palette
  vec3 darkMetal = vec3(0.12, 0.14, 0.18);      // Very dark blue-gray
  vec3 midMetal = vec3(0.22, 0.26, 0.32);       // Medium blue-gray
  vec3 lightMetal = vec3(0.38, 0.44, 0.52);     // Light metallic highlight
  vec3 specular = vec3(0.55, 0.62, 0.72);       // Specular highlight
  
  // Height-based color variation - lighter at top
  float heightFactor = smoothstep(0.0, 50.0, vHeight);
  vec3 baseColor = mix(darkMetal, midMetal, heightFactor * 0.7);
  
  // Add subsystem variation
  baseColor = mix(baseColor, baseColor * 1.1, vSubsystem * 0.1);
  
  // Metallic specular simulation - bright spots
  float specularNoise = sin(vHeight * 0.5 + vDepth * 0.1 + uTime * 0.2) * 0.5 + 0.5;
  float specularIntensity = pow(specularNoise, 4.0) * 0.25 * vProgress;
  baseColor = mix(baseColor, specular, specularIntensity);
  
  // Rim lighting effect
  float rimFactor = pow(dist, 2.0) * 0.3;
  baseColor = mix(baseColor, lightMetal, rimFactor * vProgress);
  
  // Subtle ambient occlusion - darker in lower areas
  float ao = smoothstep(0.0, 12.0, vHeight) * 0.25 + 0.75;
  baseColor *= ao;
  
  // Very subtle blue tint in shadows
  vec3 shadowTint = vec3(0.08, 0.10, 0.15);
  baseColor = mix(shadowTint, baseColor, smoothstep(0.0, 0.3, heightFactor + 0.2));
  
  // Add subtle glow when fully assembled
  float glowAmount = uGlowIntensity * vProgress * 0.15;
  baseColor += lightMetal * glowAmount * smoothstep(0.5, 0.0, dist);
  
  vec3 finalColor = baseColor;
  
  // Final alpha
  float finalAlpha = alpha * depthFade * uOpacity;
  finalAlpha *= 0.5 + vProgress * 0.5;
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

// Energy flow particle shaders (for animated pipeline flow) - SUBTLE VERSION
export const energyFlowVertexShader = `
${noise3D}

uniform float uTime;
uniform float uBuildProgress;
uniform float uFlowSpeed;

attribute vec3 aStartPosition;
attribute vec3 aTargetPosition;
attribute float aDelay;
attribute float aPathPosition; // 0-1 position along flow path

varying float vAlpha;
varying float vFlowPosition;

void main() {
  // Only show when build is mostly complete
  float visibility = smoothstep(0.9, 1.0, uBuildProgress);
  
  // Animate along path
  float flowPos = fract(aPathPosition + uTime * uFlowSpeed);
  
  // Interpolate position along path
  vec3 pos = mix(aStartPosition, aTargetPosition, flowPos);
  
  // Minimal wobble
  pos.x += sin(uTime * 2.0 + flowPos * 8.0) * 0.05;
  pos.y += cos(uTime * 1.5 + flowPos * 6.0) * 0.03;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Smaller size
  float sizePulse = sin(flowPos * 3.14159) * 0.3 + 0.7;
  float distanceAttenuation = 120.0 / length(mvPosition.xyz);
  gl_PointSize = (1.0 + sizePulse * 1.5) * distanceAttenuation * visibility;
  gl_PointSize = clamp(gl_PointSize, 0.5, 3.0);
  
  vAlpha = visibility * sizePulse * 0.6;
  vFlowPosition = flowPos;
}
`;

export const energyFlowFragmentShader = `
uniform vec3 uAccentColor;
uniform float uTime;

varying float vAlpha;
varying float vFlowPosition;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;
  
  if (dist > 1.0) discard;
  
  float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
  alpha = pow(alpha, 1.2);
  
  // Subtle warm color - muted orange/amber
  vec3 color = vec3(0.8, 0.5, 0.2) * 0.7;
  
  gl_FragColor = vec4(color, alpha * vAlpha * 0.5);
}
`;

// Grid shader for ground plane - PREMIUM SUBTLE VERSION
export const gridVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const gridFragmentShader = `
uniform float uTime;
uniform vec3 uGridColor;
uniform float uOpacity;
uniform float uPulseIntensity;
uniform vec2 uPulseOrigin;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Grid lines - very subtle
  vec2 grid = abs(fract(vWorldPosition.xz * 0.08 - 0.5) - 0.5) / fwidth(vWorldPosition.xz * 0.08);
  float majorLine = min(grid.x, grid.y);
  
  vec2 gridFine = abs(fract(vWorldPosition.xz * 0.4 - 0.5) - 0.5) / fwidth(vWorldPosition.xz * 0.4);
  float minorLine = min(gridFine.x, gridFine.y);
  
  // Combine grids with different intensities
  float line = min(majorLine, minorLine * 0.2);
  float gridAlpha = 1.0 - min(line, 1.0);
  
  // Distance fade from center - gentle fade
  float distFromCenter = length(vWorldPosition.xz);
  float distanceFade = 1.0 - smoothstep(0.0, 100.0, distFromCenter);
  distanceFade = pow(distanceFade, 1.5);
  
  // Very subtle slow pulse wave
  float pulseWave = sin(distFromCenter * 0.1 - uTime * 1.0) * 0.5 + 0.5;
  float pulse = pulseWave * uPulseIntensity * distanceFade * 0.2;
  
  // Premium dark grid color
  vec3 color = vec3(0.12, 0.14, 0.18) * (1.0 + pulse * 0.5);
  float alpha = gridAlpha * distanceFade * uOpacity * 0.1;
  
  gl_FragColor = vec4(color, alpha);
}
`;
