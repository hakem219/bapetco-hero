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

// Vertex shader for particles
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

void main() {
  // Calculate effective progress for this particle based on delay
  float delayWindow = 0.35;
  float effectiveProgress = smoothstep(aDelay, aDelay + delayWindow, uBuildProgress);
  
  // Ease the progress for smoother animation
  effectiveProgress = effectiveProgress * effectiveProgress * (3.0 - 2.0 * effectiveProgress);
  
  // Interpolate between start and target positions
  vec3 pos = mix(aStartPosition, aTargetPosition, effectiveProgress);
  
  // Add noise-based drift
  float driftAmount = (1.0 - effectiveProgress) * 2.0 + 0.05; // More drift when not assembled
  float noiseTime = uTime * 0.15;
  
  vec3 drift;
  drift.x = snoise(pos * aNoiseFreq * uNoiseScale + vec3(noiseTime, 0.0, 0.0)) * driftAmount;
  drift.y = snoise(pos * aNoiseFreq * uNoiseScale + vec3(0.0, noiseTime, 100.0)) * driftAmount * 0.5;
  drift.z = snoise(pos * aNoiseFreq * uNoiseScale + vec3(0.0, 0.0, noiseTime + 200.0)) * driftAmount;
  
  pos += drift;
  
  // Transform to view space
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Calculate point size with distance attenuation
  float distanceToCamera = length(mvPosition.xyz);
  float sizeAttenuation = 300.0 / distanceToCamera;
  
  // Pulse effect
  float pulse = 1.0 + 0.15 * sin(uTime * 2.5 + aDelay * 15.0);
  
  // Final size calculation
  float baseSize = aSize * uPointSizeBase;
  float variationSize = sin(aDelay * 50.0) * uPointSizeVariation;
  gl_PointSize = (baseSize + variationSize) * sizeAttenuation * pulse;
  
  // Clamp point size
  gl_PointSize = clamp(gl_PointSize, 1.0, 15.0);
  
  // Pass varyings to fragment shader
  vProgress = effectiveProgress;
  vDepth = -mvPosition.z;
  vSubsystem = aSubsystem;
  vDistanceToCamera = distanceToCamera;
}
`;

// Fragment shader for particles
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

void main() {
  // Create circular point with soft falloff
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;
  
  if (dist > 1.0) discard;
  
  // Soft circle falloff
  float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
  alpha = pow(alpha, 1.2);
  
  // Blueprint glow ring effect
  float glowRing = smoothstep(0.3, 0.5, dist) * smoothstep(0.8, 0.5, dist);
  float pulseWave = 0.8 + 0.2 * sin(uTime * 3.0 + vSubsystem * 2.0);
  float glow = glowRing * uGlowIntensity * pulseWave * vProgress;
  
  // Core brightness at center
  float core = smoothstep(0.4, 0.0, dist) * 0.5;
  
  // Depth fade for atmospheric perspective
  float depthFade = smoothstep(200.0, 20.0, vDepth);
  
  // Color mixing based on subsystem and progress
  vec3 baseColor = mix(uPrimaryColor, uAccentColor, vSubsystem * 0.1 + vProgress * 0.15);
  
  // Add glow to color
  vec3 finalColor = baseColor * (1.0 + glow * 1.5 + core);
  
  // Energy pulse effect when fully assembled
  float energyPulse = sin(uTime * 4.0 - vDepth * 0.05) * 0.5 + 0.5;
  finalColor += uAccentColor * energyPulse * uGlowIntensity * vProgress * 0.2;
  
  // Final alpha
  float finalAlpha = alpha * depthFade * uOpacity;
  finalAlpha *= 0.5 + vProgress * 0.5; // Fade in as particles assemble
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

// Energy flow particle shaders (for animated pipeline flow)
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
  float visibility = smoothstep(0.85, 0.95, uBuildProgress);
  
  // Animate along path
  float flowPos = fract(aPathPosition + uTime * uFlowSpeed);
  
  // Interpolate position along path
  vec3 pos = mix(aStartPosition, aTargetPosition, flowPos);
  
  // Add slight wobble
  pos.x += sin(uTime * 3.0 + flowPos * 10.0) * 0.1;
  pos.y += cos(uTime * 2.5 + flowPos * 8.0) * 0.05;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size based on flow position (larger in middle of trail)
  float sizePulse = sin(flowPos * 3.14159) * 0.5 + 0.5;
  float distanceAttenuation = 200.0 / length(mvPosition.xyz);
  gl_PointSize = (3.0 + sizePulse * 4.0) * distanceAttenuation * visibility;
  
  vAlpha = visibility * sizePulse;
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
  alpha = pow(alpha, 1.5);
  
  // Pulsing glow
  float pulse = 0.8 + 0.2 * sin(uTime * 5.0 + vFlowPosition * 20.0);
  
  vec3 color = uAccentColor * (1.0 + pulse * 0.5);
  
  gl_FragColor = vec4(color, alpha * vAlpha);
}
`;

// Grid shader for ground plane
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
  // Grid lines
  vec2 grid = abs(fract(vWorldPosition.xz * 0.1 - 0.5) - 0.5) / fwidth(vWorldPosition.xz * 0.1);
  float majorLine = min(grid.x, grid.y);
  
  vec2 gridFine = abs(fract(vWorldPosition.xz * 0.5 - 0.5) - 0.5) / fwidth(vWorldPosition.xz * 0.5);
  float minorLine = min(gridFine.x, gridFine.y);
  
  // Combine grids
  float line = min(majorLine, minorLine * 0.5);
  float gridAlpha = 1.0 - min(line, 1.0);
  
  // Distance fade from center
  float distFromCenter = length(vWorldPosition.xz);
  float distanceFade = 1.0 - smoothstep(0.0, 100.0, distFromCenter);
  
  // Pulse wave from center
  float pulseWave = sin(distFromCenter * 0.2 - uTime * 2.0) * 0.5 + 0.5;
  float pulse = pulseWave * uPulseIntensity * distanceFade;
  
  vec3 color = uGridColor * (1.0 + pulse * 2.0);
  float alpha = gridAlpha * distanceFade * uOpacity;
  
  gl_FragColor = vec4(color, alpha * 0.3);
}
`;
