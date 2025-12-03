import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { particleVertexShader, particleFragmentShader } from '../shaders';
import { ParticleAttributes } from '../utils/geometryGenerators';

interface ParticleSystemProps {
  attributes: ParticleAttributes;
  buildProgress: number;
  glowIntensity: number;
  primaryColor?: string;
  accentColor?: string;
  opacity?: number;
  noiseScale?: number;
  pointSizeBase?: number;
  pointSizeVariation?: number;
}

export function ParticleSystem({
  attributes,
  buildProgress,
  glowIntensity,
  primaryColor = '#00D4FF',
  accentColor = '#FFB800',
  opacity = 1,
  noiseScale = 1,
  pointSizeBase = 2.5,
  pointSizeVariation = 0.5,
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create geometry with attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    geo.setAttribute('position', new THREE.BufferAttribute(attributes.positions, 3));
    geo.setAttribute('aStartPosition', new THREE.BufferAttribute(attributes.startPositions, 3));
    geo.setAttribute('aTargetPosition', new THREE.BufferAttribute(attributes.targetPositions, 3));
    geo.setAttribute('aDelay', new THREE.BufferAttribute(attributes.delays, 1));
    geo.setAttribute('aNoiseFreq', new THREE.BufferAttribute(attributes.noiseFreqs, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(attributes.sizes, 1));
    geo.setAttribute('aSubsystem', new THREE.BufferAttribute(attributes.subsystems, 1));
    
    return geo;
  }, [attributes]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBuildProgress: { value: 0 },
        uGlowIntensity: { value: 0 },
        uNoiseScale: { value: noiseScale },
        uPointSizeBase: { value: pointSizeBase },
        uPointSizeVariation: { value: pointSizeVariation },
        uPrimaryColor: { value: new THREE.Color(primaryColor) },
        uAccentColor: { value: new THREE.Color(accentColor) },
        uOpacity: { value: opacity },
        uCameraPosition: { value: new THREE.Vector3() },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [primaryColor, accentColor, noiseScale, pointSizeBase, pointSizeVariation, opacity]);

  // Update uniforms on each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uBuildProgress.value = buildProgress;
      materialRef.current.uniforms.uGlowIntensity.value = glowIntensity;
      materialRef.current.uniforms.uCameraPosition.value.copy(state.camera.position);
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
