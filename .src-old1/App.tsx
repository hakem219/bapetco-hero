import { useEffect, useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { HeroScene } from './HeroScene';

// Animation duration in seconds
const ANIMATION_DURATION = 9;

interface AnimationState {
  progress: number;
  buildProgress: number;
  glowIntensity: number;
  fogDensity: number;
  energyFlowSpeed: number;
  headlineOpacity: number;
  subheadlineOpacity: number;
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>({
    progress: 0,
    buildProgress: 0,
    glowIntensity: 0,
    fogDensity: 1,
    energyFlowSpeed: 0,
    headlineOpacity: 0,
    subheadlineOpacity: 0,
  });
  
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  // Calculate derived values from progress
  const calculateAnimationValues = useCallback((progress: number): AnimationState => {
    const buildProgress = Math.min(1, progress * 1.05);
    const glowIntensity = Math.max(0, Math.min(1, (progress - 0.8) * 5));
    const fogDensity = Math.max(0, 1 - progress * 1.5);
    const energyFlowSpeed = Math.max(0, Math.min(1, (progress - 0.88) * 8));
    const headlineOpacity = Math.max(0, Math.min(1, (progress - 0.85) * 6.67));
    const subheadlineOpacity = Math.max(0, Math.min(1, (progress - 0.9) * 10));
    
    return {
      progress,
      buildProgress,
      glowIntensity,
      fogDensity,
      energyFlowSpeed,
      headlineOpacity,
      subheadlineOpacity,
    };
  }, []);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Start auto-play animation when loaded
  useEffect(() => {
    if (!isLoaded) return;

    // Create a proxy object for GSAP to animate
    const animationProxy = { progress: 0 };
    
    // Animate from 0 to 1 over ANIMATION_DURATION seconds
    animationRef.current = gsap.to(animationProxy, {
      progress: 1,
      duration: ANIMATION_DURATION,
      ease: 'power2.inOut',
      onUpdate: () => {
        const values = calculateAnimationValues(animationProxy.progress);
        setAnimationState(values);
        
        // Update progress bar
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${animationProxy.progress})`;
        }
      },
      onComplete: () => {
        setAnimationComplete(true);
      },
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [isLoaded, calculateAnimationValues]);

  // Animate headlines
  useEffect(() => {
    if (headlineRef.current) {
      headlineRef.current.style.opacity = String(animationState.headlineOpacity);
      headlineRef.current.style.transform = `translateY(${30 * (1 - animationState.headlineOpacity)}px)`;
    }
    if (subheadlineRef.current) {
      subheadlineRef.current.style.opacity = String(animationState.subheadlineOpacity);
      subheadlineRef.current.style.transform = `translateY(${30 * (1 - animationState.subheadlineOpacity)}px)`;
    }
  }, [animationState.headlineOpacity, animationState.subheadlineOpacity]);

  return (
    <>
      {/* Loading screen */}
      <div className={`loading-screen ${isLoaded ? 'loaded' : ''}`}>
        <div className="loading-logo">BAPETCO</div>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-fill" ref={progressBarRef}></div>
      </div>

      {/* Corner decorations */}
      <div className="corner-bracket top-left"></div>
      <div className="corner-bracket top-right"></div>
      <div className="corner-bracket bottom-left"></div>
      <div className="corner-bracket bottom-right"></div>

      {/* 3D Scene */}
      <HeroScene
        progress={animationState.progress}
        buildProgress={animationState.buildProgress}
        glowIntensity={animationState.glowIntensity}
        fogDensity={animationState.fogDensity}
        energyFlowSpeed={animationState.energyFlowSpeed}
      />

      {/* UI Overlay - positioned for right side since rig is on left */}
      <div className="hero-overlay">
        <div className="hero-content">
          <h1 className="hero-headline" ref={headlineRef}>
            Engineering <span className="highlight">Tomorrow's</span> Energy
          </h1>
          <p className="hero-subheadline" ref={subheadlineRef}>
            Onshore Exploration <span>•</span> Production <span>•</span> Responsibility
          </p>
        </div>
      </div>

      {/* Scroll indicator - appears AFTER animation completes */}
      <div className={`scroll-indicator ${animationComplete ? '' : 'hidden'}`}>
        <span className="scroll-text">Scroll to Explore</span>
        <div className="scroll-line"></div>
      </div>

      {/* Stats display */}
      <div className={`stats-display ${animationComplete ? 'visible' : ''}`}>
        <p>SYSTEM: ONLINE</p>
        <p>PARTICLES: ~200,000</p>
        <p>STATUS: OPERATIONAL</p>
      </div>

      {/* Scroll container for future sections */}
      <div className="scroll-container">
        <div className="hero-section"></div>
        {/* Future sections will be added here */}
      </div>
    </>
  );
}

export default App;
