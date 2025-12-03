import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  progress: number;
}

// Camera keyframes for cinematic movement - UPDATED for left-positioned rig
// Final view shows entire rig on left side of screen
const cameraKeyframes = [
  { progress: 0.0, position: [-15, 45, 100], target: [-15, 25, 0] },
  { progress: 0.15, position: [10, 40, 90], target: [-15, 22, 0] },
  { progress: 0.3, position: [30, 35, 75], target: [-12, 20, 0] },
  { progress: 0.5, position: [45, 28, 60], target: [-10, 18, 0] },
  { progress: 0.7, position: [55, 22, 55], target: [-12, 16, 0] },
  { progress: 0.85, position: [60, 18, 55], target: [-15, 15, 0] },
  { progress: 1.0, position: [65, 20, 60], target: [-15, 18, 0] }, // Final: rig fully visible on left
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
  const targetRef = useRef(new THREE.Vector3(-15, 25, 0));
  const positionRef = useRef(new THREE.Vector3(-15, 45, 100));
  
  // Smoothing factor for camera movement
  const smoothing = 0.06;
  
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
    
    // Add very subtle breathing motion when idle (at end of animation)
    if (progress > 0.98) {
      const breathe = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      const breathe2 = Math.cos(state.clock.elapsedTime * 0.2) * 0.1;
      camera.position.x += breathe;
      camera.position.y += breathe2 * 0.3;
    }
  });

  return null;
}
