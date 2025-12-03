import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  progress: number;
}

// Camera keyframes for cinematic movement
const cameraKeyframes = [
  { progress: 0.0, position: [0, 40, 95], target: [0, 22, 0] },
  { progress: 0.2, position: [25, 35, 80], target: [0, 20, 0] },
  { progress: 0.4, position: [40, 28, 60], target: [0, 18, 0] },
  { progress: 0.6, position: [45, 20, 50], target: [0, 15, 0] },
  { progress: 0.8, position: [35, 15, 42], target: [0, 14, 0] },
  { progress: 1.0, position: [28, 14, 40], target: [0, 15, 0] },
];

function interpolateKeyframes(progress: number, keyframes: typeof cameraKeyframes) {
  // Find surrounding keyframes
  let startFrame = keyframes[0];
  let endFrame = keyframes[1];
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].progress && progress <= keyframes[i + 1].progress) {
      startFrame = keyframes[i];
      endFrame = keyframes[i + 1];
      break;
    }
  }
  
  // Handle edge case at the end
  if (progress >= keyframes[keyframes.length - 1].progress) {
    startFrame = keyframes[keyframes.length - 2];
    endFrame = keyframes[keyframes.length - 1];
  }
  
  // Calculate interpolation factor within the segment
  const segmentProgress = endFrame.progress - startFrame.progress;
  const rawT = segmentProgress > 0 
    ? (progress - startFrame.progress) / segmentProgress 
    : 0;
  
  // Apply easing (power2.inOut equivalent)
  const t = rawT < 0.5
    ? 2 * rawT * rawT
    : 1 - Math.pow(-2 * rawT + 2, 2) / 2;
  
  return {
    position: [
      THREE.MathUtils.lerp(startFrame.position[0], endFrame.position[0], t),
      THREE.MathUtils.lerp(startFrame.position[1], endFrame.position[1], t),
      THREE.MathUtils.lerp(startFrame.position[2], endFrame.position[2], t),
    ] as [number, number, number],
    target: [
      THREE.MathUtils.lerp(startFrame.target[0], endFrame.target[0], t),
      THREE.MathUtils.lerp(startFrame.target[1], endFrame.target[1], t),
      THREE.MathUtils.lerp(startFrame.target[2], endFrame.target[2], t),
    ] as [number, number, number],
  };
}

export function CameraController({ progress }: CameraControllerProps) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 20, 0));
  const positionRef = useRef(new THREE.Vector3(0, 40, 95));
  
  // Smoothing factor for camera movement
  const smoothing = 0.08;
  
  useFrame((state) => {
    // Get interpolated camera state
    const { position, target } = interpolateKeyframes(progress, cameraKeyframes);
    
    // Update target references
    positionRef.current.set(position[0], position[1], position[2]);
    targetRef.current.set(target[0], target[1], target[2]);
    
    // Smooth camera movement
    camera.position.lerp(positionRef.current, smoothing);
    
    // Look at target with smoothing
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(100).add(camera.position);
    
    currentLookAt.lerp(targetRef.current, smoothing);
    camera.lookAt(targetRef.current);
    
    // Add subtle breathing motion when idle (at end of scroll)
    if (progress > 0.95) {
      const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      const breathe2 = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
      camera.position.x += breathe;
      camera.position.y += breathe2 * 0.5;
    }
  });

  return null;
}
