# BAPETCO Hero Section - Particle-Assembled Drilling Rig

An immersive, interactive WebGL hero section featuring a particle-assembled onshore drilling rig built with React Three Fiber, Three.js, and GSAP.

![BAPETCO Hero](https://via.placeholder.com/1200x600/0A0F1A/00D4FF?text=BAPETCO+Hero+Section)

## ✨ Features

- **150,000+ Particles** forming a complete onshore drilling rig structure
- **Scroll-driven Animation** with smooth GSAP ScrollTrigger integration
- **Custom GLSL Shaders** for blueprint glow effects and energy flow visualization
- **Cinematic Camera Movement** following scroll progress
- **Blueprint Aesthetic** with cyan/gold color scheme
- **Fully Responsive** design
- **High Performance** optimized for 60fps on modern hardware

## 🛠 Tech Stack

- **React 19** - UI framework
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **GSAP** - Animation library with ScrollTrigger
- **TypeScript** - Type safety
- **Vite** - Build tool

## 📁 Project Structure

```
bapetco-hero/
├── src/
│   ├── components/
│   │   ├── ParticleSystem.tsx      # Core particle renderer
│   │   ├── DrillingRigAssembly.tsx # Main rig assembly
│   │   ├── DustParticles.tsx       # Ambient fog particles
│   │   ├── EnergyFlow.tsx          # Animated energy flow
│   │   ├── InfiniteGrid.tsx        # Ground grid plane
│   │   ├── CameraController.tsx    # Cinematic camera
│   │   ├── Background.tsx          # Gradient background
│   │   └── index.ts                # Component exports
│   ├── shaders/
│   │   └── index.ts                # GLSL shaders
│   ├── utils/
│   │   └── geometryGenerators.ts   # Procedural geometry
│   ├── hooks/
│   │   └── useScrollProgress.ts    # Scroll state hook
│   ├── App.tsx                     # Main app component
│   ├── HeroScene.tsx               # 3D scene wrapper
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or extract the project
cd bapetco-hero

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

## 🎨 Visual Breakdown

### Scroll Phases

| Progress | Visual State |
|----------|--------------|
| 0-20% | Diffuse particle fog, wide camera |
| 20-50% | Particles begin assembling, camera orbits |
| 50-80% | Full structure emerges, details form |
| 80-100% | Rig complete, glow activates, headlines appear |

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Petroleum Navy | `#0A0F1A` | Background |
| Blueprint Cyan | `#00D4FF` | Primary particles |
| Energy Gold | `#FFB800` | Energy flow, accents |
| Ice White | `#E0F7FF` | Bright highlights |

## 🔧 Customization

### Adjusting Particle Count

In `geometryGenerators.ts`, modify the `density` parameter:

```typescript
// Lower for better performance on mobile
const density = 8; // particles per unit length
```

### Changing Colors

In shader uniforms:

```typescript
uPrimaryColor: { value: new THREE.Color('#00D4FF') },
uAccentColor: { value: new THREE.Color('#FFB800') },
```

### Camera Path

In `CameraController.tsx`, modify `cameraKeyframes`:

```typescript
const cameraKeyframes = [
  { progress: 0.0, position: [0, 40, 95], target: [0, 22, 0] },
  // Add more keyframes...
];
```

## 📊 Performance Tips

1. **Reduce particle count** on mobile devices
2. **Use `dpr={[1, 1.5]}`** instead of `[1, 2]` for lower-end devices
3. **Disable energy flow** for significant performance boost
4. **Consider LOD** (Level of Detail) for distant particles

## 🧩 Integration

To integrate into an existing project:

1. Copy the `src/components`, `src/shaders`, `src/utils`, and `src/hooks` folders
2. Install required dependencies
3. Import and use `<HeroScene />` component
4. Ensure scroll container has sufficient height (400vh recommended)

```tsx
import { HeroScene } from './HeroScene';

function YourPage() {
  const [scrollState, setScrollState] = useState({...});
  
  return (
    <>
      <HeroScene {...scrollState} />
      <div className="scroll-container">
        <div style={{ height: '400vh' }} />
      </div>
    </>
  );
}
```

## 🎯 Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

WebGL 2.0 required for best experience.

## 📝 License

MIT License - Feel free to use in commercial projects.

## 🤝 Credits

- Design & Development: BAPETCO Digital Team
- 3D Visualization: Custom WebGL implementation
- Animation: GSAP by GreenSock

---

**BAPETCO - Engineering Tomorrow's Energy**
