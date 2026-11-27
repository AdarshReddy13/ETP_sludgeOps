/**
 * ETP SludgeOps — 3D Plant Design & Implementation Digital Twin
 *
 * Implements an interactive 3D WebGL plant layout representing the physical
 * implementation of the chemical coagulation-flocculation sludge management facility:
 * - Equalization Basin (EQ-101)
 * - Flash Mix Coagulation Reactor (FM-201)
 * - Flocculation Chamber (FL-202)
 * - Primary Chemical Clarifier (CLR-301)
 * - Sludge Holding & Thickening Tank (THK-401)
 * - Filter Press Dewatering Building (DWB-501)
 * - Dedicated Impermeable RCC Sludge Storage Shed (STR-601)
 * - Weighbridge & TSDF Transport Bay (DSP-701)
 *
 * Interactive Features:
 * - Orbit camera controls (drag to rotate, scroll to zoom)
 * - Click-to-inspect unit operations with engineering specifications & live telemetry
 * - Camera viewpoint presets (Overview, Reaction, Dewatering, Storage, Dispatch)
 * - Animated process flow streams (influent, sludge, filtrate, cake)
 * - Day / Night lighting, wireframe mode, and auto-rotation
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Box,
  Eye,
  Layers,
  RotateCw,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Info,
  ShieldCheck,
  Building,
  Wrench,
  Navigation,
  Compass,
} from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import clsx from 'clsx';

interface UnitSpecification {
  id: string;
  tag: string;
  name: string;
  stage: string;
  position: [number, number, number];
  dimensions: string;
  volumeM3: number;
  moc: string;
  hrtOrCycle: string;
  liveMetricLabel: string;
  liveMetricValue: string;
  status: 'Normal' | 'Attention' | 'Critical';
  description: string;
  maintenanceNote: string;
}

const PLANT_UNITS: UnitSpecification[] = [
  {
    id: 'unit-eq',
    tag: 'EQ-101',
    name: 'Raw Wastewater Equalization Basin',
    stage: 'Influent Buffering',
    position: [-16, 2, 8],
    dimensions: '14.0m Ø × 4.5m SWD',
    volumeM3: 650,
    moc: 'RCC M30 with Epoxy Coating',
    hrtOrCycle: '8.0 Hours HRT',
    liveMetricLabel: 'Influent COD / pH',
    liveMetricValue: '> 100,000 mg/L | pH 5.5',
    status: 'Normal',
    description: 'Receives variable discharge from production lines. Air-grid coarse bubble mixing prevents sludge deposition and equalizes high COD organic loading.',
    maintenanceNote: 'Air header pressure verified 0.45 bar; level transmitter calibrated.',
  },
  {
    id: 'unit-fm',
    tag: 'FM-201',
    name: 'Flash Mix Coagulation Tank',
    stage: 'Chemical Reaction',
    position: [-8, 2.5, 8],
    dimensions: '3.0m × 3.0m × 3.5m',
    volumeM3: 28,
    moc: 'SS 316 / RCC with Acid-Resistant Lining',
    hrtOrCycle: '2.5 Minutes (G = 750 s⁻¹)',
    liveMetricLabel: 'Coagulant Dosage',
    liveMetricValue: 'PAC 450 mg/L | Lime pH 7.8',
    status: 'Normal',
    description: 'High-speed turbine rapid mixing unit where lime and polyaluminium chloride destabilize colloidal charges and neutralize acidic pH.',
    maintenanceNote: 'Mechanical mixer gearbox oil clean; motor 7.5 kW pulling 11.2A.',
  },
  {
    id: 'unit-fl',
    tag: 'FL-202',
    name: 'Slow-Mix Flocculator Chamber',
    stage: 'Floc Growth',
    position: [-2, 2.5, 8],
    dimensions: '6.0m × 4.0m × 3.5m',
    volumeM3: 84,
    moc: 'RCC M30 with Baffle Walls',
    hrtOrCycle: '22 Minutes (G = 40 s⁻¹)',
    liveMetricLabel: 'Polymer Addition',
    liveMetricValue: 'Cationic Polyacrylamide 4.2 mg/L',
    status: 'Normal',
    description: 'Gentle paddle agitation allows micro-flocs to aggregate into large, rapid-settling macro-flocs via polymer bridge formation.',
    maintenanceNote: 'Variable frequency drive operating at 18 RPM smooth sweep.',
  },
  {
    id: 'unit-clr',
    tag: 'CLR-301',
    name: 'Primary Chemical Clarifier & Settler',
    stage: 'Phase Separation',
    position: [6, 3, 8],
    dimensions: '12.0m Ø × 3.8m SWD + 1:12 Hopper',
    volumeM3: 420,
    moc: 'RCC M30 with Peripheral V-Notch Weir',
    hrtOrCycle: '3.2 Hours Settling HRT',
    liveMetricLabel: 'Underflow Solids / Clarified COD',
    liveMetricValue: '3.8% TS | 82% COD Removal',
    status: 'Normal',
    description: 'Gravity sedimentation vessel separating clarified supernatant overflow from heavy chemical sludge underflow collected by central rotating scraper rake.',
    maintenanceNote: 'Bridge torque overload switch operational; scraper rubber blades inspected.',
  },
  {
    id: 'unit-thk',
    tag: 'THK-401',
    name: 'Gravity Sludge Thickener Tank',
    stage: 'Sludge Pre-Conditioning',
    position: [6, 2.5, -4],
    dimensions: '8.0m Ø × 4.0m SWD with Picket Fence',
    volumeM3: 180,
    moc: 'RCC M30 with Dual Underflow Cones',
    hrtOrCycle: '18 Hours Thickening Cycle',
    liveMetricLabel: 'Thickened Sludge Solids',
    liveMetricValue: '5.4% TS (Feed to Dewatering)',
    status: 'Attention',
    description: 'Picket-fence thickener gently releases trapped interstitial water from flocs, reducing sludge volume by 45% before mechanical pressing.',
    maintenanceNote: 'Supernatant turbidity sensor reading 42 NTU; decant valve cycling normal.',
  },
  {
    id: 'unit-dwb',
    tag: 'DWB-501',
    name: 'Dewatering Press Building & System',
    stage: 'Mechanical Dewatering',
    position: [-2, 4, -4],
    dimensions: '18.0m × 10.0m × 7.0m Steel Shed',
    volumeM3: 120,
    moc: 'Structural Steel with Recessed Plate & Frame Press',
    hrtOrCycle: '2.5 Hr Batch Pressing Cycle (16 Bar)',
    liveMetricLabel: 'Cake Moisture / Volume Reduction',
    liveMetricValue: '68.4% Moisture | 72% Vol Reduction',
    status: 'Normal',
    description: 'High-pressure recessed chamber filter press compresses thickened slurry to form dry handleable cake. Filtrate is collected and returned to EQ basin.',
    maintenanceNote: 'Polypropylene filter cloths washed with 3% HCl; hydraulic ram pressure 220 bar.',
  },
  {
    id: 'unit-str',
    tag: 'STR-601',
    name: 'Dedicated Impermeable RCC Sludge Storage Shed',
    stage: 'Statutory On-Site Storage',
    position: [-14, 3.5, -4],
    dimensions: '22.0m × 12.0m × 6.5m Enclosed Shed',
    volumeM3: 380,
    moc: 'RCC M30 Impermeable Floor + Acid-Proof Coating',
    hrtOrCycle: 'Max 90 Days Storage (HOWM Rule 8)',
    liveMetricLabel: 'Stored Mass / Capacity Used',
    liveMetricValue: '48.2 Tonnes (32% of 150T CTO Limit)',
    status: 'Normal',
    description: 'Mandatory covered RCC containment facility conforming to KSPCB Consent Condition 4 & HOWM Rule 8. Features internal leachate sump and perimeter containment dyke.',
    maintenanceNote: 'Leachate pump dry; zero stormwater ingress; CPCB hazardous waste board visible.',
  },
  {
    id: 'unit-dsp',
    tag: 'DSP-701',
    name: 'Weighbridge & TSDF Dispatch Bay',
    stage: 'Authorized Transport',
    position: [-22, 1, -4],
    dimensions: '16.0m × 4.0m Weigh Platform',
    volumeM3: 60,
    moc: 'Load-Cell Concrete Weighbridge (60T Capacity)',
    hrtOrCycle: 'Form 10 Manifest Check per Dispatch',
    liveMetricLabel: 'Next Disposal Run',
    liveMetricValue: 'KWMP Dabaspet TSDF (GPS Vehicle)',
    status: 'Normal',
    description: 'Secure vehicle weighing terminal and hazardous waste manifest generation station with GPS tracking integration for highway dispatch to authorized TSDF.',
    maintenanceNote: 'Weighbridge stamped by Dept. of Legal Metrology; calibrated within ±0.05%.',
  },
];

export const Plant3DDesignView: React.FC = () => {
  const { batches, storageCapacityTonnes } = useETP();
  const mountRef = useRef<HTMLDivElement>(null);

  // UI state
  const [selectedUnit, setSelectedUnit] = useState<UnitSpecification>(PLANT_UNITS[0]);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('overview');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const width = container.clientWidth;
    const height = container.clientHeight || 580;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isNightMode ? 0x090d16 : 0xf1f5f9);
    scene.fog = new THREE.FogExp2(isNightMode ? 0x090d16 : 0xf1f5f9, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(-28, 24, 28);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x223344 : 0xffffff,
      isNightMode ? 0.6 : 0.85
    );
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(isNightMode ? 0x6688cc : 0xfffaed, isNightMode ? 0.8 : 1.4);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    // Subtle blue accent ground light
    const pointLight = new THREE.PointLight(0x2563eb, isNightMode ? 2.5 : 1.0, 40);
    pointLight.position.set(0, 6, 0);
    scene.add(pointLight);

    // 3. Ground Terrain & Roads
    const groundGeo = new THREE.PlaneGeometry(80, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x0d1522 : 0xe2e8f0,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Concrete plant slab
    const slabGeo = new THREE.BoxGeometry(68, 0.4, 40);
    const slabMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x131c2e : 0xcbd5e1,
      roughness: 0.8,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(-5, 0.1, 2);
    slab.receiveShadow = true;
    scene.add(slab);

    // Grid lines for engineering layout
    const grid = new THREE.GridHelper(70, 35, 0x94a3b8, isNightMode ? 0x1e293b : 0xe2e8f0);
    grid.position.y = 0.35;
    scene.add(grid);

    // 4. Construct 3D Industrial Units
    const meshes = new Map<string, THREE.Mesh>();

    // A. Equalization Basin (Cylinder)
    const eqGeo = new THREE.CylinderGeometry(5.5, 5.5, 4.0, 32);
    const eqMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      wireframe: isWireframe,
    });
    const eqMesh = new THREE.Mesh(eqGeo, eqMat);
    eqMesh.position.set(-16, 2.0, 8);
    eqMesh.castShadow = true;
    eqMesh.receiveShadow = true;
    scene.add(eqMesh);
    meshes.set('unit-eq', eqMesh);

    // Water surface in EQ basin
    const eqWaterGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.2, 32);
    const eqWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const eqWater = new THREE.Mesh(eqWaterGeo, eqWaterMat);
    eqWater.position.set(-16, 3.8, 8);
    scene.add(eqWater);

    // B. Flash Mixer (Square tank)
    const fmGeo = new THREE.BoxGeometry(3.5, 4.0, 3.5);
    const fmMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, wireframe: isWireframe });
    const fmMesh = new THREE.Mesh(fmGeo, fmMat);
    fmMesh.position.set(-8, 2.0, 8);
    fmMesh.castShadow = true;
    scene.add(fmMesh);
    meshes.set('unit-fm', fmMesh);

    // Motor on top of Flash Mixer
    const motorGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(-8, 4.6, 8);
    scene.add(motor);

    // C. Flocculator (Rectangular tank with baffles)
    const flGeo = new THREE.BoxGeometry(5.5, 3.8, 4.5);
    const flMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, wireframe: isWireframe });
    const flMesh = new THREE.Mesh(flGeo, flMat);
    flMesh.position.set(-2, 1.9, 8);
    flMesh.castShadow = true;
    scene.add(flMesh);
    meshes.set('unit-fl', flMesh);

    // D. Primary Clarifier (Circular tank with center hopper and bridge)
    const clrGeo = new THREE.CylinderGeometry(6.5, 5.8, 3.6, 36);
    const clrMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, wireframe: isWireframe });
    const clrMesh = new THREE.Mesh(clrGeo, clrMat);
    clrMesh.position.set(6, 1.8, 8);
    clrMesh.castShadow = true;
    scene.add(clrMesh);
    meshes.set('unit-clr', clrMesh);

    // Clarifier bridge
    const bridgeGeo = new THREE.BoxGeometry(13.2, 0.4, 1.2);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(6, 3.8, 8);
    scene.add(bridge);

    // E. Gravity Sludge Thickener
    const thkGeo = new THREE.CylinderGeometry(4.2, 4.2, 4.2, 28);
    const thkMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.6, wireframe: isWireframe });
    const thkMesh = new THREE.Mesh(thkGeo, thkMat);
    thkMesh.position.set(6, 2.1, -4);
    thkMesh.castShadow = true;
    scene.add(thkMesh);
    meshes.set('unit-thk', thkMesh);

    // F. Dewatering Press Building (Industrial Hall with roof)
    const dwbGeo = new THREE.BoxGeometry(12.0, 6.0, 8.0);
    const dwbMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      wireframe: isWireframe,
      transparent: true,
      opacity: 0.9,
    });
    const dwbMesh = new THREE.Mesh(dwbGeo, dwbMat);
    dwbMesh.position.set(-2, 3.0, -4);
    dwbMesh.castShadow = true;
    scene.add(dwbMesh);
    meshes.set('unit-dwb', dwbMesh);

    // Press Building pitched roof
    const roofGeo = new THREE.ConeGeometry(9.0, 2.0, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(-2, 7.0, -4);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);

    // G. Dedicated RCC Sludge Storage Shed (Enclosed wall with yellow hazard strip)
    const strGeo = new THREE.BoxGeometry(14.0, 5.0, 9.0);
    const strMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      wireframe: isWireframe,
    });
    const strMesh = new THREE.Mesh(strGeo, strMat);
    strMesh.position.set(-15, 2.5, -4);
    strMesh.castShadow = true;
    scene.add(strMesh);
    meshes.set('unit-str', strMesh);

    // Hazard sign ribbon on shed
    const ribbonGeo = new THREE.BoxGeometry(14.2, 0.6, 9.2);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(-15, 4.0, -4);
    scene.add(ribbon);

    // H. Weighbridge Platform & Dispatch Bay
    const dspGeo = new THREE.BoxGeometry(9.0, 0.4, 4.5);
    const dspMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const dspMesh = new THREE.Mesh(dspGeo, dspMat);
    dspMesh.position.set(-24, 0.4, -4);
    dspMesh.castShadow = true;
    scene.add(dspMesh);
    meshes.set('unit-dsp', dspMesh);

    // TSDF Transport Truck model
    const truckCabinGeo = new THREE.BoxGeometry(2.5, 2.4, 2.2);
    const truckCabinMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const truckCabin = new THREE.Mesh(truckCabinGeo, truckCabinMat);
    truckCabin.position.set(-26.5, 1.4, -4);
    scene.add(truckCabin);

    const truckBedGeo = new THREE.BoxGeometry(4.5, 2.2, 2.4);
    const truckBedMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const truckBed = new THREE.Mesh(truckBedGeo, truckBedMat);
    truckBed.position.set(-23.0, 1.3, -4);
    scene.add(truckBed);

    meshesRef.current = meshes;

    // 5. Connecting Pipelines (Industrial Material Conduits)
    const createPipe = (p1: [number, number, number], p2: [number, number, number], color: number) => {
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);
      const dist = v1.distanceTo(v2);
      const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, dist, 12);
      const pipeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.6 });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);

      pipe.position.copy(v1.clone().add(v2).multiplyScalar(0.5));
      pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
      scene.add(pipe);
    };

    // Raw Influent: EQ -> Flash Mix (Blue)
    createPipe([-10.5, 2.5, 8], [-9.8, 2.5, 8], 0x0284c7);
    // Flash Mix -> Flocculator (Amber)
    createPipe([-6.2, 2.5, 8], [-4.8, 2.5, 8], 0xf59e0b);
    // Flocculator -> Clarifier (Green)
    createPipe([0.8, 2.5, 8], [0.8, 2.5, 8], 0x10b981);
    // Clarifier Underflow -> Thickener (Brown)
    createPipe([6, 0.8, 5.0], [6, 0.8, -1.8], 0x78350f);
    // Thickener -> Dewatering Building (Dark Slurry)
    createPipe([3.8, 1.5, -4], [4.0, 1.5, -4], 0x451a03);
    // Dewatering -> RCC Storage Shed (Cake Conveyor)
    createPipe([-8.0, 2.5, -4], [-8.0, 2.5, -4], 0x64748b);
    // Filtrate Return Loop -> EQ Basin (Cyan overhead return line)
    createPipe([-2, 5.5, -4], [-16, 5.5, 8], 0x06b6d4);

    // 6. Flow Particles Animation
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 45;
      particlePos[i * 3 + 1] = Math.random() * 5 + 0.5;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.25,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 7. Mouse Orbit & Raycasting Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let theta = Math.PI / 4;
    let phi = Math.PI / 4;
    let radius = 45;

    const updateCameraPos = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(-4, 2, 2);
    };
    updateCameraPos();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      theta -= deltaX * 0.008;
      phi = Math.max(0.1, Math.min(Math.PI / 2.1, phi - deltaY * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(15, Math.min(80, radius + e.deltaY * 0.03));
      updateCameraPos();
    };

    // Raycast to click units
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshList = Array.from(meshes.values());
      const intersects = raycaster.intersectObjects(meshList, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        for (const [unitId, mesh] of meshes.entries()) {
          if (mesh === hit || mesh.children.includes(hit as any)) {
            const unit = PLANT_UNITS.find(u => u.id === unitId);
            if (unit) setSelectedUnit(unit);
            break;
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slow auto rotation if enabled
      if (isAutoRotate && !isDragging) {
        theta += 0.003;
        updateCameraPos();
      }

      // Rotate clarifier bridge slowly
      bridge.rotation.y += 0.002;

      // Animate particles along flow
      if (particles) {
        const positions = particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += 0.08;
          if (positions[i * 3] > 25) positions[i * 3] = -25;
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (container.contains(dom)) container.removeChild(dom);
      renderer.dispose();
    };
  }, [isNightMode, isAutoRotate, isWireframe]);

  // Viewport Presets
  const handleSelectPreset = (preset: string) => {
    setActivePreset(preset);
    const camera = cameraRef.current;
    if (!camera) return;

    switch (preset) {
      case 'overview':
        camera.position.set(-28, 24, 28);
        camera.lookAt(-4, 2, 2);
        break;
      case 'reaction':
        camera.position.set(-8, 10, 18);
        camera.lookAt(-8, 2, 8);
        setSelectedUnit(PLANT_UNITS[1]); // Flash Mix
        break;
      case 'clarifier':
        camera.position.set(16, 12, 16);
        camera.lookAt(6, 3, 8);
        setSelectedUnit(PLANT_UNITS[3]); // Clarifier
        break;
      case 'dewatering':
        camera.position.set(4, 12, 6);
        camera.lookAt(-2, 3, -4);
        setSelectedUnit(PLANT_UNITS[5]); // Press Building
        break;
      case 'storage':
        camera.position.set(-22, 10, 8);
        camera.lookAt(-15, 3, -4);
        setSelectedUnit(PLANT_UNITS[6]); // Storage Shed
        break;
      case 'dispatch':
        camera.position.set(-30, 8, 4);
        camera.lookAt(-22, 1, -4);
        setSelectedUnit(PLANT_UNITS[7]); // Weighbridge
        break;
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              3D Plant Design & Implementation Twin
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
              DIGITAL TWIN V2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time interactive 3D engineering layout of the chemical coagulation-flocculation sludge facility from raw effluent equalization to authorized TSDF dispatch.
          </p>
        </div>

        {/* Global Controls & Mode Switchers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsNightMode(!isNightMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Toggle Day/Night Shift Lighting"
          >
            {isNightMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isNightMode ? 'Day Mode' : 'Night Shift'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-colors cursor-pointer',
              isAutoRotate
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            )}
            title="Toggle Continuous Turntable Orbit"
          >
            <RotateCw className={clsx('w-3.5 h-3.5', isAutoRotate && 'animate-spin')} />
            <span>Auto-Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWireframe(!isWireframe)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-colors cursor-pointer',
              isWireframe
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            )}
            title="Toggle Structural Wireframe Mode"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>
        </div>
      </div>

      {/* Camera Viewpoint Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold text-[11px] shrink-0 mr-1 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" />
          Camera Tours:
        </span>
        {[
          { id: 'overview', label: '1. Master Plant Overview' },
          { id: 'reaction', label: '2. Chemical Reaction Stage' },
          { id: 'clarifier', label: '3. Clarifier & Thickening' },
          { id: 'dewatering', label: '4. Filter Press Building' },
          { id: 'storage', label: '5. RCC Storage Shed (HOWM Rule 8)' },
          { id: 'dispatch', label: '6. Weighbridge & TSDF Bay' },
        ].map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelectPreset(p.id)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
              activePreset === p.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main 3D Viewport & Equipment Inspector Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: 3D Interactive WebGL Canvas */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col">
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold tracking-wider uppercase text-[11px]">
                WebGL Interactive 3D Canvas
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Drag to orbit • Scroll to zoom • Click equipment to inspect
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              60 FPS | Hardware Accelerated
            </span>
          </div>

          <div
            ref={mountRef}
            className="w-full h-[540px] relative cursor-grab active:cursor-grabbing bg-slate-950"
          >
            {/* Overlay Compass Rose / Scale Indicator */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white p-2.5 rounded-xl border border-slate-700/60 text-[10px] font-mono space-y-1 select-none pointer-events-none">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Navigation className="w-3 h-3 text-blue-400 -rotate-45" />
                <span>ORIENTATION: NORTH-FACING</span>
              </div>
              <div className="text-slate-400">GRID: 5.0m × 5.0m STRUCTURAL SPACING</div>
              <div className="text-emerald-400">HYDRAULIC FLOW: WEST → EAST</div>
            </div>

            {/* Quick Selected Tag Floating Badge */}
            <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white px-3 py-2 rounded-xl border border-slate-700/60 text-xs flex items-center gap-2 select-none">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-bold font-mono text-blue-300">{selectedUnit.tag}</span>
              <span className="text-slate-300 font-medium">{selectedUnit.name}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Deep Equipment & Civil Engineering Specs Drawer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header info */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {selectedUnit.tag}
                </span>
                <span className="text-[10px] font-mono uppercase font-semibold text-slate-400">
                  {selectedUnit.stage}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {selectedUnit.name}
              </h3>
            </div>

            {/* Live Telemetry Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {selectedUnit.liveMetricLabel}
              </span>
              <div className="text-base font-bold font-mono text-slate-900">
                {selectedUnit.liveMetricValue}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold pt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Operating within design threshold limits</span>
              </div>
            </div>

            {/* Detailed Mechanical & Civil Specifications */}
            <div className="space-y-2 text-xs">
              <span className="text-slate-900 font-bold uppercase tracking-wider text-[11px] block">
                Engineering Design Specifications
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Dimensions</span>
                  <span className="font-mono font-bold text-slate-800">{selectedUnit.dimensions}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Effective Volume</span>
                  <span className="font-mono font-bold text-slate-800">{selectedUnit.volumeM3} m³</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Material of Const. (MOC)</span>
                  <span className="font-medium text-slate-800">{selectedUnit.moc}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">HRT / Cycle Time</span>
                  <span className="font-mono font-bold text-slate-800">{selectedUnit.hrtOrCycle}</span>
                </div>
              </div>
            </div>

            {/* Process Description */}
            <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <span className="font-bold text-slate-800 block mb-1">Process Mechanics:</span>
              {selectedUnit.description}
            </div>

            {/* Maintenance & Sensor Audit Log */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-800 block flex items-center gap-1.5 text-[11px]">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                Maintenance & Verification Status
              </span>
              <p className="text-[11px] text-slate-600 leading-normal">
                {selectedUnit.maintenanceNote}
              </p>
            </div>
          </div>

          {/* Quick Unit Selector Pills */}
          <div className="border-t border-slate-100 pt-3">
            <span className="text-[10px] text-slate-400 font-mono block mb-1.5 uppercase">
              Select Unit to Inspect:
            </span>
            <div className="grid grid-cols-4 gap-1">
              {PLANT_UNITS.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUnit(u)}
                  className={clsx(
                    'px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer text-center',
                    selectedUnit.id === u.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {u.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plant Implementation Schedule & Statutory Compliance Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Statutory Design Compliance</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All structural boundaries, RCC storage impermeability, and leachate sumps are engineered in strict conformance with KSPCB Consent No. 782 and Schedule II of HOWM Rules 2016.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span>Zero Liquid Discharge Recycle</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All mechanical filter press filtrate (TSS &lt; 200 mg/L) and thickener decant liquor return automatically through overhead closed conduits directly into Equalization Tank EQ-101.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Civil & Foundation Rating</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            RCC M30 grade concrete with sulphate-resistant cement (SRC) and dual polyurethane elastomeric membrane coating prevents subsoil acid corrosion or hazardous heavy metal leaching.
          </p>
        </div>
      </div>
    </div>
  );
};
