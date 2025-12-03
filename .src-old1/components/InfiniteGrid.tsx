import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InfiniteGridProps {
  buildProgress: number;
  glowIntensity: number;
}

const gridVertexShader = `
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const gridFragmentShader = `
uniform float uTime;
uniform vec3 uGridColor;
uniform float uBuildProgress;
uniform float uGlowIntensity;

varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  // Create grid pattern
  vec2 worldXZ = vWorldPosition.xz;
  
  // Major grid (every 10 units)
  vec2 majorGrid = abs(fract(worldXZ * 0.1 - 0.5) - 0.5);
  float majorLine = min(majorGrid.x, majorGrid.y);
  majorLine = 1.0 - smoothstep(0.0, 0.02, majorLine);
  
  // Minor grid (every 2 units)
  vec2 minorGrid = abs(fract(worldXZ * 0.5 - 0.5) - 0.5);
  float minorLine = min(minorGrid.x, minorGrid.y);
  minorLine = 1.0 - smoothstep(0.0, 0.015, minorLine);
  
  // Combine grids with different intensities
  float gridAlpha = majorLine * 0.8 + minorLine * 0.3;
  
  // Distance fade from center
  float distFromCenter = length(worldXZ);
  float distanceFade = 1.0 - smoothstep(20.0, 120.0, distFromCenter);
  
  // Pulse wave emanating from center (activated after build)
  float pulseRadius = mod(uTime * 15.0, 150.0);
  float pulseDist = abs(distFromCenter - pulseRadius);
  float pulse = smoothstep(5.0, 0.0, pulseDist) * uGlowIntensity;
  
  // Second pulse wave
  float pulseRadius2 = mod(uTime * 15.0 + 75.0, 150.0);
  float pulseDist2 = abs(distFromCenter - pulseRadius2);
  float pulse2 = smoothstep(5.0, 0.0, pulseDist2) * uGlowIntensity;
  
  // Build progress fade-in
  float buildFade = smoothstep(0.0, 0.3, uBuildProgress);
  
  // Combine colors
  vec3 baseColor = uGridColor;
  vec3 pulseColor = vec3(0.0, 0.9, 1.0); // Brighter cyan for pulse
  vec3 goldPulse = vec3(1.0, 0.72, 0.0); // Gold accent
  
  vec3 color = baseColor + pulseColor * (pulse * 2.0) + goldPulse * (pulse2 * 1.5);
  
  float finalAlpha = gridAlpha * distanceFade * buildFade * 0.25;
  finalAlpha += (pulse + pulse2) * distanceFade * 0.3;
  
  gl_FragColor = vec4(color, finalAlpha);
}
`;

export function InfiniteGrid({ buildProgress, glowIntensity }: InfiniteGridProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create plane geometry
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(300, 300, 1, 1);
  }, []);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uGridColor: { value: new THREE.Color('#00D4FF') },
        uBuildProgress: { value: 0 },
        uGlowIntensity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  // Update uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uBuildProgress.value = buildProgress;
      materialRef.current.uniforms.uGlowIntensity.value = glowIntensity;
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
    <mesh 
      ref={meshRef} 
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.1, 0]}
    >
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}
