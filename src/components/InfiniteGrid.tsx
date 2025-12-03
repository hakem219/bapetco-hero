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
uniform vec2 uPulseCenter; // Center of the derrick

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
  float gridAlpha = majorLine * 0.6 + minorLine * 0.2;
  
  // Distance fade from DERRICK CENTER (not scene center)
  float distFromDerrick = length(worldXZ - uPulseCenter);
  float distanceFade = 1.0 - smoothstep(15.0, 140.0, distFromDerrick);
  
  // Pulse wave emanating from DERRICK CENTER
  float pulseRadius = mod(uTime * 12.0, 120.0);
  float pulseDist = abs(distFromDerrick - pulseRadius);
  float pulse = smoothstep(4.0, 0.0, pulseDist) * uGlowIntensity;
  
  // Second pulse wave
  float pulseRadius2 = mod(uTime * 12.0 + 60.0, 120.0);
  float pulseDist2 = abs(distFromDerrick - pulseRadius2);
  float pulse2 = smoothstep(4.0, 0.0, pulseDist2) * uGlowIntensity;
  
  // Build progress fade-in
  float buildFade = smoothstep(0.0, 0.3, uBuildProgress);
  
  // Metallic blue-gray colors to match the rig
  vec3 baseColor = uGridColor;
  vec3 pulseColor = vec3(0.4, 0.55, 0.7); // Blue-gray pulse
  vec3 accentPulse = vec3(0.5, 0.6, 0.75); // Lighter accent
  
  vec3 color = baseColor + pulseColor * (pulse * 1.5) + accentPulse * (pulse2 * 1.0);
  
  float finalAlpha = gridAlpha * distanceFade * buildFade * 0.15;
  finalAlpha += (pulse + pulse2) * distanceFade * 0.2;
  
  gl_FragColor = vec4(color, finalAlpha);
}
`;

export function InfiniteGrid({ buildProgress, glowIntensity }: InfiniteGridProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create plane geometry
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(350, 350, 1, 1);
  }, []);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uGridColor: { value: new THREE.Color('#1a2030') }, // Dark blue-gray base
        uBuildProgress: { value: 0 },
        uGlowIntensity: { value: 0 },
        uPulseCenter: { value: new THREE.Vector2(25, 0) }, // Derrick center position
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
