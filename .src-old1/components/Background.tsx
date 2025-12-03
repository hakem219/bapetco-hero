import { useMemo } from 'react';
import * as THREE from 'three';

export function BackgroundGradient() {
  // Create a large sphere with gradient material for background
  const geometry = useMemo(() => new THREE.SphereGeometry(200, 32, 32), []);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        uniform vec3 uColorAccent;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          // Vertical gradient based on world position
          float gradientFactor = smoothstep(-60.0, 120.0, vWorldPosition.y);
          
          // Base gradient from very dark bottom to slightly lighter top
          vec3 color = mix(uColorBottom, uColorTop, gradientFactor);
          
          // Very subtle horizon glow
          float horizonGlow = 1.0 - abs(gradientFactor - 0.25);
          horizonGlow = pow(horizonGlow, 4.0) * 0.08;
          color += uColorAccent * horizonGlow;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: {
        uColorTop: { value: new THREE.Color('#0D1218') },
        uColorBottom: { value: new THREE.Color('#050709') },
        uColorAccent: { value: new THREE.Color('#2a3040') },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh geometry={geometry} material={material} />
  );
}

// Ambient floating particles in far background - very subtle
export function AmbientStars() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Distribute in a large sphere around the scene
      const radius = 90 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.4 + 25;
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = 0.3 + Math.random() * 0.8;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        varying float vSize;
        
        void main() {
          vSize = aSize;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * (100.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.3, 2.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vSize;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center) * 2.0;
          
          if (dist > 1.0) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
          alpha = pow(alpha, 1.5);
          
          gl_FragColor = vec4(uColor, alpha * 0.15);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color('#4a5565') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return <points geometry={geometry} material={material} />;
}
