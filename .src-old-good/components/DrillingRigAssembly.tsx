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
  // Position rig on the RIGHT side for final composition (appears on far right of screen)
  const rigPosition = new THREE.Vector3(25, 0, 0);
  const fogCenter = new THREE.Vector3(25, 35, 0);
  
  // Generate all geometry parts with offset position
  const mastAttributes = useMemo(() => 
    generateMastGeometry(8, 2, 45, rigPosition, fogCenter, 50), 
    []
  );
  
  const substructureAttributes = useMemo(() => 
    generateSubstructureGeometry(20, 15, 8, rigPosition, new THREE.Vector3(25, 20, 0), 45),
    []
  );
  
  const facilityAttributes = useMemo(() => 
    generateFacilityGeometry(rigPosition, fogCenter, 60),
    []
  );
  
  const accessoryAttributes = useMemo(() => 
    generateAccessoryGeometry(rigPosition, new THREE.Vector3(25, 30, 0), 55),
    []
  );

  return (
    <group>
      {/* Mast/Derrick - the tall tower - METALLIC DARK BLUE-GRAY */}
      <ParticleSystem
        attributes={mastAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#2a3442"
        accentColor="#4a5a6a"
        opacity={1}
        noiseScale={0.7}
        pointSizeBase={1.3}
        pointSizeVariation={0.15}
      />
      
      {/* Substructure - the base platform */}
      <ParticleSystem
        attributes={substructureAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#252d3a"
        accentColor="#3a4858"
        opacity={1}
        noiseScale={0.6}
        pointSizeBase={1.2}
        pointSizeVariation={0.12}
      />
      
      {/* Facility modules - mud pits, power units, etc */}
      <ParticleSystem
        attributes={facilityAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#222a36"
        accentColor="#384656"
        opacity={0.95}
        noiseScale={0.8}
        pointSizeBase={1.1}
        pointSizeVariation={0.15}
      />
      
      {/* Accessories - stairs, walkways, cables */}
      <ParticleSystem
        attributes={accessoryAttributes}
        buildProgress={buildProgress}
        glowIntensity={glowIntensity}
        primaryColor="#2d3644"
        accentColor="#4a5868"
        opacity={0.9}
        noiseScale={0.9}
        pointSizeBase={1.0}
        pointSizeVariation={0.1}
      />
      
      {/* Energy flow - animated particles through pipes - centered through derrick */}
      <EnergyFlow
        buildProgress={buildProgress}
        flowSpeed={energyFlowSpeed}
        rigPosition={rigPosition}
      />
    </group>
  );
}
