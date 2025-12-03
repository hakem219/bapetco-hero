import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollState {
  progress: number;
  buildProgress: number;
  glowIntensity: number;
  fogDensity: number;
  energyFlowSpeed: number;
  headlineOpacity: number;
  subheadlineOpacity: number;
}

export function useScrollProgress(): ScrollState {
  const [state, setState] = useState<ScrollState>({
    progress: 0,
    buildProgress: 0,
    glowIntensity: 0,
    fogDensity: 1,
    energyFlowSpeed: 0,
    headlineOpacity: 0,
    subheadlineOpacity: 0,
  });

  useEffect(() => {
    // Create scroll-triggered animations
    const scrollTrigger = ScrollTrigger.create({
      trigger: '.scroll-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Calculate derived values based on scroll progress
        const buildProgress = gsap.utils.clamp(0, 1, progress * 1.15); // Slightly ahead
        const glowIntensity = gsap.utils.clamp(0, 1, (progress - 0.75) * 4);
        const fogDensity = gsap.utils.clamp(0, 1, 1 - progress * 2);
        const energyFlowSpeed = gsap.utils.clamp(0, 1, (progress - 0.85) * 6.67);
        const headlineOpacity = gsap.utils.clamp(0, 1, (progress - 0.88) * 8);
        const subheadlineOpacity = gsap.utils.clamp(0, 1, (progress - 0.92) * 12.5);
        
        setState({
          progress,
          buildProgress,
          glowIntensity,
          fogDensity,
          energyFlowSpeed,
          headlineOpacity,
          subheadlineOpacity,
        });
      },
    });

    return () => {
      scrollTrigger.kill();
    };
  }, []);

  return state;
}

// Hook for camera path interpolation
interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

export function useCameraPath(progress: number): CameraState {
  // Camera keyframes
  const keyframes = [
    { progress: 0, position: [0, 35, 90], target: [0, 20, 0] },
    { progress: 0.3, position: [30, 28, 65], target: [0, 18, 0] },
    { progress: 0.6, position: [40, 18, 50], target: [0, 15, 0] },
    { progress: 0.8, position: [30, 14, 40], target: [0, 12, 0] },
    { progress: 1.0, position: [25, 12, 38], target: [0, 14, 0] },
  ];

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
  
  // Interpolate between keyframes
  const rangeProgress = (progress - startFrame.progress) / (endFrame.progress - startFrame.progress);
  const easedProgress = gsap.parseEase('power2.inOut')(rangeProgress);
  
  const position: [number, number, number] = [
    gsap.utils.interpolate(startFrame.position[0], endFrame.position[0], easedProgress),
    gsap.utils.interpolate(startFrame.position[1], endFrame.position[1], easedProgress),
    gsap.utils.interpolate(startFrame.position[2], endFrame.position[2], easedProgress),
  ];
  
  const target: [number, number, number] = [
    gsap.utils.interpolate(startFrame.target[0], endFrame.target[0], easedProgress),
    gsap.utils.interpolate(startFrame.target[1], endFrame.target[1], easedProgress),
    gsap.utils.interpolate(startFrame.target[2], endFrame.target[2], easedProgress),
  ];
  
  return { position, target };
}
