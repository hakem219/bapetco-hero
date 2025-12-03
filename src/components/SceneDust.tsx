import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SceneDustProps {
  count?: number;
}

const dustVertexShader = `
uniform float uTime;

attribute float aSize;
attribute float aSpeed;
attribute float aPhase;

varying float vDepth;

void main() {
  vec3 pos = position;
  
  // Slow drifting motion
  float drift = uTime * aSpeed;
  pos.x += sin(drift + aPhase) * 2.0;
  pos.y += sin(drift * 0.7 + aPhase * 2.0) * 1.0;
  pos.z += cos(drift * 0.5 + aPhase * 3.0) * 2.0;
  
  // Wrap Y position to keep particles in view
  pos.y = mod(pos.y + uTime * 0.05, 100.0);
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size with distance attenuation
  float distanceAttenuation = 150.0 / length(mvPosition.xyz);
  gl_PointSize = aSize * distanceAttenuation;
  gl_PointSize = clamp(gl_PointSize, 0.5, 3.5);
  
  vDepth = -mvPosition.z;
}
`;

const dustFragmentShader = `
uniform float uTime;

varying float vDepth;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;
  
  if (dist > 1.0) discard;
  
  float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
  alpha = pow(alpha, 1.2);
  
  // Depth fade - fade out very distant particles
  float depthFade = smoothstep(350.0, 40.0, vDepth);
  
  // Subtle blue-gray color matching the metallic theme
  vec3 color = vec3(0.30, 0.36, 0.45);
  
  // Subtle twinkle
  float twinkle = sin(uTime * 1.2 + vDepth * 0.06) * 0.12 + 0.88;
  
  // Always visible - no buildProgress dependency
  gl_FragColor = vec4(color * twinkle, alpha * depthFade * 0.25);
}
`;

export function SceneDust({ count = 5000 }: SceneDustProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread particles all over the scene
      positions[i * 3] = (Math.random() - 0.5) * 280;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
      
      sizes[i] = 0.8 + Math.random() * 2.0;
      speeds[i] = 0.06 + Math.random() * 0.2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    return geo;
  }, [count]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

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