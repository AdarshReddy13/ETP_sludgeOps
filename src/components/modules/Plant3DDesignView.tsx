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

interface FieldInstrument {
  id: string;
  tag: string;
  name: string;
  position: [number, number, number];
  unitId: string;
}

const FIELD_INSTRUMENTS: FieldInstrument[] = [
  { id: 'inst-fit-101', tag: 'FIT-101', name: 'Inlet Mag Flowmeter', position: [-10.2, 3.3, 8.0], unitId: 'unit-eq' },
  { id: 'inst-at-102', tag: 'AT-102', name: 'pH / COD Analyzer', position: [-16.0, 5.2, 6.2], unitId: 'unit-eq' },
  { id: 'inst-m-201', tag: 'M-201', name: '7.5kW Agitator Motor', position: [-8.0, 5.8, 8.0], unitId: 'unit-fm' },
  { id: 'inst-lt-301', tag: 'LT-301', name: 'Clarifier Level Sensor', position: [6.0, 5.4, 8.0], unitId: 'unit-clr' },
  { id: 'inst-dp-401', tag: 'DP-401', name: 'Sludge Transfer Pump', position: [3.2, 2.1, -4.0], unitId: 'unit-thk' },
  { id: 'inst-pt-501', tag: 'PT-501', name: '16-Bar Filter Press', position: [-2.0, 7.8, -4.0], unitId: 'unit-dwb' },
  { id: 'inst-wi-701', tag: 'WI-701', name: '60T Weighbridge & Cabin', position: [-23.5, 4.0, -7.8], unitId: 'unit-dsp' },
];

export const Plant3DDesignView: React.FC = () => {
  const { batches, storageCapacityTonnes } = useETP();
  const mountRef = useRef<HTMLDivElement>(null);

  // UI state
  const [selectedUnit, setSelectedUnit] = useState<UnitSpecification>(PLANT_UNITS[0]);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<string>('overview');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const labelElsRef = useRef<Map<string, HTMLButtonElement | HTMLDivElement>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const width = container.clientWidth;
    const height = container.clientHeight || 580;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const skyColor = isNightMode ? 0x070b14 : 0xdbe6f2;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.0085);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 320);
    camera.position.set(-28, 22, 28);
    camera.lookAt(-5, 2, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isNightMode ? 1.05 : 1.12;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Helper: Procedural Canvas Textures for Real-World Industrial Materials
    const makeTexture = (
      base: string,
      speckle1: string,
      speckle2: string,
      lines = false,
      repeatX = 4,
      repeatY = 4
    ) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2400; i++) {
        ctx.fillStyle = i % 2 === 0 ? speckle1 : speckle2;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
      if (lines) {
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.lineWidth = 2;
        for (let y = 0; y < 256; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(256, y);
          ctx.stroke();
        }
        for (let x = 0; x < 256; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 256);
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
      return tex;
    };

    const concreteTex = makeTexture('#94a3b8', 'rgba(255,255,255,0.08)', 'rgba(15,23,42,0.12)', true, 3, 3);
    const darkConcreteTex = makeTexture('#64748b', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.18)', true, 2, 2);
    const steelPanelTex = makeTexture('#475569', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.15)', true, 4, 3);
    const asphaltTex = makeTexture('#272b33', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.25)', false, 8, 2);

    const concreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.88,
      metalness: 0.05,
      wireframe: isWireframe,
    });
    const darkConcreteMat = new THREE.MeshStandardMaterial({
      map: darkConcreteTex,
      roughness: 0.85,
      metalness: 0.08,
      wireframe: isWireframe,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.38,
      metalness: 0.72,
      wireframe: isWireframe,
    });
    const claddingMat = new THREE.MeshStandardMaterial({
      map: steelPanelTex,
      color: 0xcbd5e1,
      roughness: 0.45,
      metalness: 0.55,
      wireframe: isWireframe,
    });
    const safetyYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.35,
      wireframe: isWireframe,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0xfef08a : 0x38bdf8,
      emissive: isNightMode ? 0xf59e0b : 0x0284c7,
      emissiveIntensity: isNightMode ? 0.55 : 0.15,
      roughness: 0.15,
      metalness: 0.8,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.12,
      metalness: 0.4,
      transparent: true,
      opacity: 0.86,
    });
    const darkWaterMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.18,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
    });

    // 2. Realistic Industrial Lighting
    const hemiLight = new THREE.HemisphereLight(
      isNightMode ? 0x334155 : 0xe0f2fe,
      isNightMode ? 0x0f172a : 0x64748b,
      isNightMode ? 0.65 : 0.95
    );
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(isNightMode ? 0x93c5fd : 0xfff7ed, isNightMode ? 0.85 : 1.75);
    dirLight.position.set(24, 42, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 110;
    dirLight.shadow.camera.left = -36;
    dirLight.shadow.camera.right = 36;
    dirLight.shadow.camera.top = 36;
    dirLight.shadow.camera.bottom = -36;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 3. Industrial Site Ground, Concrete Apron & Haulage Road
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 90),
      new THREE.MeshStandardMaterial({
        color: isNightMode ? 0x0b111d : 0x9ca3af,
        roughness: 0.95,
        metalness: 0.02,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Concrete Plant Pad
    const slab = new THREE.Mesh(new THREE.BoxGeometry(66, 0.35, 36), concreteMat);
    slab.position.set(-5, 0.175, 2);
    slab.receiveShadow = true;
    scene.add(slab);

    // Asphalt Haulage Road along South/West edge (leading to DSP-701 Weighbridge)
    const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.9, metalness: 0.05 });
    const road = new THREE.Mesh(new THREE.BoxGeometry(68, 0.08, 6.2), roadMat);
    road.position.set(-5, 0.36, -12.2);
    road.receiveShadow = true;
    scene.add(road);

    // Road center dashed yellow markings
    for (let rx = -34; rx <= 24; rx += 3.5) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.16), safetyYellowMat);
      dash.position.set(rx, 0.41, -12.2);
      scene.add(dash);
    }

    // Helper: Build Hollow Open-Top Rectangular Tank
    const buildRectTank = (
      group: THREE.Group,
      w: number,
      h: number,
      d: number,
      wallT: number,
      liquidColorMat: THREE.Material
    ) => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), darkConcreteMat);
      base.position.y = 0.2;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      const wallSpecs: [number, number, number, number, number, number][] = [
        [w, h, wallT, 0, h / 2, d / 2 - wallT / 2],
        [w, h, wallT, 0, h / 2, -d / 2 + wallT / 2],
        [wallT, h, d - wallT * 2, -w / 2 + wallT / 2, h / 2, 0],
        [wallT, h, d - wallT * 2, w / 2 - wallT / 2, h / 2, 0],
      ];
      wallSpecs.forEach(([bw, bh, bd, bx, by, bz]) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), concreteMat);
        wall.position.set(bx, by, bz);
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);
      });

      // Liquid surface inside
      const liquid = new THREE.Mesh(
        new THREE.BoxGeometry(w - wallT * 2 - 0.1, 0.15, d - wallT * 2 - 0.1),
        liquidColorMat
      );
      liquid.position.y = h - 0.55;
      group.add(liquid);
    };

    // Helper: Add safety handrail bar along X or Z
    const addHandrail = (
      group: THREE.Group,
      x1: number,
      y: number,
      z1: number,
      x2: number,
      z2: number
    ) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const angle = Math.atan2(x2 - x1, z2 - z1);

      const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 8), safetyYellowMat);
      topRail.position.set(midX, y + 0.85, midZ);
      topRail.rotation.x = Math.PI / 2;
      topRail.rotation.z = -angle;
      group.add(topRail);

      const midRail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 8), safetyYellowMat);
      midRail.position.set(midX, y + 0.45, midZ);
      midRail.rotation.x = Math.PI / 2;
      midRail.rotation.z = -angle;
      group.add(midRail);

      const posts = Math.max(2, Math.floor(len / 1.5) + 1);
      for (let i = 0; i < posts; i++) {
        const t = i / (posts - 1);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), safetyYellowMat);
        post.position.set(x1 + (x2 - x1) * t, y + 0.45, z1 + (z2 - z1) * t);
        group.add(post);
      }
    };

    // 4. Construct Blueprint-Accurate Industrial Units
    const meshes = new Map<string, THREE.Object3D>();

    // A. EQ-101: Equalization Basin (Large Concrete Rectangular Basin + Catwalk + Agitator + Pump Sump)
    const eqGroup = new THREE.Group();
    eqGroup.position.set(-16, 0.35, 8);
    buildRectTank(eqGroup, 9.5, 4.2, 8.5, 0.45, darkWaterMat);

    // Overhead steel bridge & agitator motor
    const eqBridge = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.25, 1.3), steelMat);
    eqBridge.position.set(0, 4.35, 0);
    eqBridge.castShadow = true;
    eqGroup.add(eqBridge);
    addHandrail(eqGroup, -4.6, 4.45, 0.6, 4.6, 0.6);
    addHandrail(eqGroup, -4.6, 4.45, -0.6, 4.6, -0.6);

    const eqMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.0, 16), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.3 }));
    eqMotor.position.set(0, 5.0, 0);
    eqMotor.castShadow = true;
    eqGroup.add(eqMotor);

    // Adjacent concrete pump sump + feed pump (from blueprint)
    const sump = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.4), darkConcreteMat);
    sump.position.set(6.0, 1.0, 2.0);
    sump.castShadow = true;
    eqGroup.add(sump);
    const eqPump = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 }));
    eqPump.rotation.z = Math.PI / 2;
    eqPump.position.set(6.0, 2.35, 2.0);
    eqGroup.add(eqPump);

    scene.add(eqGroup);
    meshes.set('unit-eq', eqGroup);

    // B. FM-201: Flash Mix Coagulation Tank + Overhead Motor M-201 + Dosing Skid
    const fmGroup = new THREE.Group();
    fmGroup.position.set(-8, 0.35, 8);
    buildRectTank(fmGroup, 3.8, 4.0, 3.8, 0.35, waterMat);

    const fmBeam = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.25, 0.9), steelMat);
    fmBeam.position.set(0, 4.15, 0);
    fmGroup.add(fmBeam);
    const fmMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.65, roughness: 0.25 }));
    fmMotor.position.set(0, 4.85, 0);
    fmMotor.castShadow = true;
    fmGroup.add(fmMotor);

    // Coagulant chemical dosing tank beside FM-201
    const chemTank = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.2, 18), new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 }));
    chemTank.position.set(0, 1.1, 3.0);
    chemTank.castShadow = true;
    fmGroup.add(chemTank);

    scene.add(fmGroup);
    meshes.set('unit-fm', fmGroup);

    // C. FL-202: Flocculation Chamber (Baffled Tank + Paddle Drive)
    const flGroup = new THREE.Group();
    flGroup.position.set(-2, 0.35, 8);
    buildRectTank(flGroup, 5.4, 3.8, 4.6, 0.35, waterMat);

    // Internal baffle walls visible in tank
    [-1.2, 0, 1.2].forEach(bx => {
      const baffle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 3.8), darkConcreteMat);
      baffle.position.set(bx, 1.6, 0);
      flGroup.add(baffle);
    });
    const flBridge = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.22, 1.0), steelMat);
    flBridge.position.set(0, 3.9, 0);
    flGroup.add(flBridge);
    const flMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.85, 14), steelMat);
    flMotor.position.set(0, 4.45, 0);
    flGroup.add(flMotor);

    scene.add(flGroup);
    meshes.set('unit-fl', flGroup);

    // D. CLR-301: Primary Chemical Clarifier & Settler (Circular Concrete Basin + Yellow Rotating Scraper Bridge)
    const clrGroup = new THREE.Group();
    clrGroup.position.set(6.5, 0.35, 8);

    // Outer stepped concrete cylinder wall (hollow ring using Cylinder openEnded + rim)
    const clrWall = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 3.6, 40, 1, true), concreteMat);
    clrWall.position.y = 1.8;
    clrWall.castShadow = true;
    clrWall.receiveShadow = true;
    clrGroup.add(clrWall);

    // Outer concrete rim & launder trough
    const clrRim = new THREE.Mesh(new THREE.TorusGeometry(6.0, 0.35, 10, 40), darkConcreteMat);
    clrRim.rotation.x = Math.PI / 2;
    clrRim.position.y = 3.6;
    clrGroup.add(clrRim);

    // Clarifier floor & clarified water disc
    const clrWater = new THREE.Mesh(new THREE.CylinderGeometry(5.9, 5.9, 0.25, 36), waterMat);
    clrWater.position.y = 3.15;
    clrGroup.add(clrWater);

    // Center feedwell pier & drive column
    const feedwell = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.8, 24), darkConcreteMat);
    feedwell.position.y = 1.9;
    clrGroup.add(feedwell);

    // Rotating Yellow Truss Scraper Bridge (Signature feature from blueprint!)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.y = 3.9;
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.28, 1.3), safetyYellowMat);
    bridgeDeck.castShadow = true;
    bridgeGroup.add(bridgeDeck);
    addHandrail(bridgeGroup, -6.1, 0.14, 0.6, 6.1, 0.6);
    addHandrail(bridgeGroup, -6.1, 0.14, -0.6, 6.1, -0.6);

    const centerDrive = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.9, 16), steelMat);
    centerDrive.position.y = 0.55;
    bridgeGroup.add(centerDrive);

    clrGroup.add(bridgeGroup);
    scene.add(clrGroup);
    meshes.set('unit-clr', clrGroup);

    // E. THK-401: Gravity Sludge Thickener (Circular Concrete Tank + Picket Fence Bridge)
    const thkGroup = new THREE.Group();
    thkGroup.position.set(6.5, 0.35, -4);
    const thkWall = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 4.0, 32, 1, true), darkConcreteMat);
    thkWall.position.y = 2.0;
    thkWall.castShadow = true;
    thkGroup.add(thkWall);
    const thkRim = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.28, 10, 32), concreteMat);
    thkRim.rotation.x = Math.PI / 2;
    thkRim.position.y = 4.0;
    thkGroup.add(thkRim);
    const thkSlurry = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.2, 28), new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.5 }));
    thkSlurry.position.y = 3.55;
    thkGroup.add(thkSlurry);
    const thkBridge = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.25, 1.0), steelMat);
    thkBridge.position.y = 4.2;
    thkGroup.add(thkBridge);
    const thkMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.85, 14), safetyYellowMat);
    thkMotor.position.y = 4.75;
    thkGroup.add(thkMotor);

    scene.add(thkGroup);
    meshes.set('unit-thk', thkGroup);

    // F. DWB-501: Dewatering Press Building (3-Story Power-Plant Concrete/Steel Hall + External Staircase + Rooftop HVAC)
    const dwbGroup = new THREE.Group();
    dwbGroup.position.set(-2, 0.35, -4);

    // Main 3-story structure
    const dwbBody = new THREE.Mesh(new THREE.BoxGeometry(11.5, 6.8, 7.6), claddingMat);
    dwbBody.position.y = 3.4;
    dwbBody.castShadow = true;
    dwbBody.receiveShadow = true;
    dwbGroup.add(dwbBody);

    // Concrete structural corner pilasters & roof parapet
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(11.9, 0.45, 8.0), darkConcreteMat);
    parapet.position.y = 6.9;
    dwbGroup.add(parapet);

    // 3 rows of industrial windows on front & back faces (matching blueprint)
    [1.6, 3.5, 5.4].forEach(wy => {
      [-3.5, 0, 3.5].forEach(wx => {
        const winFront = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.12), glassMat);
        winFront.position.set(wx, wy, 3.82);
        dwbGroup.add(winFront);
        const winBack = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.12), glassMat);
        winBack.position.set(wx, wy, -3.82);
        dwbGroup.add(winBack);
      });
    });

    // External 3-flight Steel Staircase on the right side (matching blueprint!)
    [1.5, 3.4, 5.3].forEach((sy, idx) => {
      const landing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 2.4), steelMat);
      landing.position.set(6.55, sy, idx % 2 === 0 ? 1.0 : -1.0);
      landing.castShadow = true;
      dwbGroup.add(landing);
      const flight = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 2.8), steelMat);
      flight.position.set(6.55, sy - 0.85, 0);
      flight.rotation.x = idx % 2 === 0 ? -0.55 : 0.55;
      dwbGroup.add(flight);
      addHandrail(dwbGroup, 7.3, sy, -1.2, 7.3, 1.2);
    });

    // Rooftop HVAC chillers & exhaust stacks (real power-plant silhouette!)
    const hvacUnit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 2.2), steelMat);
    hvacUnit.position.set(-2.2, 7.55, 0);
    hvacUnit.castShadow = true;
    dwbGroup.add(hvacUnit);
    [-0.6, 0.8].forEach(sx => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.8, 14), steelMat);
      stack.position.set(2.5 + sx, 7.9, -1.2);
      stack.castShadow = true;
      dwbGroup.add(stack);
    });

    scene.add(dwbGroup);
    meshes.set('unit-dwb', dwbGroup);

    // G. STR-601: Dedicated Impermeable RCC Sludge Storage Shed (Open-Bay Concrete Containment Walls from Blueprint)
    const strGroup = new THREE.Group();
    strGroup.position.set(-14, 0.35, -4);

    // Impermeable concrete floor pad
    const strPad = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.3, 8.2), darkConcreteMat);
    strPad.position.y = 0.15;
    strPad.receiveShadow = true;
    strGroup.add(strPad);

    // 3 heavy RCC containment walls + front entry opening (exact blueprint layout)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.5, 4.4, 0.5), concreteMat);
    backWall.position.set(0, 2.2, -3.85);
    backWall.castShadow = true;
    strGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 8.2), concreteMat);
    leftWall.position.set(-5.0, 2.2, 0);
    leftWall.castShadow = true;
    strGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 8.2), concreteMat);
    rightWall.position.set(5.0, 2.2, 0);
    rightWall.castShadow = true;
    strGroup.add(rightWall);

    // Partial front retaining walls with wide truck/forklift entry bay
    [-3.2, 3.2].forEach(fx => {
      const frontStub = new THREE.Mesh(new THREE.BoxGeometry(4.1, 4.4, 0.5), concreteMat);
      frontStub.position.set(fx, 2.2, 3.85);
      frontStub.castShadow = true;
      strGroup.add(frontStub);
    });

    // Safety yellow hazard band along top edge
    const hazardBand = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.3, 0.55), safetyYellowMat);
    hazardBand.position.set(0, 4.25, -3.85);
    strGroup.add(hazardBand);

    // Dewatered sludge cake stockpile inside containment bay
    const cakePile = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.8, 6), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 }));
    cakePile.position.set(0, 1.1, -0.8);
    cakePile.scale.set(1.4, 1, 1.1);
    strGroup.add(cakePile);

    scene.add(strGroup);
    meshes.set('unit-str', strGroup);

    // H. DSP-701: Weighbridge & TSDF Dispatch Bay + Concrete Guard Cabin (Blueprint Bottom-Right)
    const dspGroup = new THREE.Group();
    dspGroup.position.set(-23.5, 0.35, -4);

    // Concrete weighbridge deck + approach ramps
    const scaleDeck = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.42, 4.0), darkConcreteMat);
    scaleDeck.position.y = 0.21;
    scaleDeck.receiveShadow = true;
    dspGroup.add(scaleDeck);

    const steelPlate = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.08, 3.2), steelMat);
    steelPlate.position.y = 0.45;
    dspGroup.add(steelPlate);

    // Concrete Guard Cabin next to weighbridge (from blueprint!)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.4), concreteMat);
    cabin.position.set(0, 1.3, -3.8);
    cabin.castShadow = true;
    dspGroup.add(cabin);
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.25, 2.9), darkConcreteMat);
    cabinRoof.position.set(0, 2.7, -3.8);
    dspGroup.add(cabinRoof);
    const cabinWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.12), glassMat);
    cabinWin.position.set(0, 1.7, -2.58);
    dspGroup.add(cabinWin);

    // Realistic TSDF Haulage Truck on scale
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 2.1), steelMat);
    chassis.position.set(0, 0.85, 0);
    dspGroup.add(chassis);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.1, 2.1), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35, metalness: 0.4 }));
    cab.position.set(-2.3, 1.9, 0);
    cab.castShadow = true;
    dspGroup.add(cab);
    const cabWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 1.8), glassMat);
    cabWindshield.position.set(-3.36, 2.2, 0);
    dspGroup.add(cabWindshield);
    const tanker = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.0, 2.2), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.5 }));
    tanker.position.set(1.2, 2.05, 0);
    tanker.castShadow = true;
    dspGroup.add(tanker);
    [-2.5, 0.2, 2.4].forEach(wx => {
      [-1.05, 1.05].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }));
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, 0.65, wz);
        dspGroup.add(wheel);
      });
    });

    scene.add(dspGroup);
    meshes.set('unit-dsp', dspGroup);

    meshesRef.current = meshes;

    // 5. Industrial Pipe Racks, Flanged Pipelines & Field Instrument Housings
    const createPipe = (p1: [number, number, number], p2: [number, number, number], color: number) => {
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);
      const dist = v1.distanceTo(v2);
      if (dist < 0.05) return;
      const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, dist, 14);
      const pipeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.68 });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.copy(v1.clone().add(v2).multiplyScalar(0.5));
      pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
      pipe.castShadow = true;
      scene.add(pipe);
    };

    // Pipe rack steel stanchions
    [[-10.5, 8], [-5.2, 8], [0.5, 8], [3.5, -4], [-8.2, -4]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.2, 0.22), steelMat);
      post.position.set(px, 1.6, pz);
      scene.add(post);
    });

    // Process pipelines matching blueprint routing
    createPipe([-11.2, 2.8, 8], [-9.9, 2.8, 8], 0x0284c7);     // EQ -> Flash Mix
    createPipe([-6.1, 2.8, 8], [-4.7, 2.8, 8], 0xf59e0b);      // Flash Mix -> Flocculator
    createPipe([0.7, 2.8, 8], [0.8, 2.8, 8], 0x10b981);        // Flocculator -> Clarifier
    createPipe([6.5, 1.6, 1.8], [6.5, 1.6, 0.0], 0x78350f);    // Clarifier -> Thickener underflow
    createPipe([2.6, 2.0, -4], [3.8, 2.0, -4], 0x451a03);      // Thickener -> Dewatering Building
    createPipe([-7.8, 2.6, -4], [-9.0, 2.6, -4], 0x64748b);    // Dewatering -> RCC Shed
    createPipe([-2, 6.6, -0.5], [-16, 4.8, 4.0], 0x06b6d4);    // Overhead Filtrate Return Loop

    // Field Instrument Transmitter Markers (glowing cyan/amber sensor heads)
    const instGeo = new THREE.SphereGeometry(0.24, 14, 14);
    const instMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });
    FIELD_INSTRUMENTS.forEach(inst => {
      const marker = new THREE.Mesh(instGeo, instMat);
      marker.position.set(inst.position[0], inst.position[1] - 0.5, inst.position[2]);
      scene.add(marker);
    });

    // Perimeter Industrial Floodlight Poles
    [[-30, 14], [14, 14], [-30, -14], [14, -14]].forEach(([lx, lz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8.5, 8), steelMat);
      pole.position.set(lx, 4.25, lz);
      scene.add(pole);
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.2, 0.35),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfef3c7,
          emissiveIntensity: isNightMode ? 1.5 : 0.2,
        })
      );
      lamp.position.set(lx, 8.5, lz);
      scene.add(lamp);
    });

    // 6. Flow Particles Animation
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 44;
      particlePos[i * 3 + 1] = Math.random() * 4.5 + 0.6;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 7. Mouse Orbit & Raycasting Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.4;
    let radius = 46;

    const updateCameraPos = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta) - 5;
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta) + 1;
      camera.lookAt(-5, 2, 1);
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
      phi = Math.max(0.15, Math.min(Math.PI / 2.15, phi - deltaY * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(16, Math.min(82, radius + e.deltaY * 0.03));
      updateCameraPos();
    };

    // Raycast to click units (walk up parent chain so child meshes select their parent unit)
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
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj) {
          for (const [unitId, rootObj] of meshes.entries()) {
            if (obj === rootObj) {
              const unit = PLANT_UNITS.find(u => u.id === unitId);
              if (unit) setSelectedUnit(unit);
              return;
            }
          }
          obj = obj.parent;
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);

    // 8. Animation Loop + 3D Projected Label Positioning
    let animId: number;
    const projVec = new THREE.Vector3();

    const projectLabel = (id: string, wx: number, wy: number, wz: number) => {
      const el = labelElsRef.current.get(id);
      if (!el) return;
      projVec.set(wx, wy, wz).project(camera);
      if (projVec.z > 1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }
      const w = container.clientWidth;
      const h = container.clientHeight || 540;
      const x = (projVec.x * 0.5 + 0.5) * w;
      const y = (-projVec.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isAutoRotate && !isDragging) {
        theta += 0.0025;
        updateCameraPos();
      }

      // Rotate clarifier scraper bridge slowly
      bridgeGroup.rotation.y += 0.002;

      // Animate flow particles
      if (particles) {
        const positions = particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += 0.07;
          if (positions[i * 3] > 22) positions[i * 3] = -22;
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);

      // Update projected HTML 3D labels at 60 FPS
      PLANT_UNITS.forEach(u => {
        projectLabel(u.id, u.position[0], u.position[1] + 4.0, u.position[2]);
      });
      FIELD_INSTRUMENTS.forEach(inst => {
        projectLabel(inst.id, inst.position[0], inst.position[1], inst.position[2]);
      });
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
            onClick={() => setShowLabels(!showLabels)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-colors cursor-pointer',
              showLabels
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            )}
            title="Show or Hide 3D Unit & Instrument Nameplates"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Unit & Instrument Labels</span>
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
            className="w-full h-[540px] relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950"
          >
            {/* Floating 3D Unit & Field Instrument Nameplates */}
            {showLabels && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                {PLANT_UNITS.map(u => {
                  const isSel = selectedUnit.id === u.id;
                  return (
                    <button
                      key={u.id}
                      ref={el => {
                        if (el) labelElsRef.current.set(u.id, el);
                        else labelElsRef.current.delete(u.id);
                      }}
                      type="button"
                      onClick={() => setSelectedUnit(u)}
                      className={clsx(
                        'absolute top-0 left-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border shadow-sm whitespace-nowrap transition-colors cursor-pointer',
                        isSel
                          ? 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-400/50'
                          : 'bg-slate-900/85 text-slate-100 border-slate-600/80 hover:bg-slate-800'
                      )}
                      style={{ opacity: 0 }}
                    >
                      <span className="text-amber-400 mr-1">{u.tag}</span>
                      <span>{u.name.split(' ').slice(0, 3).join(' ')}</span>
                    </button>
                  );
                })}

                {FIELD_INSTRUMENTS.map(inst => (
                  <button
                    key={inst.id}
                    ref={el => {
                      if (el) labelElsRef.current.set(inst.id, el);
                      else labelElsRef.current.delete(inst.id);
                    }}
                    type="button"
                    onClick={() => {
                      const parentUnit = PLANT_UNITS.find(u => u.id === inst.unitId);
                      if (parentUnit) setSelectedUnit(parentUnit);
                    }}
                    className="absolute top-0 left-0 px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-200 border border-cyan-500/60 text-[9px] font-mono whitespace-nowrap shadow-xs hover:bg-cyan-900 cursor-pointer"
                    style={{ opacity: 0 }}
                  >
                    <span className="font-bold text-cyan-300">{inst.tag}</span>
                    <span className="text-slate-300 ml-1">• {inst.name}</span>
                  </button>
                ))}
              </div>
            )}

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
