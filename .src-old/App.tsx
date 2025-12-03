import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroScene } from './HeroScene';

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

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollState, setScrollState] = useState<ScrollState>({
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

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Setup scroll trigger
  useEffect(() => {
    if (!isLoaded) return;

    const scrollTrigger = ScrollTrigger.create({
      trigger: '.scroll-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Calculate all derived values
        const buildProgress = Math.min(1, progress * 1.1);
        const glowIntensity = Math.max(0, Math.min(1, (progress - 0.75) * 4));
        const fogDensity = Math.max(0, 1 - progress * 1.8);
        const energyFlowSpeed = Math.max(0, Math.min(1, (progress - 0.85) * 6));
        const headlineOpacity = Math.max(0, Math.min(1, (progress - 0.85) * 6.67));
        const subheadlineOpacity = Math.max(0, Math.min(1, (progress - 0.9) * 10));
        
        setScrollState({
          progress,
          buildProgress,
          glowIntensity,
          fogDensity,
          energyFlowSpeed,
          headlineOpacity,
          subheadlineOpacity,
        });

        // Update progress bar
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${progress})`;
        }
      },
    });

    return () => scrollTrigger.kill();
  }, [isLoaded]);

  // Animate headlines
  useEffect(() => {
    if (headlineRef.current) {
      headlineRef.current.style.opacity = String(scrollState.headlineOpacity);
      headlineRef.current.style.transform = `translateY(${30 * (1 - scrollState.headlineOpacity)}px)`;
    }
    if (subheadlineRef.current) {
      subheadlineRef.current.style.opacity = String(scrollState.subheadlineOpacity);
      subheadlineRef.current.style.transform = `translateY(${30 * (1 - scrollState.subheadlineOpacity)}px)`;
    }
  }, [scrollState.headlineOpacity, scrollState.subheadlineOpacity]);

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
        progress={scrollState.progress}
        buildProgress={scrollState.buildProgress}
        glowIntensity={scrollState.glowIntensity}
        fogDensity={scrollState.fogDensity}
        energyFlowSpeed={scrollState.energyFlowSpeed}
      />

      {/* UI Overlay */}
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

      {/* Scroll indicator */}
      <div className={`scroll-indicator ${scrollState.progress > 0.1 ? 'hidden' : ''}`}>
        <span className="scroll-text">Scroll to Explore</span>
        <div className="scroll-line"></div>
      </div>

      {/* Stats display (debug/demo) */}
      <div className={`stats-display ${scrollState.progress > 0.9 ? 'visible' : ''}`}>
        <p>SYSTEM: ONLINE</p>
        <p>PARTICLES: ~150,000</p>
        <p>STATUS: OPERATIONAL</p>
      </div>

      {/* Scroll container */}
      <div className="scroll-container">
        <div className="scroll-section"></div>
      </div>
    </>
  );
}

export default App;
