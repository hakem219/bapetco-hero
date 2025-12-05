import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function BackgroundGradient() {
  const geometry = useMemo(() => new THREE.SphereGeometry(450, 64, 64), []);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vPosition;
        
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        
        void main() {
          float normalizedY = (vPosition.y + 450.0) / 900.0;
          
          // ألوان أفتح قليلاً
          vec3 colorBottom = vec3(0.02, 0.025, 0.04);   // أسود مزرق
          vec3 colorMid = vec3(0.05, 0.065, 0.095);     // كحلي غامق
          vec3 colorTop = vec3(0.08, 0.10, 0.14);       // أزرق داكن أفتح
          
          vec3 color;
          if (normalizedY < 0.5) {
            color = mix(colorBottom, colorMid, normalizedY * 2.0);
          } else {
            color = mix(colorMid, colorTop, (normalizedY - 0.5) * 2.0);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return <mesh geometry={geometry} material={material} renderOrder={-1000} />;
}

// النجوم - بحركة أبطأ
export function AmbientStars() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const radius = 200 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(radius * Math.sin(phi) * Math.sin(theta)) * 0.6 + 30;
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = 1.5 + Math.random() * 2.5;
      brightness[i] = 0.4 + Math.random() * 0.6;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        attribute float aBrightness;
        varying float vBrightness;
        
        void main() {
          vBrightness = aBrightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * (80.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 5.0);
        }
      `,
      fragmentShader: `
        varying float vBrightness;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center) * 2.0;
          if (dist > 1.0) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
          alpha = pow(alpha, 1.3);
          
          // لون أفتح للنجوم
          vec3 starColor = vec3(0.75, 0.85, 1.0);
          gl_FragColor = vec4(starColor, alpha * vBrightness * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // دوران بطيء جداً للنجوم
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.001;  // بطيء جداً
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}