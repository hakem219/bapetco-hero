import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnergyFlowProps {
  buildProgress: number;
  flowSpeed: number;
}

const energyVertexShader = `
uniform float uTime;
uniform float uBuildProgress;
uniform float uFlowSpeed;

attribute vec3 aStartPosition;
attribute vec3 aTargetPosition;
attribute float aPathPosition;

varying float vAlpha;
varying float vGlow;

void main() {
  // Only show when build is mostly complete
  float visibility = smoothstep(0.85, 0.98, uBuildProgress);
  
  // Animate along path
  float flowPos = fract(aPathPosition + uTime * uFlowSpeed * 0.3);
  
  // Interpolate position along path segment
  vec3 pos = mix(aStartPosition, aTargetPosition, flowPos);
  
  // Add subtle wobble
  float wobbleTime = uTime * 3.0 + aPathPosition * 20.0;
  pos.x += sin(wobbleTime) * 0.15;
  pos.y += cos(wobbleTime * 0.8) * 0.1;
  pos.z += sin(wobbleTime * 1.2) * 0.15;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size based on flow position (create trailing effect)
  float trailFade = sin(flowPos * 3.14159);
  float distanceAttenuation = 180.0 / length(mvPosition.xyz);
  gl_PointSize = (4.0 + trailFade * 6.0) * distanceAttenuation * visibility;
  gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);
  
  vAlpha = visibility * trailFade;
  vGlow = trailFade;
}
`;

const energyFragmentShader = `
uniform vec3 uColor;
uniform float uTime;

varying float vAlpha;
varying float vGlow;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;
  
  if (dist > 1.0) discard;
  
  // Soft glow falloff
  float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
  alpha = pow(alpha, 1.3);
  
  // Pulsing inner glow
  float pulse = 0.8 + 0.2 * sin(uTime * 8.0);
  float innerGlow = smoothstep(0.5, 0.0, dist) * pulse;
  
  // Gold color with bright core
  vec3 color = uColor * (1.0 + innerGlow * 2.0 + vGlow);
  
  // Add white hot center
  color = mix(color, vec3(1.0, 0.5, 0.8), innerGlow * 0.5);
  
  gl_FragColor = vec4(color, alpha * vAlpha);
}
`;

export function EnergyFlow({ buildProgress, flowSpeed }: EnergyFlowProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate energy flow paths
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    // Define flow paths
    const flowPaths = [
      // Main vertical flow through derrick
      {
        segments: [
          { start: [25, 0, 0], end: [25, 35, 0] },
          { start: [25, 25, 0], end: [25, 60, 0] },
        ],
        particlesPerSegment: 55,
      },
      // Flow to mud pits (left side)
      {
        segments: [
           { start: [0, 0, 0], end: [4, 0, 2] },
          { start: [0, 0, -2], end: [10, 3, 5] },
        ],
        particlesPerSegment: 5,
      },
      // Flow to power unit (right side)
      {
        segments: [
          { start: [20, 0, 0], end: [40, 2, 0] },
          { start: [30, 2, 0], end: [80, 0, 0] },
        ],
        particlesPerSegment: 10,
      },
      // Horizontal flow along substructure
      {
        segments: [
          { start: [-8, 0, 5], end: [8, 0, 5] },
        ],
        particlesPerSegment: 10,
      },
      // Return flow
      {
        segments: [
          { start: [-8, 3, -5], end: [-4, 4, 0] },
          { start: [-4, 4, 0], end: [8, 6, 0] },
        ],
        particlesPerSegment: 5,
      },
    ];
    
    const positions: number[] = [];
    const startPositions: number[] = [];
    const targetPositions: number[] = [];
    const pathPositions: number[] = [];
    
    for (const path of flowPaths) {
      for (const segment of path.segments) {
        for (let i = 0; i < path.particlesPerSegment; i++) {
          const pathPos = i / path.particlesPerSegment;
          
          // Initial position (will be animated)
          const start = segment.start;
          const end = segment.end;
          const t = pathPos;
          
          positions.push(
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
            start[2] + (end[2] - start[2]) * t
          );
          
          startPositions.push(start[0], start[1], start[2]);
          targetPositions.push(end[0], end[1], end[2]);
          pathPositions.push(pathPos + Math.random() * 0.1); // Slight randomization
        }
      }
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('aStartPosition', new THREE.BufferAttribute(new Float32Array(startPositions), 3));
    geo.setAttribute('aTargetPosition', new THREE.BufferAttribute(new Float32Array(targetPositions), 3));
    geo.setAttribute('aPathPosition', new THREE.BufferAttribute(new Float32Array(pathPositions), 1));
    
    return geo;
  }, []);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: energyVertexShader,
      fragmentShader: energyFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBuildProgress: { value: 0 },
        uFlowSpeed: { value: 0 },
        uColor: { value: new THREE.Color('rgba(214, 145, 17, 0.63)') },
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
      materialRef.current.uniforms.uBuildProgress.value = buildProgress;
      materialRef.current.uniforms.uFlowSpeed.value = flowSpeed;
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
