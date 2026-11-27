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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
  const controlsRef = useRef<OrbitControls | null>(null);
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
    camera.position.set(1.5, 10.0, 23.5);
    camera.lookAt(-1.5, 2.8, 0.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isNightMode ? 1.05 : 1.05;
    rendererRef.current = renderer;

    // Physically Based Environment Reflections (makes steel, glass, and water look real!)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

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

    const concreteTex = makeTexture('#9ca3af', 'rgba(255,255,255,0.09)', 'rgba(15,23,42,0.18)', true, 3, 3);
    const darkConcreteTex = makeTexture('#374151', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.28)', true, 2, 2);
    const steelPanelTex = makeTexture('#2b3038', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.22)', true, 6, 4);
    const asphaltTex = makeTexture('#3f434a', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.32)', false, 10, 4);

    const concreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      bumpMap: concreteTex,
      bumpScale: 0.1,
      roughness: 0.9,
      metalness: 0.04,
      wireframe: isWireframe,
    });
    const darkConcreteMat = new THREE.MeshStandardMaterial({
      map: darkConcreteTex,
      bumpMap: darkConcreteTex,
      bumpScale: 0.12,
      roughness: 0.88,
      metalness: 0.06,
      wireframe: isWireframe,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.32,
      metalness: 0.82,
      envMapIntensity: 1.25,
      wireframe: isWireframe,
    });
    const charcoalCladdingMat = new THREE.MeshStandardMaterial({
      map: steelPanelTex,
      bumpMap: steelPanelTex,
      bumpScale: 0.08,
      color: 0x3f4652,
      roughness: 0.55,
      metalness: 0.52,
      envMapIntensity: 0.9,
      wireframe: isWireframe,
    });
    const claddingMat = new THREE.MeshStandardMaterial({
      map: steelPanelTex,
      bumpMap: steelPanelTex,
      bumpScale: 0.06,
      color: 0xcbd5e1,
      roughness: 0.45,
      metalness: 0.55,
      envMapIntensity: 1.0,
      wireframe: isWireframe,
    });
    const safetyOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.4,
      metalness: 0.3,
      wireframe: isWireframe,
    });
    const safetyYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.38,
      metalness: 0.32,
      wireframe: isWireframe,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0xfef08a : 0x1e293b,
      emissive: isNightMode ? 0xf59e0b : 0x0f172a,
      emissiveIntensity: isNightMode ? 0.65 : 0.08,
      roughness: 0.1,
      metalness: 0.9,
      envMapIntensity: 1.6,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.04,
      metalness: 0.78,
      envMapIntensity: 1.9,
      transparent: true,
      opacity: 0.9,
    });
    const darkWaterMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.08,
      metalness: 0.65,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.92,
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

    // 3. Industrial Site Ground (Natural Earth/Grass), Concrete Apron & Haulage Road
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 120),
      new THREE.MeshStandardMaterial({
        color: isNightMode ? 0x0c1410 : 0x5c6b57,
        roughness: 0.96,
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

    // B. FM-201: Flash Mix Coagulation Tank (Weathered Dark Concrete + Plinth + Galvanized Top Deck + Blue Gearmotor)
    const fmGroup = new THREE.Group();
    fmGroup.position.set(-8, 0.35, 8);
    // Concrete base plinth
    const fmPlinth = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.6, 4.4), concreteMat);
    fmPlinth.position.y = 0.3;
    fmPlinth.receiveShadow = true;
    fmGroup.add(fmPlinth);

    // Dark weathered concrete tank body
    const fmTank = new THREE.Group();
    fmTank.position.y = 0.6;
    const fmWalls: [number, number, number, number, number, number][] = [
      [3.8, 3.6, 0.35, 0, 1.8, 1.72],
      [3.8, 3.6, 0.35, 0, 1.8, -1.72],
      [0.35, 3.6, 3.1, -1.72, 1.8, 0],
      [0.35, 3.6, 3.1, 1.72, 1.8, 0],
    ];
    fmWalls.forEach(([bw, bh, bd, bx, by, bz]) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), darkConcreteMat);
      w.position.set(bx, by, bz);
      w.castShadow = true;
      w.receiveShadow = true;
      fmTank.add(w);
    });
    const fmLiq = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.15, 3.0), darkWaterMat);
    fmLiq.position.y = 3.1;
    fmTank.add(fmLiq);
    fmGroup.add(fmTank);

    // Galvanized grating platform + perimeter handrails on top (matching reference photo!)
    const fmDeck = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.15, 3.9), steelMat);
    fmDeck.position.y = 4.28;
    fmGroup.add(fmDeck);
    addHandrail(fmGroup, -1.85, 4.35, 1.85, 1.85, 1.85);
    addHandrail(fmGroup, -1.85, 4.35, -1.85, 1.85, -1.85);
    addHandrail(fmGroup, -1.85, 4.35, -1.85, -1.85, 1.85);
    addHandrail(fmGroup, 1.85, 4.35, -1.85, 1.85, 1.85);

    // Bright industrial blue vertical gearmotor M-201
    const fmGearbox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.65), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.25 }));
    fmGearbox.position.set(0, 4.7, 0);
    fmGearbox.castShadow = true;
    fmGroup.add(fmGearbox);
    const fmMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.95, 16), new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.65, roughness: 0.22 }));
    fmMotor.position.set(0, 5.45, 0);
    fmMotor.castShadow = true;
    fmGroup.add(fmMotor);

    // Electrical junction box & steel conduit on side
    const jBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.22), steelMat);
    jBox.position.set(0.9, 1.5, 1.98);
    fmGroup.add(jBox);

    scene.add(fmGroup);
    meshes.set('unit-fm', fmGroup);

    // C. FL-202: Flocculation Chamber (Weathered Concrete Tank on Plinth + Conduit + Baffles)
    const flGroup = new THREE.Group();
    flGroup.position.set(-2, 0.35, 8);
    const flPlinth = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.6, 5.0), concreteMat);
    flPlinth.position.y = 0.3;
    flPlinth.receiveShadow = true;
    flGroup.add(flPlinth);
    const flTankWrap = new THREE.Group();
    flTankWrap.position.y = 0.6;
    buildRectTank(flTankWrap, 5.4, 3.2, 4.6, 0.35, waterMat);
    [-1.2, 0, 1.2].forEach(bx => {
      const baffle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.7, 3.8), darkConcreteMat);
      baffle.position.set(bx, 1.35, 0);
      flTankWrap.add(baffle);
    });
    flGroup.add(flTankWrap);
    const flBridge = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.2, 1.0), steelMat);
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

    // F. DWB-501: Dewatering Press Building (Dark Charcoal Corrugated Steel Hall + Galvanized External Staircase)
    const dwbGroup = new THREE.Group();
    dwbGroup.position.set(-2, 0.35, -4);

    // Main dark charcoal metal building
    const dwbBody = new THREE.Mesh(new THREE.BoxGeometry(11.5, 6.8, 7.6), charcoalCladdingMat);
    dwbBody.position.y = 3.4;
    dwbBody.castShadow = true;
    dwbBody.receiveShadow = true;
    dwbGroup.add(dwbBody);

    // Low-pitch corrugated gable roof
    const dwbRoofLeft = new THREE.Mesh(new THREE.BoxGeometry(11.9, 0.22, 4.2), steelMat);
    dwbRoofLeft.position.set(0, 7.1, 1.9);
    dwbRoofLeft.rotation.x = 0.16;
    dwbGroup.add(dwbRoofLeft);
    const dwbRoofRight = new THREE.Mesh(new THREE.BoxGeometry(11.9, 0.22, 4.2), steelMat);
    dwbRoofRight.position.set(0, 7.1, -1.9);
    dwbRoofRight.rotation.x = -0.16;
    dwbGroup.add(dwbRoofRight);

    // Industrial louvers & access door on dark siding
    const upperDoor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.15), steelMat);
    upperDoor.position.set(3.5, 5.4, 3.82);
    dwbGroup.add(upperDoor);
    const louver = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 0.12), steelMat);
    louver.position.set(-3.0, 5.2, 3.82);
    dwbGroup.add(louver);

    // External 3-flight Galvanized Steel Staircase on the right/front side (matching reference photo!)
    [1.6, 3.5, 5.3].forEach((sy, idx) => {
      const landing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 2.4), steelMat);
      landing.position.set(6.55, sy, idx % 2 === 0 ? 1.0 : -1.0);
      landing.castShadow = true;
      dwbGroup.add(landing);
      const flight = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 2.8), steelMat);
      flight.position.set(6.55, sy - 0.85, 0);
      flight.rotation.x = idx % 2 === 0 ? -0.55 : 0.55;
      dwbGroup.add(flight);
      addHandrail(dwbGroup, 7.3, sy, -1.2, 7.3, 1.2);
    });

    // Rooftop exhaust stack
    const dwbStack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.2, 14), steelMat);
    dwbStack.position.set(0, 7.7, 0);
    dwbGroup.add(dwbStack);

    scene.add(dwbGroup);
    meshes.set('unit-dwb', dwbGroup);

    // G. STR-601: Dedicated Impermeable RCC Sludge Storage Shed (Tall Precast Concrete Warehouse + Orange Fascia Trim)
    const strGroup = new THREE.Group();
    strGroup.position.set(-14, 0.35, -4);

    // Tall precast concrete warehouse shell
    const strBody = new THREE.Mesh(new THREE.BoxGeometry(11.6, 6.2, 8.6), concreteMat);
    strBody.position.y = 3.1;
    strBody.castShadow = true;
    strBody.receiveShadow = true;
    strGroup.add(strBody);

    // Vertical concrete pilaster columns along front & side walls (matching reference photo!)
    for (let px = -5.4; px <= 5.4; px += 1.8) {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.32, 6.2, 0.35), darkConcreteMat);
      pilaster.position.set(px, 3.1, 4.35);
      pilaster.castShadow = true;
      strGroup.add(pilaster);
    }

    // Signature Safety-Orange Roof Fascia Trim + Low-Pitch Roof (matching reference photo!)
    const orangeTrim = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.45, 9.0), safetyOrangeMat);
    orangeTrim.position.y = 6.35;
    strGroup.add(orangeTrim);

    const strRoof = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.3, 8.8), steelMat);
    strRoof.position.y = 6.7;
    strGroup.add(strRoof);

    scene.add(strGroup);
    meshes.set('unit-str', strGroup);

    // H. DSP-701: Weighbridge & TSDF Dispatch Bay + Red Guard Cabin + Concrete Ramps (Matching Photo Far-Right!)
    const dspGroup = new THREE.Group();
    dspGroup.position.set(-23.5, 0.35, -4);

    // Concrete weighbridge deck + sloped approach ramps
    const scaleDeck = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.45, 4.0), concreteMat);
    scaleDeck.position.y = 0.22;
    scaleDeck.receiveShadow = true;
    dspGroup.add(scaleDeck);
    [-5.5, 5.5].forEach(rx => {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 4.0), concreteMat);
      ramp.position.set(rx, 0.08, 0);
      ramp.rotation.z = rx < 0 ? 0.14 : -0.14;
      dspGroup.add(ramp);
    });

    const steelPlate = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.08, 3.2), steelMat);
    steelPlate.position.y = 0.47;
    dspGroup.add(steelPlate);

    // Red Guard Cabin next to weighbridge (matching photo!)
    const redCabinMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45, metalness: 0.25 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.5, 2.4), redCabinMat);
    cabin.position.set(0, 1.25, -3.8);
    cabin.castShadow = true;
    dspGroup.add(cabin);
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.22, 2.8), steelMat);
    cabinRoof.position.set(0, 2.6, -3.8);
    dspGroup.add(cabinRoof);
    const cabinWin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 0.12), glassMat);
    cabinWin.position.set(0, 1.65, -2.58);
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

    // Realistic Overcast Industrial Sky Dome (matching real-world photo!)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 16;
    skyCanvas.height = 256;
    const sCtx = skyCanvas.getContext('2d')!;
    const grad = sCtx.createLinearGradient(0, 0, 0, 256);
    if (isNightMode) {
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.55, '#0f172a');
      grad.addColorStop(1, '#1e293b');
    } else {
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.45, '#cbd5e1');
      grad.addColorStop(0.82, '#e2e8f0');
      grad.addColorStop(1, '#cbd5e1');
    }
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 16, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(160, 28, 20),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    scene.add(skyDome);

    // Tall Utility Power Transmission Poles in Background (from photo!)
    [[-34, -22], [-18, -24], [2, -24], [22, -22]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 15, 8), steelMat);
      pole.position.set(px, 7.5, pz);
      scene.add(pole);
      [12.5, 14.0].forEach(cy => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 0.16), steelMat);
        arm.position.set(px, cy, pz);
        scene.add(arm);
      });
    });

    // MCC Electrical Control Room & Transformer Skid (Real Power-Plant Realism)
    const mccGroup = new THREE.Group();
    mccGroup.position.set(16.5, 0.35, 2.0);
    const mccRoom = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.6, 7.0), claddingMat);
    mccRoom.position.y = 1.8;
    mccRoom.castShadow = true;
    mccRoom.receiveShadow = true;
    mccGroup.add(mccRoom);
    const mccRoof = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.3, 7.4), darkConcreteMat);
    mccRoof.position.y = 3.7;
    mccGroup.add(mccRoof);
    const mccDoor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 1.2), steelMat);
    mccDoor.position.set(-2.78, 1.1, 1.5);
    mccGroup.add(mccDoor);
    // Transformer with cooling fins & bushings
    const xfmr = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 }));
    xfmr.position.set(0, 1.1, 5.2);
    xfmr.castShadow = true;
    mccGroup.add(xfmr);
    [-0.5, 0, 0.5].forEach(bz => {
      const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.3 }));
      bushing.position.set(0, 2.55, 5.2 + bz);
      mccGroup.add(bushing);
    });
    scene.add(mccGroup);

    // Overhead Steel Pipe Bridge Truss (North Line <-> South Line)
    const trussGroup = new THREE.Group();
    const trussSpan = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 12.0), steelMat);
    trussSpan.position.set(2.2, 5.8, 2.0);
    trussSpan.castShadow = true;
    trussGroup.add(trussSpan);
    [-3.5, 7.5].forEach(tz => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.8, 0.3), steelMat);
      leg.position.set(2.2, 2.9, tz);
      leg.castShadow = true;
      trussGroup.add(leg);
    });
    scene.add(trussGroup);

    // Steel Access Ladders on Tanks (EQ-101, CLR-301, THK-401)
    const addLadder = (lx: number, ly: number, lz: number, height: number) => {
      [-0.25, 0.25].forEach(ox => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height, 6), safetyYellowMat);
        rail.position.set(lx + ox, ly + height / 2, lz);
        scene.add(rail);
      });
      for (let r = 0.4; r < height; r += 0.45) {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), safetyYellowMat);
        rung.rotation.z = Math.PI / 2;
        rung.position.set(lx, ly + r, lz);
        scene.add(rung);
      }
    };
    addLadder(-16, 0.35, 12.4, 4.3);   // EQ-101 ladder
    addLadder(6.5, 0.35, 14.35, 3.7);  // CLR-301 ladder
    addLadder(6.5, 0.35, -8.15, 4.1);  // THK-401 ladder

    // Safety Bollards along Road & Weighbridge
    for (let bx = -28; bx <= 10; bx += 4.5) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10), safetyYellowMat);
      bollard.position.set(bx, 0.8, -8.8);
      bollard.castShadow = true;
      scene.add(bollard);
    }

    // Perimeter Steel Boundary Fence Posts
    const fenceCoords: [number, number][] = [];
    for (let x = -36; x <= 26; x += 6) {
      fenceCoords.push([x, 19.5], [x, -16.5]);
    }
    for (let z = -16.5; z <= 19.5; z += 6) {
      fenceCoords.push([-36, z], [26, z]);
    }
    fenceCoords.forEach(([fx, fz]) => {
      const fPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), steelMat);
      fPost.position.set(fx, 1.1, fz);
      scene.add(fPost);
    });

    // Twin Chemical / Lime Storage Silos with Conical Hoppers (Next to FM-201)
    [-9.5, -6.5].forEach(sx => {
      const siloGroup = new THREE.Group();
      siloGroup.position.set(sx, 0.35, 14.2);
      const siloBody = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 4.6, 20), claddingMat);
      siloBody.position.y = 3.5;
      siloBody.castShadow = true;
      siloGroup.add(siloBody);
      const siloCone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 20), steelMat);
      siloCone.rotation.x = Math.PI;
      siloCone.position.y = 0.7;
      siloGroup.add(siloCone);
      const siloCap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.6, 20), steelMat);
      siloCap.position.y = 6.1;
      siloGroup.add(siloCap);
      [-0.85, 0.85].forEach(lx => {
        [-0.85, 0.85].forEach(lz => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6), steelMat);
          leg.position.set(lx, 0.7, lz);
          siloGroup.add(leg);
        });
      });
      scene.add(siloGroup);
    });

    // Natural Campus Trees outside Perimeter Fence
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: isNightMode ? 0x14331d : 0x2e5a36, roughness: 0.85 });
    [
      [-39, 16], [-39, 4], [-39, -12], [29, 14], [29, -2], [29, -15], [10, 22], [-12, 22],
    ].forEach(([tx, tz]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 2.0, 8), trunkMat);
      trunk.position.set(tx, 1.0, tz);
      trunk.castShadow = true;
      scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), leafMat);
      crown.position.set(tx, 2.9, tz);
      crown.castShadow = true;
      scene.add(crown);
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

    // 7. 360° Smooth OrbitControls & Raycasting Interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(-1.5, 2.8, 0.5);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.minDistance = 10;
    controls.maxDistance = 95;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.autoRotate = isAutoRotate;
    controls.autoRotateSpeed = 1.6;
    controls.update();
    controlsRef.current = controls;

    // Raycast to click units (walk up parent chain so child meshes select their parent unit)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onClick = (e: MouseEvent) => {
      // Ignore drags so orbiting doesn't accidentally switch selected unit
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;

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
    dom.addEventListener('pointerdown', onPointerDown);
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
      controls.update();

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
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      controlsRef.current = null;
      envRT.dispose();
      if (container.contains(dom)) container.removeChild(dom);
      renderer.dispose();
    };
  }, [isNightMode, isWireframe]);

  // Sync 360° auto-orbit toggle without rebuilding the WebGL scene
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotate;
    }
  }, [isAutoRotate]);

  // Viewport Presets
  const handleSelectPreset = (preset: string) => {
    setActivePreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    switch (preset) {
      case 'overview':
        camera.position.set(1.5, 10.0, 23.5);
        controls.target.set(-1.5, 2.8, 0.5);
        break;
      case 'reaction':
        camera.position.set(-8, 10, 19);
        controls.target.set(-8, 2, 8);
        setSelectedUnit(PLANT_UNITS[1]); // Flash Mix
        break;
      case 'clarifier':
        camera.position.set(17, 12, 17);
        controls.target.set(6.5, 2.5, 8);
        setSelectedUnit(PLANT_UNITS[3]); // Clarifier
        break;
      case 'dewatering':
        camera.position.set(7, 12, 8);
        controls.target.set(-2, 3, -4);
        setSelectedUnit(PLANT_UNITS[5]); // Press Building
        break;
      case 'storage':
        camera.position.set(-20, 10, 9);
        controls.target.set(-14, 2.5, -4);
        setSelectedUnit(PLANT_UNITS[6]); // Storage Shed
        break;
      case 'dispatch':
        camera.position.set(-32, 8, 5);
        controls.target.set(-23.5, 1.5, -4);
        setSelectedUnit(PLANT_UNITS[7]); // Weighbridge
        break;
    }
    controls.update();
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
            <span>360° Auto-Orbit</span>
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
            className="w-full h-[600px] relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950"
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
