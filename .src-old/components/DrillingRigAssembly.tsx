import { useMemo } from 'react';
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { EnergyFlow } from './EnergyFlow';
import {
  generateMastGeometry,
  generateSubstructureGeometry,
  generateFacilityGeometry,
  generateAccessoryGeometry,
} from '../utils/geometryGenerators';

interface DrillingRigAssemblyProps {
  buildProgress: number;
  glowIntensity: number;
  energyFlowSpeed: number;
}

export function DrillingRigAssembly({
  buildProgress,
  glowIntensity,
  energyFlowSpeed,
}: DrillingRigAssemblyProps) {
  const rigPosition = new THREE.Vector3(0, 0, 0);
  const fogCenter = new THREE.Vector3(0, 35, 0);
  
  // Generate all geometry parts
  const mastAttributes = useMemo(() => 
    generateMastGeometry(8, 2, 45, rigPosition, fogCenter, 45), 
    []
  );
  
  const substructureAttributes = useMemo(() => 
    generateSubstructureGeometry(20, 15, 8, rigPosition, new THREE.Vector3(0, 20, 0), 40),
    []
  );
  
  const facilityAttributes = useMemo(() => 
    generateFacilityGeometry(rigPosition, fogCenter, 55),
    []
  );
  
  const accessoryAttributes = useMemo(() => 
    generateAccessoryGeometry(rigPosition, new THREE.Vector3(0, 30, 0), 50),
    []
  );

  return (
    <group>
      {/* Mast/Derrick - the tall tower */}
      <ParticleSystem
        attributes={mastAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#00D4FF"
        accentColor="#FFB800"
        opacity={1}
        noiseScale={1}
        pointSizeBase={2.8}
        pointSizeVariation={0.4}
      />
      
      {/* Substructure - the base platform */}
      <ParticleSystem
        attributes={substructureAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#00D4FF"
        accentColor="#FFB800"
        opacity={1}
        noiseScale={0.9}
        pointSizeBase={2.5}
        pointSizeVariation={0.3}
      />
      
      {/* Facility modules - mud pits, power units, etc */}
      <ParticleSystem
        attributes={facilityAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#00BFFF"
        accentColor="#FFB800"
        opacity={0.95}
        noiseScale={1.1}
        pointSizeBase={2.3}
        pointSizeVariation={0.4}
      />
      
      {/* Accessories - stairs, walkways, cables */}
      <ParticleSystem
        attributes={accessoryAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#00E5FF"
        accentColor="#FFC107"
        opacity={0.9}
        noiseScale={1.2}
        pointSizeBase={2.0}
        pointSizeVariation={0.3}
      />
      
      {/* Energy flow - animated particles through pipes */}
      <EnergyFlow
        buildProgress={buildProgress}
        flowSpeed={energyFlowSpeed}
      />
    </group>
  );
}
