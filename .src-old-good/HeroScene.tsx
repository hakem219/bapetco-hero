import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import * as THREE from 'three';
import {
  DrillingRigAssembly,
  DustParticles,
  SceneDust,
  InfiniteGrid,
  CameraController,
  BackgroundGradient,
  AmbientStars,
} from './components';

interface HeroSceneProps {
  progress: number;
  buildProgress: number;
  glowIntensity: number;
  fogDensity: number;
  energyFlowSpeed: number;
}

function SceneContent({
  progress,
  buildProgress,
  glowIntensity,
  fogDensity,
  energyFlowSpeed,
}: HeroSceneProps) {
  return (
    <>
      {/* Camera controller tied to scroll progress */}
      <CameraController progress={progress} />
      
      {/* Background elements */}
      <BackgroundGradient />
      <AmbientStars />
      
      {/* Ground grid plane */}
      <InfiniteGrid 
        buildProgress={buildProgress} 
        glowIntensity={glowIntensity} 
      />
      
      {/* Main drilling rig assembly */}
      <DrillingRigAssembly
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        energyFlowSpeed={energyFlowSpeed}
      />
      
      {/* Ambient dust/fog particles - positioned over rig area (now on RIGHT) */}
      <DustParticles
        count={6000}
        center={[25, 35, 0]}
        radius={50}
        fogDensity={fogDensity}
        buildProgress={buildProgress}
      />
      
      {/* Scene-wide dust particles spread everywhere */}
      <SceneDust
        count={5000}
        buildProgress={buildProgress}
      />
      
      {/* Preload all assets */}
      <Preload all />
    </>
  );
}

export function HeroScene(props: HeroSceneProps) {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{
          fov: 50,
          near: 0.1,
          far: 500,
          position: [0, 40, 95],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
