import * as THREE from 'three';

// Types for particle attributes
export interface ParticleAttributes {
  positions: Float32Array;
  startPositions: Float32Array;
  targetPositions: Float32Array;
  delays: Float32Array;
  noiseFreqs: Float32Array;
  sizes: Float32Array;
  subsystems: Float32Array;
}

// Generate random position within a sphere for fog cloud
function randomInSphere(radius: number, center: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  
  return new THREE.Vector3(
    center.x + r * Math.sin(phi) * Math.cos(theta),
    center.y + r * Math.sin(phi) * Math.sin(theta),
    center.z + r * Math.cos(phi)
  );
}

// Generate points along a line segment
function generateLinePoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  density: number = 10,
  jitter: number = 0.05
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const length = start.distanceTo(end);
  const numPoints = Math.max(2, Math.floor(length * density));
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const point = new THREE.Vector3().lerpVectors(start, end, t);
    
    // Add slight random jitter
    point.x += (Math.random() - 0.5) * jitter;
    point.y += (Math.random() - 0.5) * jitter;
    point.z += (Math.random() - 0.5) * jitter;
    
    points.push(point);
  }
  
  return points;
}

// Generate points along a rectangular frame
function generateFramePoints(
  width: number,
  height: number,
  depth: number,
  position: THREE.Vector3,
  density: number = 8
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const hw = width / 2;
  const hd = depth / 2;
  
  // Bottom rectangle
  const bottomCorners = [
    new THREE.Vector3(-hw, 0, -hd).add(position),
    new THREE.Vector3(hw, 0, -hd).add(position),
    new THREE.Vector3(hw, 0, hd).add(position),
    new THREE.Vector3(-hw, 0, hd).add(position),
  ];
  
  // Top rectangle
  const topCorners = bottomCorners.map(c => new THREE.Vector3(c.x, c.y + height, c.z));
  
  // Bottom edges
  for (let i = 0; i < 4; i++) {
    points.push(...generateLinePoints(bottomCorners[i], bottomCorners[(i + 1) % 4], density));
  }
  
  // Top edges
  for (let i = 0; i < 4; i++) {
    points.push(...generateLinePoints(topCorners[i], topCorners[(i + 1) % 4], density));
  }
  
  // Vertical edges
  for (let i = 0; i < 4; i++) {
    points.push(...generateLinePoints(bottomCorners[i], topCorners[i], density));
  }
  
  return points;
}

// Generate derrick/mast structure - the tall tower - HIGH DETAIL VERSION
export function generateMastGeometry(
  baseWidth: number = 8,
  topWidth: number = 2,
  height: number = 45,
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  fogCenter: THREE.Vector3 = new THREE.Vector3(0, 40, 0),
  fogRadius: number = 40
): ParticleAttributes {
  const points: THREE.Vector3[] = [];
  const delays: number[] = [];
  
  const numLevels = 20; // Increased from 12 for more detail
  const density = 18; // Increased density
  
  // Generate tower structure
  for (let level = 0; level <= numLevels; level++) {
    const t = level / numLevels;
    const y = position.y + t * height;
    const width = THREE.MathUtils.lerp(baseWidth, topWidth, t);
    const hw = width / 2;
    
    // Four corner positions at this level
    const corners = [
      new THREE.Vector3(position.x - hw, y, position.z - hw),
      new THREE.Vector3(position.x + hw, y, position.z - hw),
      new THREE.Vector3(position.x + hw, y, position.z + hw),
      new THREE.Vector3(position.x - hw, y, position.z + hw),
    ];
    
    // Horizontal ring at this level
    for (let i = 0; i < 4; i++) {
      const linePoints = generateLinePoints(corners[i], corners[(i + 1) % 4], density);
      points.push(...linePoints);
      // Delay based on height (top builds first for top-down effect)
      const levelDelay = 0.15 + (1 - t) * 0.55;
      linePoints.forEach(() => delays.push(levelDelay + Math.random() * 0.08));
    }
    
    // Vertical lines to next level
    if (level < numLevels) {
      const nextT = (level + 1) / numLevels;
      const nextY = position.y + nextT * height;
      const nextWidth = THREE.MathUtils.lerp(baseWidth, topWidth, nextT);
      const nextHw = nextWidth / 2;
      
      const nextCorners = [
        new THREE.Vector3(position.x - nextHw, nextY, position.z - nextHw),
        new THREE.Vector3(position.x + nextHw, nextY, position.z - nextHw),
        new THREE.Vector3(position.x + nextHw, nextY, position.z + nextHw),
        new THREE.Vector3(position.x - nextHw, nextY, position.z + nextHw),
      ];
      
      // Vertical edges
      for (let i = 0; i < 4; i++) {
        const linePoints = generateLinePoints(corners[i], nextCorners[i], density);
        points.push(...linePoints);
        const levelDelay = 0.15 + (1 - t) * 0.55;
        linePoints.forEach(() => delays.push(levelDelay + Math.random() * 0.06));
      }
      
      // X-bracing on each face
      for (let i = 0; i < 4; i++) {
        const nextI = (i + 1) % 4;
        // Diagonal 1
        const diag1Points = generateLinePoints(corners[i], nextCorners[nextI], density * 0.8);
        points.push(...diag1Points);
        diag1Points.forEach(() => delays.push(0.25 + (1 - t) * 0.45 + Math.random() * 0.08));
        // Diagonal 2
        const diag2Points = generateLinePoints(corners[nextI], nextCorners[i], density * 0.8);
        points.push(...diag2Points);
        diag2Points.forEach(() => delays.push(0.25 + (1 - t) * 0.45 + Math.random() * 0.08));
      }
      
      // Additional internal bracing for more detail
      if (level % 3 === 0) {
        // Cross bracing in the middle
        const midY = (y + nextY) / 2;
        const midWidth = (width + nextWidth) / 2;
        
        for (let i = 0; i < 4; i++) {
          const corner = corners[i];
          const midPoint = new THREE.Vector3(
            position.x + (corner.x - position.x) * (midWidth / width),
            midY,
            position.z + (corner.z - position.z) * (midWidth / width)
          );
          // Short horizontal struts
          const nextCorner = corners[(i + 1) % 4];
          const nextMidPoint = new THREE.Vector3(
            position.x + (nextCorner.x - position.x) * (midWidth / width),
            midY,
            position.z + (nextCorner.z - position.z) * (midWidth / width)
          );
          const strutPoints = generateLinePoints(midPoint, nextMidPoint, density * 0.6);
          points.push(...strutPoints);
          strutPoints.forEach(() => delays.push(0.3 + (1 - t) * 0.4 + Math.random() * 0.08));
        }
      }
    }
  }
  
  // Crown block at top - more detailed
  const crownY = position.y + height;
  const crownWidth = topWidth * 1.8;
  const crownHeight = 4;
  const crownPoints = generateFramePoints(crownWidth, crownHeight, crownWidth, 
    new THREE.Vector3(position.x, crownY, position.z), density * 1.2);
  points.push(...crownPoints);
  crownPoints.forEach(() => delays.push(0.1 + Math.random() * 0.08));
  
  // Sheave wheels at crown (circles)
  const sheaveRadius = 1;
  const sheaveSegments = 24;
  for (let wheel = 0; wheel < 2; wheel++) {
    const wheelOffset = wheel === 0 ? -0.8 : 0.8;
    for (let i = 0; i < sheaveSegments; i++) {
      const angle = (i / sheaveSegments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        position.x + wheelOffset,
        crownY + crownHeight - 1 + Math.sin(angle) * sheaveRadius,
        position.z + Math.cos(angle) * sheaveRadius
      ));
      delays.push(0.08 + Math.random() * 0.05);
    }
  }
  
  // Traveling block (vertical element in center) - more detailed
  const blockPoints = generateLinePoints(
    new THREE.Vector3(position.x, position.y + 8, position.z),
    new THREE.Vector3(position.x, crownY - 2, position.z),
    density * 2.5
  );
  points.push(...blockPoints);
  blockPoints.forEach(() => delays.push(0.35 + Math.random() * 0.12));
  
  // Kelly and drill string
  const kellyPoints = generateLinePoints(
    new THREE.Vector3(position.x, position.y - 2, position.z),
    new THREE.Vector3(position.x, position.y + 10, position.z),
    density * 2
  );
  points.push(...kellyPoints);
  kellyPoints.forEach(() => delays.push(0.4 + Math.random() * 0.1));

  return createParticleAttributes(points, delays, fogCenter, fogRadius, 0);
}

// Generate substructure - the base platform - HIGH DETAIL VERSION
export function generateSubstructureGeometry(
  width: number = 20,
  depth: number = 15,
  height: number = 8,
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  fogCenter: THREE.Vector3 = new THREE.Vector3(0, 20, 0),
  fogRadius: number = 35
): ParticleAttributes {
  const points: THREE.Vector3[] = [];
  const delays: number[] = [];
  const density = 14; // Increased density
  
  // Main frame
  const framePoints = generateFramePoints(width, height, depth, position, density);
  points.push(...framePoints);
  framePoints.forEach(() => delays.push(0.0 + Math.random() * 0.12));
  
  // Rig floor (platform at top of substructure) - denser grid
  const floorY = position.y + height;
  const hw = width / 2;
  const hd = depth / 2;
  
  // Floor as scattered points - higher density
  for (let x = -hw; x <= hw; x += 0.8) {
    for (let z = -hd; z <= hd; z += 0.8) {
      const jitter = 0.15;
      points.push(new THREE.Vector3(
        position.x + x + (Math.random() - 0.5) * jitter,
        floorY + (Math.random() - 0.5) * 0.05,
        position.z + z + (Math.random() - 0.5) * jitter
      ));
      delays.push(0.08 + Math.random() * 0.15);
    }
  }
  
  // Floor edge railings
  const railHeight = 1.2;
  const railingCorners = [
    new THREE.Vector3(position.x - hw, floorY, position.z - hd),
    new THREE.Vector3(position.x + hw, floorY, position.z - hd),
    new THREE.Vector3(position.x + hw, floorY, position.z + hd),
    new THREE.Vector3(position.x - hw, floorY, position.z + hd),
  ];
  
  for (let i = 0; i < 4; i++) {
    const start = railingCorners[i];
    const end = railingCorners[(i + 1) % 4];
    
    // Bottom rail
    const bottomRail = generateLinePoints(start, end, density);
    points.push(...bottomRail);
    bottomRail.forEach(() => delays.push(0.12 + Math.random() * 0.1));
    
    // Top rail
    const topStart = start.clone().add(new THREE.Vector3(0, railHeight, 0));
    const topEnd = end.clone().add(new THREE.Vector3(0, railHeight, 0));
    const topRail = generateLinePoints(topStart, topEnd, density);
    points.push(...topRail);
    topRail.forEach(() => delays.push(0.15 + Math.random() * 0.1));
    
    // Vertical posts
    const numPosts = 8;
    for (let p = 0; p <= numPosts; p++) {
      const t = p / numPosts;
      const postBase = new THREE.Vector3().lerpVectors(start, end, t);
      const postTop = postBase.clone().add(new THREE.Vector3(0, railHeight, 0));
      const postPoints = generateLinePoints(postBase, postTop, density * 0.5);
      points.push(...postPoints);
      postPoints.forEach(() => delays.push(0.14 + Math.random() * 0.08));
    }
  }
  
  // Cross-bracing underneath - more detailed
  const corners = [
    new THREE.Vector3(position.x - hw, position.y, position.z - hd),
    new THREE.Vector3(position.x + hw, position.y, position.z - hd),
    new THREE.Vector3(position.x + hw, position.y, position.z + hd),
    new THREE.Vector3(position.x - hw, position.y, position.z + hd),
  ];
  
  const topCorners = corners.map(c => new THREE.Vector3(c.x, c.y + height, c.z));
  
  // Diagonal bracing on all faces
  for (let i = 0; i < 4; i++) {
    const diag1 = generateLinePoints(corners[i], topCorners[(i + 1) % 4], density * 0.7);
    points.push(...diag1);
    diag1.forEach(() => delays.push(0.1 + Math.random() * 0.12));
    
    const diag2 = generateLinePoints(corners[(i + 1) % 4], topCorners[i], density * 0.7);
    points.push(...diag2);
    diag2.forEach(() => delays.push(0.1 + Math.random() * 0.12));
  }
  
  // Internal support columns - more of them
  const columnPositions = [
    new THREE.Vector3(position.x - hw/2, position.y, position.z - hd/2),
    new THREE.Vector3(position.x + hw/2, position.y, position.z - hd/2),
    new THREE.Vector3(position.x - hw/2, position.y, position.z + hd/2),
    new THREE.Vector3(position.x + hw/2, position.y, position.z + hd/2),
    new THREE.Vector3(position.x, position.y, position.z - hd/2),
    new THREE.Vector3(position.x, position.y, position.z + hd/2),
    new THREE.Vector3(position.x - hw/2, position.y, position.z),
    new THREE.Vector3(position.x + hw/2, position.y, position.z),
  ];
  
  for (const colPos of columnPositions) {
    const colPoints = generateLinePoints(
      colPos,
      new THREE.Vector3(colPos.x, colPos.y + height, colPos.z),
      density
    );
    points.push(...colPoints);
    colPoints.forEach(() => delays.push(0.03 + Math.random() * 0.08));
  }
  
  // Horizontal bracing at mid-height
  const midHeight = position.y + height / 2;
  for (let i = 0; i < 4; i++) {
    const midCorner1 = new THREE.Vector3(corners[i].x, midHeight, corners[i].z);
    const midCorner2 = new THREE.Vector3(corners[(i + 1) % 4].x, midHeight, corners[(i + 1) % 4].z);
    const midBrace = generateLinePoints(midCorner1, midCorner2, density);
    points.push(...midBrace);
    midBrace.forEach(() => delays.push(0.08 + Math.random() * 0.1));
  }
  
  // Cellar (pit underneath) - more detailed
  const cellarDepth = 4;
  const cellarWidth = 8;
  const cellarCenter = new THREE.Vector3(position.x, position.y - cellarDepth, position.z);
  const cellarFrame = generateFramePoints(cellarWidth, cellarDepth, cellarWidth, cellarCenter, density);
  points.push(...cellarFrame);
  cellarFrame.forEach(() => delays.push(0.0 + Math.random() * 0.08));
  
  // Rotary table (circular element on floor)
  const rotaryRadius = 2;
  const rotarySegments = 32;
  for (let i = 0; i < rotarySegments; i++) {
    const angle = (i / rotarySegments) * Math.PI * 2;
    points.push(new THREE.Vector3(
      position.x + Math.cos(angle) * rotaryRadius,
      floorY + 0.2,
      position.z + Math.sin(angle) * rotaryRadius
    ));
    delays.push(0.2 + Math.random() * 0.1);
  }
  
  return createParticleAttributes(points, delays, fogCenter, fogRadius, 1);
}

// Generate facility modules (mud pits, pumps, power units) - HIGH DETAIL VERSION
export function generateFacilityGeometry(
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  fogCenter: THREE.Vector3 = new THREE.Vector3(0, 25, 0),
  fogRadius: number = 50
): ParticleAttributes {
  const points: THREE.Vector3[] = [];
  const delays: number[] = [];
  const density = 12; // Increased
  
  // Mud Pits (rectangular tanks) - positioned to side of rig - more detailed
  const mudPitPositions = [
    new THREE.Vector3(position.x - 20, position.y, position.z - 6),
    new THREE.Vector3(position.x - 20, position.y, position.z + 6),
    new THREE.Vector3(position.x - 28, position.y, position.z - 3),
    new THREE.Vector3(position.x - 28, position.y, position.z + 3),
  ];
  
  for (const pitPos of mudPitPositions) {
    const pitPoints = generateFramePoints(10, 4, 5, pitPos, density);
    points.push(...pitPoints);
    pitPoints.forEach(() => delays.push(0.35 + Math.random() * 0.15));
    
    // Internal baffles
    for (let b = 1; b < 3; b++) {
      const baffleX = pitPos.x - 5 + b * 3.3;
      const bafflePoints = generateLinePoints(
        new THREE.Vector3(baffleX, pitPos.y, pitPos.z - 2.5),
        new THREE.Vector3(baffleX, pitPos.y + 3.5, pitPos.z - 2.5),
        density * 0.6
      );
      points.push(...bafflePoints);
      bafflePoints.forEach(() => delays.push(0.4 + Math.random() * 0.1));
    }
    
    // Agitator shafts
    for (let a = 0; a < 2; a++) {
      const agitatorX = pitPos.x - 2.5 + a * 5;
      const agitatorPoints = generateLinePoints(
        new THREE.Vector3(agitatorX, pitPos.y + 4, pitPos.z),
        new THREE.Vector3(agitatorX, pitPos.y + 1, pitPos.z),
        density * 0.8
      );
      points.push(...agitatorPoints);
      agitatorPoints.forEach(() => delays.push(0.42 + Math.random() * 0.1));
    }
  }
  
  // Mud Pumps (cylindrical shapes) - more detailed
  const pumpPositions = [
    new THREE.Vector3(position.x - 14, position.y, position.z - 4),
    new THREE.Vector3(position.x - 14, position.y, position.z + 4),
    new THREE.Vector3(position.x - 14, position.y, position.z),
  ];
  
  for (const pumpPos of pumpPositions) {
    const radius = 2;
    const pumpHeight = 4;
    const segments = 24;
    
    // Generate cylinder rings
    for (let ring = 0; ring <= 4; ring++) {
      const ringY = pumpPos.y + ring * (pumpHeight / 4);
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          pumpPos.x + Math.cos(angle) * radius,
          ringY,
          pumpPos.z + Math.sin(angle) * radius
        ));
        delays.push(0.4 + Math.random() * 0.12);
      }
    }
    
    // Vertical lines
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const vertPoints = generateLinePoints(
        new THREE.Vector3(pumpPos.x + Math.cos(angle) * radius, pumpPos.y, pumpPos.z + Math.sin(angle) * radius),
        new THREE.Vector3(pumpPos.x + Math.cos(angle) * radius, pumpPos.y + pumpHeight, pumpPos.z + Math.sin(angle) * radius),
        density
      );
      points.push(...vertPoints);
      vertPoints.forEach(() => delays.push(0.4 + Math.random() * 0.12));
    }
    
    // Pump drive motor on top
    const motorRadius = 1;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      points.push(new THREE.Vector3(
        pumpPos.x + Math.cos(angle) * motorRadius,
        pumpPos.y + pumpHeight + 1,
        pumpPos.z + Math.sin(angle) * motorRadius
      ));
      delays.push(0.45 + Math.random() * 0.1);
    }
    
    // Discharge piping
    const pipePoints = generateLinePoints(
      new THREE.Vector3(pumpPos.x + radius, pumpPos.y + 2, pumpPos.z),
      new THREE.Vector3(pumpPos.x + radius + 4, pumpPos.y + 2, pumpPos.z),
      density
    );
    points.push(...pipePoints);
    pipePoints.forEach(() => delays.push(0.48 + Math.random() * 0.1));
  }
  
  // Power Units (generator housings) - larger and more detailed
  const powerPositions = [
    new THREE.Vector3(position.x + 20, position.y, position.z - 5),
    new THREE.Vector3(position.x + 20, position.y, position.z + 5),
  ];
  
  for (const powerPos of powerPositions) {
    const powerPoints = generateFramePoints(12, 5, 7, powerPos, density);
    points.push(...powerPoints);
    powerPoints.forEach(() => delays.push(0.45 + Math.random() * 0.15));
    
    // Exhaust stacks
    for (let stack = 0; stack < 2; stack++) {
      const stackX = powerPos.x - 3 + stack * 6;
      const stackPoints = generateLinePoints(
        new THREE.Vector3(stackX, powerPos.y + 5, powerPos.z),
        new THREE.Vector3(stackX, powerPos.y + 9, powerPos.z),
        density
      );
      points.push(...stackPoints);
      stackPoints.forEach(() => delays.push(0.5 + Math.random() * 0.1));
    }
    
    // Cooling radiator fins
    for (let fin = 0; fin < 8; fin++) {
      const finZ = powerPos.z - 3 + fin * 0.8;
      const finPoints = generateLinePoints(
        new THREE.Vector3(powerPos.x + 6, powerPos.y + 1, finZ),
        new THREE.Vector3(powerPos.x + 6, powerPos.y + 4, finZ),
        density * 0.5
      );
      points.push(...finPoints);
      finPoints.forEach(() => delays.push(0.52 + Math.random() * 0.08));
    }
  }
  
  // Pipe Racks (horizontal storage) - more pipes
  const pipeRackPos = new THREE.Vector3(position.x + 18, position.y, position.z - 15);
  
  // Support frame
  const rackFrame = generateFramePoints(18, 3, 4, pipeRackPos, density);
  points.push(...rackFrame);
  rackFrame.forEach(() => delays.push(0.5 + Math.random() * 0.12));
  
  // Second tier
  const rackFrame2 = generateFramePoints(18, 2, 4, 
    new THREE.Vector3(pipeRackPos.x, pipeRackPos.y + 3, pipeRackPos.z), density * 0.8);
  points.push(...rackFrame2);
  rackFrame2.forEach(() => delays.push(0.52 + Math.random() * 0.1));
  
  // Horizontal pipes (more of them)
  for (let tier = 0; tier < 2; tier++) {
    const tierY = pipeRackPos.y + 0.5 + tier * 3;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const pipeStart = new THREE.Vector3(
          pipeRackPos.x - 8,
          tierY + row * 0.5,
          pipeRackPos.z - 1.5 + col * 0.6
        );
        const pipeEnd = new THREE.Vector3(
          pipeRackPos.x + 8,
          pipeStart.y,
          pipeStart.z
        );
        const pipePoints = generateLinePoints(pipeStart, pipeEnd, density * 1.5);
        points.push(...pipePoints);
        pipePoints.forEach(() => delays.push(0.55 + Math.random() * 0.12));
      }
    }
  }
  
  // Doghouse (driller's cabin) - more detailed
  const doghousePos = new THREE.Vector3(position.x + 10, position.y + 8, position.z - 8);
  const doghousePoints = generateFramePoints(5, 3.5, 7, doghousePos, density);
  points.push(...doghousePoints);
  doghousePoints.forEach(() => delays.push(0.45 + Math.random() * 0.15));
  
  // Doghouse windows
  for (let w = 0; w < 3; w++) {
    const windowZ = doghousePos.z - 3 + w * 2.5;
    const windowPoints = generateFramePoints(0.1, 1.5, 1.2, 
      new THREE.Vector3(doghousePos.x - 2.5, doghousePos.y + 1, windowZ), density * 0.6);
    points.push(...windowPoints);
    windowPoints.forEach(() => delays.push(0.5 + Math.random() * 0.08));
  }
  
  // SCR House (silicon controlled rectifier)
  const scrPos = new THREE.Vector3(position.x + 25, position.y, position.z + 12);
  const scrPoints = generateFramePoints(8, 4, 6, scrPos, density);
  points.push(...scrPoints);
  scrPoints.forEach(() => delays.push(0.48 + Math.random() * 0.12));
  
  // Fuel tanks
  const fuelTankPositions = [
    new THREE.Vector3(position.x - 30, position.y, position.z + 10),
    new THREE.Vector3(position.x - 30, position.y, position.z - 10),
  ];
  
  for (const tankPos of fuelTankPositions) {
    // Horizontal cylinder tank
    const tankRadius = 2;
    const tankLength = 8;
    const tankSegments = 20;
    
    // End caps
    for (let end = 0; end < 2; end++) {
      const endX = tankPos.x - tankLength/2 + end * tankLength;
      for (let i = 0; i < tankSegments; i++) {
        const angle = (i / tankSegments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          endX,
          tankPos.y + tankRadius + Math.sin(angle) * tankRadius,
          tankPos.z + Math.cos(angle) * tankRadius
        ));
        delays.push(0.5 + Math.random() * 0.1);
      }
    }
    
    // Horizontal lines along tank
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const linePoints = generateLinePoints(
        new THREE.Vector3(tankPos.x - tankLength/2, tankPos.y + tankRadius + Math.sin(angle) * tankRadius, tankPos.z + Math.cos(angle) * tankRadius),
        new THREE.Vector3(tankPos.x + tankLength/2, tankPos.y + tankRadius + Math.sin(angle) * tankRadius, tankPos.z + Math.cos(angle) * tankRadius),
        density
      );
      points.push(...linePoints);
      linePoints.forEach(() => delays.push(0.5 + Math.random() * 0.1));
    }
    
    // Support legs
    const legPoints1 = generateLinePoints(
      new THREE.Vector3(tankPos.x - 2, tankPos.y, tankPos.z - tankRadius),
      new THREE.Vector3(tankPos.x - 2, tankPos.y + tankRadius, tankPos.z),
      density * 0.6
    );
    points.push(...legPoints1);
    legPoints1.forEach(() => delays.push(0.48 + Math.random() * 0.08));
  }
  
  return createParticleAttributes(points, delays, fogCenter, fogRadius, 2);
}

// Generate accessory systems (stairs, walkways, cables, railings)
export function generateAccessoryGeometry(
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  fogCenter: THREE.Vector3 = new THREE.Vector3(0, 25, 0),
  fogRadius: number = 45
): ParticleAttributes {
  const points: THREE.Vector3[] = [];
  const delays: number[] = [];
  const density = 10;
  
  const substructureHeight = 8;
  
  // Stairways
  const stairConfigs = [
    { start: new THREE.Vector3(position.x - 10, position.y, position.z - 7.5), 
      end: new THREE.Vector3(position.x - 6, position.y + substructureHeight, position.z - 7.5) },
    { start: new THREE.Vector3(position.x + 10, position.y, position.z + 7.5), 
      end: new THREE.Vector3(position.x + 6, position.y + substructureHeight, position.z + 7.5) },
  ];
  
  for (const stair of stairConfigs) {
    // Stair stringers (side rails)
    const stringerPoints1 = generateLinePoints(stair.start, stair.end, density);
    const stringerOffset = new THREE.Vector3(0, 0, 1);
    const stringerPoints2 = generateLinePoints(
      stair.start.clone().add(stringerOffset),
      stair.end.clone().add(stringerOffset),
      density
    );
    points.push(...stringerPoints1, ...stringerPoints2);
    [...stringerPoints1, ...stringerPoints2].forEach(() => delays.push(0.65 + Math.random() * 0.15));
    
    // Steps
    const numSteps = 12;
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const stepPos = new THREE.Vector3().lerpVectors(stair.start, stair.end, t);
      const stepEnd = stepPos.clone().add(stringerOffset);
      const stepPoints = generateLinePoints(stepPos, stepEnd, density * 0.5);
      points.push(...stepPoints);
      stepPoints.forEach(() => delays.push(0.7 + Math.random() * 0.1));
    }
  }
  
  // Walkways (horizontal platforms connecting areas)
  const walkwayConfigs = [
    { start: new THREE.Vector3(position.x - 10, position.y + substructureHeight, position.z - 3),
      end: new THREE.Vector3(position.x - 10, position.y + substructureHeight, position.z + 3),
      width: 2 },
    { start: new THREE.Vector3(position.x + 10, position.y + substructureHeight, position.z - 3),
      end: new THREE.Vector3(position.x + 10, position.y + substructureHeight, position.z + 3),
      width: 2 },
  ];
  
  for (const walkway of walkwayConfigs) {
    // Main walkway line
    const walkwayPoints = generateLinePoints(walkway.start, walkway.end, density);
    points.push(...walkwayPoints);
    walkwayPoints.forEach(() => delays.push(0.6 + Math.random() * 0.15));
    
    // Railings
    const railHeight = 1;
    const railStart = walkway.start.clone().add(new THREE.Vector3(0, railHeight, 0));
    const railEnd = walkway.end.clone().add(new THREE.Vector3(0, railHeight, 0));
    const railPoints = generateLinePoints(railStart, railEnd, density);
    points.push(...railPoints);
    railPoints.forEach(() => delays.push(0.7 + Math.random() * 0.1));
    
    // Railing posts
    const numPosts = 6;
    for (let i = 0; i <= numPosts; i++) {
      const t = i / numPosts;
      const postBase = new THREE.Vector3().lerpVectors(walkway.start, walkway.end, t);
      const postTop = postBase.clone().add(new THREE.Vector3(0, railHeight, 0));
      const postPoints = generateLinePoints(postBase, postTop, density * 0.5);
      points.push(...postPoints);
      postPoints.forEach(() => delays.push(0.72 + Math.random() * 0.08));
    }
  }
  
  // Cables (catenary curves)
  const cableConfigs = [
    { start: new THREE.Vector3(position.x - 2, position.y + 48, position.z - 2),
      end: new THREE.Vector3(position.x - 15, position.y + 10, position.z - 8),
      sag: 5 },
    { start: new THREE.Vector3(position.x + 2, position.y + 48, position.z + 2),
      end: new THREE.Vector3(position.x + 15, position.y + 10, position.z + 8),
      sag: 5 },
    { start: new THREE.Vector3(position.x, position.y + 46, position.z),
      end: new THREE.Vector3(position.x - 18, position.y + 5, position.z),
      sag: 8 },
  ];
  
  for (const cable of cableConfigs) {
    // Generate catenary curve points
    const numPoints = 30;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const pos = new THREE.Vector3().lerpVectors(cable.start, cable.end, t);
      // Add catenary sag
      const sagAmount = Math.sin(t * Math.PI) * cable.sag;
      pos.y -= sagAmount;
      points.push(pos);
      delays.push(0.75 + Math.random() * 0.15);
    }
  }
  
  // Safety railings around rig floor
  const railingHeight = 1.2;
  const floorLevel = position.y + substructureHeight;
  const hw = 10;
  const hd = 7.5;
  
  const railingCorners = [
    new THREE.Vector3(position.x - hw, floorLevel + railingHeight, position.z - hd),
    new THREE.Vector3(position.x + hw, floorLevel + railingHeight, position.z - hd),
    new THREE.Vector3(position.x + hw, floorLevel + railingHeight, position.z + hd),
    new THREE.Vector3(position.x - hw, floorLevel + railingHeight, position.z + hd),
  ];
  
  for (let i = 0; i < 4; i++) {
    const railSegment = generateLinePoints(railingCorners[i], railingCorners[(i + 1) % 4], density);
    points.push(...railSegment);
    railSegment.forEach(() => delays.push(0.68 + Math.random() * 0.12));
  }
  
  return createParticleAttributes(points, delays, fogCenter, fogRadius, 3);
}

// Generate ambient dust/fog particles
export function generateDustGeometry(
  count: number = 8000,
  center: THREE.Vector3 = new THREE.Vector3(0, 25, 0),
  radius: number = 60
): ParticleAttributes {
  const points: THREE.Vector3[] = [];
  const delays: number[] = [];
  
  for (let i = 0; i < count; i++) {
    const point = randomInSphere(radius, center);
    // Bias towards upper region
    point.y = center.y + Math.abs(point.y - center.y) * 0.7;
    points.push(point);
    delays.push(Math.random()); // Random delays - these particles fade rather than assemble
  }
  
  // For dust, target position is same as start (they stay in place)
  const positions = new Float32Array(count * 3);
  const startPositions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const noiseFreqs = new Float32Array(count);
  const sizes = new Float32Array(count);
  const subsystems = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const p = points[i];
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
    
    startPositions[i * 3] = p.x;
    startPositions[i * 3 + 1] = p.y;
    startPositions[i * 3 + 2] = p.z;
    
    // Target same as start - dust doesn't assemble
    targetPositions[i * 3] = p.x;
    targetPositions[i * 3 + 1] = p.y;
    targetPositions[i * 3 + 2] = p.z;
    
    noiseFreqs[i] = 0.3 + Math.random() * 0.5;
    sizes[i] = 0.3 + Math.random() * 0.4;
    subsystems[i] = 4; // Dust subsystem
  }
  
  return {
    positions,
    startPositions,
    targetPositions,
    delays: new Float32Array(delays),
    noiseFreqs,
    sizes,
    subsystems
  };
}

// Generate energy flow path particles
export function generateEnergyFlowGeometry(
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): {
  positions: Float32Array;
  startPositions: Float32Array;
  targetPositions: Float32Array;
  pathPositions: Float32Array;
  delays: Float32Array;
} {
  const flowPaths = [
    // Main vertical flow through derrick
    { 
      points: [
        new THREE.Vector3(position.x, position.y + 8, position.z),
        new THREE.Vector3(position.x, position.y + 25, position.z),
        new THREE.Vector3(position.x, position.y + 45, position.z),
      ],
      particleCount: 50
    },
    // Flow to mud pits
    {
      points: [
        new THREE.Vector3(position.x - 4, position.y + 8, position.z),
        new THREE.Vector3(position.x - 10, position.y + 6, position.z),
        new THREE.Vector3(position.x - 18, position.y + 3, position.z - 5),
      ],
      particleCount: 30
    },
    // Flow to power unit
    {
      points: [
        new THREE.Vector3(position.x + 4, position.y + 8, position.z),
        new THREE.Vector3(position.x + 12, position.y + 5, position.z),
        new THREE.Vector3(position.x + 18, position.y + 2, position.z),
      ],
      particleCount: 30
    },
  ];
  
  const allPositions: number[] = [];
  const allStartPositions: number[] = [];
  const allTargetPositions: number[] = [];
  const allPathPositions: number[] = [];
  const allDelays: number[] = [];
  
  for (const path of flowPaths) {
    for (let i = 0; i < path.particleCount; i++) {
      const pathPos = i / path.particleCount;
      
      // Determine which segment we're on
      const totalSegments = path.points.length - 1;
      const segmentIndex = Math.min(Math.floor(pathPos * totalSegments), totalSegments - 1);
      const segmentT = (pathPos * totalSegments) - segmentIndex;
      
      const startPoint = path.points[segmentIndex];
      const endPoint = path.points[segmentIndex + 1];
      
      const pos = new THREE.Vector3().lerpVectors(startPoint, endPoint, segmentT);
      
      allPositions.push(pos.x, pos.y, pos.z);
      allStartPositions.push(startPoint.x, startPoint.y, startPoint.z);
      allTargetPositions.push(endPoint.x, endPoint.y, endPoint.z);
      allPathPositions.push(pathPos);
      allDelays.push(0.9 + Math.random() * 0.1);
    }
  }
  
  return {
    positions: new Float32Array(allPositions),
    startPositions: new Float32Array(allStartPositions),
    targetPositions: new Float32Array(allTargetPositions),
    pathPositions: new Float32Array(allPathPositions),
    delays: new Float32Array(allDelays)
  };
}

// Helper function to create particle attributes from points
function createParticleAttributes(
  points: THREE.Vector3[],
  delays: number[],
  fogCenter: THREE.Vector3,
  fogRadius: number,
  subsystemId: number
): ParticleAttributes {
  const count = points.length;
  
  const positions = new Float32Array(count * 3);
  const startPositions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const noiseFreqs = new Float32Array(count);
  const sizes = new Float32Array(count);
  const subsystems = new Float32Array(count);
  const delayArray = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const target = points[i];
    const start = randomInSphere(fogRadius, fogCenter);
    
    // Start at fog position
    positions[i * 3] = start.x;
    positions[i * 3 + 1] = start.y;
    positions[i * 3 + 2] = start.z;
    
    startPositions[i * 3] = start.x;
    startPositions[i * 3 + 1] = start.y;
    startPositions[i * 3 + 2] = start.z;
    
    targetPositions[i * 3] = target.x;
    targetPositions[i * 3 + 1] = target.y;
    targetPositions[i * 3 + 2] = target.z;
    
    noiseFreqs[i] = 0.5 + Math.random() * 0.8;
    sizes[i] = 0.8 + Math.random() * 0.6;
    subsystems[i] = subsystemId;
    delayArray[i] = delays[i] || Math.random();
  }
  
  return {
    positions,
    startPositions,
    targetPositions,
    delays: delayArray,
    noiseFreqs,
    sizes,
    subsystems
  };
}
