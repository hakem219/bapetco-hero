import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noise3D } from '../shaders';

interface DustParticlesProps {
  count?: number;
  center?: [number, number, number];
  radius?: number;
  fogDensity: number;
  buildProgress: number;
}

const dustVertexShader = `
${noise3D}

uniform float uTime;
uniform float uFogDensity;
uniform float uBuildProgress;

attribute float aDelay;
attribute float aNoiseFreq;
attribute float aSize;

varying float vAlpha;
varying float vDepth;

void main() {
  // Dust particles drift and fade as build progresses
  vec3 pos = position;
  
  // Slower continuous drift animation
  float noiseTime = uTime * 0.06;
  pos.x += snoise(position * aNoiseFreq + vec3(noiseTime, 0.0, 0.0)) * 2.0;
  pos.y += snoise(position * aNoiseFreq + vec3(0.0, noiseTime, 100.0)) * 1.5;
  pos.z += snoise(position * aNoiseFreq + vec3(0.0, 0.0, noiseTime + 200.0)) * 2.0;
  
  // Slow upward drift
  pos.y += uTime * 0.3;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Smaller size with distance attenuation
  float distanceAttenuation = 150.0 / length(mvPosition.xyz);
  float pulse = 1.0 + 0.1 * sin(uTime * 1.0 + aDelay * 8.0);
  gl_PointSize = aSize * distanceAttenuation * pulse * 1.0;
  gl_PointSize = clamp(gl_PointSize, 0.3, 3.0);
  
  // Fade out as build progresses
  vAlpha = uFogDensity * (1.0 - uBuildProgress * 0.7);
  vDepth = -mvPosition.z;
}
`;

const dustFragmentShader = `
uniform vec3 uColor;
uniform float uTime;

varying float vAlpha;
varying float vDepth;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;
  
  if (dist > 1.0) discard;
  
  // Sharp falloff for tiny dots
  float alpha = 1.0 - smoothstep(0.0, 0.9, dist);
  alpha = pow(alpha, 1.5);
  
  // Very subtle shimmer
  float shimmer = 0.85 + 0.15 * sin(uTime * 1.0 + vDepth * 0.05);
  
  // Depth fade
  float depthFade = smoothstep(180.0, 40.0, vDepth);
  
  // Muted gray-blue color
  vec3 color = vec3(0.35, 0.38, 0.42) * shimmer;
  
  gl_FragColor = vec4(color, alpha * vAlpha * depthFade * 0.25);
}
`;

export function DustParticles({
  count = 8000,
  center = [0, 30, 0],
  radius = 60,
  fogDensity,
  buildProgress,
}: DustParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate dust particle positions
  const { geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const delays = new Float32Array(count);
    const noiseFreqs = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random position in sphere
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.cbrt(Math.random());
      
      pos[i * 3] = center[0] + r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = center[1] + r * Math.sin(phi) * Math.sin(theta) * 0.6; // Flatten vertically
      pos[i * 3 + 2] = center[2] + r * Math.cos(phi);
      
      delays[i] = Math.random();
      noiseFreqs[i] = 0.2 + Math.random() * 0.3;
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));
    geo.setAttribute('aNoiseFreq', new THREE.BufferAttribute(noiseFreqs, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    return { geometry: geo };
  }, [count, center, radius]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFogDensity: { value: 1 },
        uBuildProgress: { value: 0 },
        uColor: { value: new THREE.Color('#d2f32eff') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Update uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uFogDensity.value = fogDensity;
      materialRef.current.uniforms.uBuildProgress.value = buildProgress;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
}
