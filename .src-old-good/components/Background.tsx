import { useMemo } from 'react';
import * as THREE from 'three';

export function BackgroundGradient() {
  const geometry = useMemo(() => new THREE.SphereGeometry(300, 64, 64), []);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorMid;
        uniform vec3 uColorBottom;
        uniform float uTime;
        
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        void main() {
          // Vertical gradient
          float gradientFactor = smoothstep(-100.0, 180.0, vWorldPosition.y);
          
          // Three-stop gradient for depth
          vec3 color;
          if (gradientFactor < 0.35) {
            color = mix(uColorBottom, uColorMid, gradientFactor / 0.35);
          } else {
            color = mix(uColorMid, uColorTop, (gradientFactor - 0.35) / 0.65);
          }
          
          // Subtle radial darkening
          float radialDist = length(vWorldPosition.xz) / 200.0;
          color *= 1.0 - radialDist * 0.1;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: {
        uColorTop: { value: new THREE.Color('#0a0d12') },
        uColorMid: { value: new THREE.Color('#060810') },
        uColorBottom: { value: new THREE.Color('#030406') },
        uTime: { value: 0 },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh geometry={geometry} material={material} />
  );
}

// Background stars - very subtle
export function AmbientStars() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 800;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const radius = 120 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.3 + 40;
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = 0.2 + Math.random() * 0.5;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * (60.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.2, 1.2);
        }
      `,
      fragmentShader: `
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center) * 2.0;
          if (dist > 1.0) discard;
          float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
          gl_FragColor = vec4(0.3, 0.35, 0.45, alpha * 0.08);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return <points geometry={geometry} material={material} />;
}
