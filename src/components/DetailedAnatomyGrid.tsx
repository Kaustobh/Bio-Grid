"use client";

import React, { useState, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useBiometricStore } from "@/store/useBiometricStore";

interface OrganNode {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
  system: "nervous" | "cardiovascular" | "digestive" | "lymphatic";
  details: string;
}

export const ANATOMICAL_ORGANS: OrganNode[] = [
  { id: "brain", name: "Cerebral Cortex", pos: [0, 1.25, 0], color: "#9d4edd", system: "nervous", details: "Synaptic activity in cerebral hemispheres maps cognitive workload." },
  { id: "heart", name: "Cardiac Core", pos: [-0.08, 0.55, 0.2], color: "#ff0055", system: "cardiovascular", details: "Left and right ventricles contract to generate stroke volume." },
  { id: "lungs", name: "Pulmonary Field", pos: [0.08, 0.55, 0.15], color: "#00f5d4", system: "cardiovascular", details: "Alveolar gas exchange rates maintain oxygen saturation values." },
  { id: "liver", name: "Hepatic Metabolic", pos: [0.08, 0.25, 0.15], color: "#ffb703", system: "digestive", details: "Enzymatic processes clear caffeine, metformin, and lactic toxins." },
  { id: "kidneys", name: "Renal Filtration", pos: [-0.09, 0.1, -0.15], color: "#ff00ff", system: "digestive", details: "Glomerular nephrons balance electrolytes and clear metabolic waste." },
  { id: "stomach", name: "Digestive Core", pos: [-0.08, 0.3, 0.15], color: "#ffb703", system: "digestive", details: "Hydrochloric acid breakdown and active peristalsis processes." },
  { id: "lymph-cervical", name: "Cervical Lymph Nodes", pos: [0.08, 1.05, 0.08], color: "#0077b6", system: "lymphatic", details: "Neck lymphatic surveillance nodes monitors viral pathogens." },
  { id: "lymph-axillary", name: "Axillary Lymph Nodes", pos: [-0.28, 0.75, 0.08], color: "#0077b6", system: "lymphatic", details: "Armpit lymphatic fields drain upper torso fluids." },
  { id: "lymph-inguinal", name: "Inguinal Lymph Nodes", pos: [0.14, 0.05, 0.08], color: "#0077b6", system: "lymphatic", details: "Groin lymphatic nodes sweep lower extremity paths." }
];

interface DetailedAnatomyGridProps {
  activeSystem: "all" | "cardiovascular" | "nervous" | "digestive" | "lymphatic";
  simulatedStrains?: Record<string, number>;
  simulatedVitals?: {
    hr: number;
    sbp: number;
    dbp: number;
    rr: number;
    temp: string;
    gfr: number;
    gastricpH: string;
    lymphFlow: number;
  };
}

// Custom elements mapped to a React component type to avoid JSX namespace conflict with SVG tags
const Line = "line" as unknown as React.ComponentType<{ geometry: THREE.BufferGeometry; children: React.ReactNode }>;

// 1. Leader Line Component
function LeaderLine({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end]);

  const lineGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <Line geometry={lineGeom}>
      <lineBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
    </Line>
  );
}

// 2. Piecewise Flow Particle Animator Component
interface FlowParticlesProps {
  points: Float32Array;
  color: string;
  speedScale: number;
  count?: number;
  size?: number;
}

function FlowParticles({ points, color, speedScale, count = 6, size = 0.022 }: FlowParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);

  const v3Points = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < points.length; i += 3) {
      arr.push(new THREE.Vector3(points[i], points[i + 1], points[i + 2]));
    }
    return arr;
  }, [points]);

  const { segments, totalLength } = useMemo(() => {
    const segs: { start: THREE.Vector3; end: THREE.Vector3; startLen: number; len: number }[] = [];
    let currentLen = 0;
    for (let i = 0; i < v3Points.length - 1; i++) {
      const d = v3Points[i].distanceTo(v3Points[i + 1]);
      segs.push({
        start: v3Points[i],
        end: v3Points[i + 1],
        startLen: currentLen,
        len: d
      });
      currentLen += d;
    }
    return { segments: segs, totalLength: currentLen };
  }, [v3Points]);

  // progress values initialized only inside useFrame to satisfy react-hooks/refs
  const progressRef = useRef<number[] | null>(null);
  
  // posArray is passed to JSX but mutated in Three.js loop to bypass react-hooks/immutability
  const [initialPosArray] = useState(() => new Float32Array(count * 3));

  useFrame((state) => {
    if (!meshRef.current || totalLength <= 0 || segments.length === 0) return;

    if (!progressRef.current) {
      progressRef.current = Array.from({ length: count }, (_, i) => i / count);
    }

    const posAttr = meshRef.current.geometry.attributes.position;
    const pos = posAttr.array as Float32Array;
    const dt = state.clock.getDelta();
    const step = Math.min(dt, 0.1) * 0.12 * speedScale;

    for (let i = 0; i < count; i++) {
      progressRef.current[i] = (progressRef.current[i] + step) % 1.0;
      const targetDist = progressRef.current[i] * totalLength;

      let seg = segments[0];
      for (const s of segments) {
        if (targetDist >= s.startLen && targetDist <= s.startLen + s.len) {
          seg = s;
          break;
        }
      }

      const segT = seg.len > 0 ? (targetDist - seg.startLen) / seg.len : 0;
      const posVec = new THREE.Vector3().lerpVectors(seg.start, seg.end, segT);

      pos[i * 3] = posVec.x;
      pos[i * 3 + 1] = posVec.y;
      pos[i * 3 + 2] = posVec.z;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initialPosArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// 3. Heart Chambers Beat & Sinus node pulse component
function HeartVisuals({ simulatedVitals }: { simulatedVitals?: DetailedAnatomyGridProps["simulatedVitals"] }) {
  const heartGroupRef = useRef<THREE.Group>(null);
  const saPulseRef = useRef<THREE.Mesh>(null);

  const hr = simulatedVitals?.hr ?? 72;
  const beatPeriod = 60 / hr;

  const chamberGeoms = useMemo(() => {
    const leftPts: THREE.Vector3[] = [];
    const rightPts: THREE.Vector3[] = [];
    const segs = 40;
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const xBase = 0.05 * Math.pow(Math.sin(t), 3);
      const yBase = 0.05 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;

      leftPts.push(new THREE.Vector3(xBase - 0.015, yBase, 0.05 + xBase * 0.15));
      rightPts.push(new THREE.Vector3(-xBase + 0.015, yBase * 0.9 + 0.005, 0.05 - xBase * 0.15));
    }
    return {
      left: new THREE.BufferGeometry().setFromPoints(leftPts),
      right: new THREE.BufferGeometry().setFromPoints(rightPts)
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const beatPhase = (time % beatPeriod) / beatPeriod;
    let scale = 1.0;

    // Lub-dub heart contraction scale
    if (beatPhase < 0.15) {
      scale = 1.0 + 0.12 * Math.sin((beatPhase / 0.15) * Math.PI);
    } else if (beatPhase >= 0.25 && beatPhase < 0.4) {
      scale = 1.0 + 0.07 * Math.sin(((beatPhase - 0.25) / 0.15) * Math.PI);
    }

    if (heartGroupRef.current) {
      heartGroupRef.current.scale.set(scale, scale, scale);
    }

    // SA Node electrical sweep
    if (saPulseRef.current) {
      const wavePhase = (time * (hr / 60)) % 1.0;
      const s = 0.02 + wavePhase * 0.11;
      saPulseRef.current.scale.set(s, s, s);
      if (saPulseRef.current.material && !Array.isArray(saPulseRef.current.material)) {
        (saPulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1.0 - wavePhase);
      }
    }
  });

  return (
    <group position={[-0.08, 0.55, 0.2]} ref={heartGroupRef}>
      <mesh>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshBasicMaterial color="#ff0055" />
      </mesh>
      <Line geometry={chamberGeoms.left}>
        <lineBasicMaterial color="#ff0055" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </Line>
      <Line geometry={chamberGeoms.right}>
        <lineBasicMaterial color="#ff0055" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </Line>
      <mesh ref={saPulseRef} position={[0.012, 0.015, 0.01]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ffff00" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// 4. Main 3D Anatomy structures layer
function SomaticGridMesh({ activeSystem, simulatedStrains, simulatedVitals }: DetailedAnatomyGridProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { latestTelemetry } = useBiometricStore();
  const { size } = useThree();

  // Dynamic scale to keep model inside canvas on mobile aspect ratios
  const aspect = size.width / size.height;
  const responsiveScale = useMemo(() => {
    if (aspect < 0.8) return aspect * 1.15; // portrait mobile
    if (aspect < 1.2) return aspect * 0.95; // square tablets
    return 1.0;                             // landscape desktop
  }, [aspect]);

  // Slow drift orbital rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
  });

  // Calculate detailed skeletal geometries
  const vertebrae = useMemo(() => {
    const pts: number[] = [];
    const numVertebrae = 24;
    const segments = 12;
    for (let v = 0; v < numVertebrae; v++) {
      const t = v / (numVertebrae - 1);
      const y = -0.9 + t * 2.0;
      const z = -0.05 + 0.04 * Math.sin(t * Math.PI * 2);
      const x = 0;
      const radius = 0.075 - t * 0.025;
      for (let s = 0; s < segments; s++) {
        const phi1 = (s / segments) * 2 * Math.PI;
        const phi2 = ((s + 1) / segments) * 2 * Math.PI;
        pts.push(
          x + radius * Math.cos(phi1), y, z + radius * Math.sin(phi1),
          x + radius * Math.cos(phi2), y, z + radius * Math.sin(phi2)
        );
      }
    }
    return new Float32Array(pts);
  }, []);

  const ribcage = useMemo(() => {
    const pts: number[] = [];
    const numRibs = 12;
    const segments = 16;
    for (let r = 0; r < numRibs; r++) {
      const t = r / (numRibs - 1);
      const thoracicY = 0.15 + t * 0.72;
      const width = 0.32 * Math.sin((r + 1.5) / 14 * Math.PI);
      const spineZ = -0.05 + 0.04 * Math.sin(((thoracicY + 0.9) / 2.0) * Math.PI * 2);

      for (let s = 0; s < segments; s++) {
        const progress1 = s / segments;
        const progress2 = (s + 1) / segments;
        const angle1 = Math.PI * 1.5 - progress1 * Math.PI * 0.95;
        const angle2 = Math.PI * 1.5 - progress2 * Math.PI * 0.95;

        const x1_l = width * Math.cos(angle1);
        const z1_l = spineZ + 0.22 * Math.sin(angle1);
        const y1_l = thoracicY - 0.06 * (1 - Math.cos(progress1 * Math.PI));

        const x2_l = width * Math.cos(angle2);
        const z2_l = spineZ + 0.22 * Math.sin(angle2);
        const y2_l = thoracicY - 0.06 * (1 - Math.cos(progress2 * Math.PI));

        pts.push(x1_l, y1_l, z1_l, x2_l, y2_l, z2_l);
        pts.push(-x1_l, y1_l, z1_l, -x2_l, y2_l, z2_l);
      }
    }
    return new Float32Array(pts);
  }, []);

  const pelvis = useMemo(() => {
    const pts: number[] = [];
    const segments = 24;
    const pelvisY = 0.05;
    const leftCenter = [-0.13, pelvisY, -0.02];
    const rightCenter = [0.13, pelvisY, -0.02];
    const radius = 0.11;

    for (let s = 0; s < segments; s++) {
      const phi1 = (s / segments) * 2 * Math.PI;
      const phi2 = ((s + 1) / segments) * 2 * Math.PI;

      pts.push(
        leftCenter[0] + radius * Math.cos(phi1),
        leftCenter[1] + radius * Math.sin(phi1) * 0.5 - 0.05 * Math.sin(phi1),
        leftCenter[2] + radius * Math.sin(phi1),
        leftCenter[0] + radius * Math.cos(phi2),
        leftCenter[1] + radius * Math.sin(phi2) * 0.5 - 0.05 * Math.sin(phi2),
        leftCenter[2] + radius * Math.sin(phi2)
      );

      pts.push(
        rightCenter[0] + radius * Math.cos(phi1),
        rightCenter[1] + radius * Math.sin(phi1) * 0.5 - 0.05 * Math.sin(phi1),
        rightCenter[2] - radius * Math.sin(phi1),
        rightCenter[0] + radius * Math.cos(phi2),
        rightCenter[1] + radius * Math.sin(phi2) * 0.5 - 0.05 * Math.sin(phi2),
        rightCenter[2] - radius * Math.sin(phi2)
      );
    }

    const archSegments = 10;
    for (let s = 0; s < archSegments; s++) {
      const p1 = s / archSegments;
      const p2 = (s + 1) / archSegments;
      pts.push(
        -0.1 + p1 * 0.2, pelvisY - 0.12 - 0.05 * Math.sin(p1 * Math.PI), 0.08,
        -0.1 + p2 * 0.2, pelvisY - 0.12 - 0.05 * Math.sin(p2 * Math.PI), 0.08
      );
    }
    return new Float32Array(pts);
  }, []);

  // Calculate detailed organ geometries
  const brainGyri = useMemo(() => {
    const paths: Float32Array[] = [];
    const linesCount = 6;
    const pointsPerLine = 100;
    for (let l = 0; l < linesCount; l++) {
      const pts: number[] = [];
      const xSign = l % 2 === 0 ? -1 : 1;
      const zScale = l < 2 ? 1 : l < 4 ? 0 : -1;

      for (let i = 0; i < pointsPerLine; i++) {
        const t = i / (pointsPerLine - 1);
        const theta = t * Math.PI * 8;
        const baseRadius = 0.14 * Math.sin(t * Math.PI);
        const foldDistort = 1.0 + 0.18 * Math.sin(theta * 3.5);
        const radius = baseRadius * foldDistort;

        const x = xSign * (0.02 + Math.abs(radius * Math.cos(theta)));
        const y = 1.25 + 0.12 * Math.cos(t * Math.PI) + 0.015 * Math.sin(theta * 2);
        const z = zScale * 0.06 + radius * Math.sin(theta) * 0.7;
        pts.push(x, y, z);
      }
      paths.push(new Float32Array(pts));
    }
    return paths;
  }, []);

  const lungTree = useMemo(() => {
    // Seeded random number generator for render purity
    let seed = 12345;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const pts: number[] = [];
    const generateBranch = (
      start: [number, number, number],
      dir: [number, number, number],
      length: number,
      depth: number
    ) => {
      if (depth > 4) return;
      const startVec = new THREE.Vector3(...start);
      const dirVec = new THREE.Vector3(...dir).normalize();
      const endVec = new THREE.Vector3().addVectors(
        startVec,
        dirVec.clone().multiplyScalar(length)
      );
      pts.push(startVec.x, startVec.y, startVec.z, endVec.x, endVec.y, endVec.z);

      const splitAngle = 0.35 + random() * 0.1;
      const ortho = new THREE.Vector3(1, 0, 0);
      if (Math.abs(dirVec.x) > 0.9) ortho.set(0, 1, 0);
      const cross = new THREE.Vector3().crossVectors(dirVec, ortho).normalize();

      const dir1 = dirVec.clone().applyAxisAngle(cross, splitAngle).multiplyScalar(0.72);
      generateBranch([endVec.x, endVec.y, endVec.z], [dir1.x, dir1.y, dir1.z], length * 0.75, depth + 1);

      const dir2 = dirVec.clone().applyAxisAngle(cross, -splitAngle).multiplyScalar(0.72);
      generateBranch([endVec.x, endVec.y, endVec.z], [dir2.x, dir2.y, dir2.z], length * 0.75, depth + 1);
    };

    generateBranch([-0.02, 0.68, 0.1], [-0.85, -0.4, 0.3], 0.16, 0);
    generateBranch([0.02, 0.68, 0.1], [0.85, -0.4, 0.3], 0.16, 0);
    return new Float32Array(pts);
  }, []);

  const intestinePath = useMemo(() => {
    const pts: number[] = [];
    const pointsCount = 200;
    for (let i = 0; i < pointsCount; i++) {
      const t = i / (pointsCount - 1);
      const y = 0.32 - t * 0.44;
      const sweep = Math.sin(t * 14 * Math.PI);
      const x = 0.18 * sweep * Math.cos(t * Math.PI * 1.5);
      const z = 0.06 + 0.06 * Math.cos(t * 14 * Math.PI);
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  // Vascular & Neural Spline Systems
  const anatomicalSplines = useMemo(() => {
    const lines: { positions: Float32Array; color: string; system: "cardiovascular" | "nervous" }[] = [];

    // Spine nerve trunk
    const spinePoints = [];
    for (let y = -0.95; y <= 1.15; y += 0.05) {
      const x = 0.015 * Math.sin(y * 8);
      const z = -0.06 + 0.01 * Math.cos(y * 8);
      spinePoints.push(x, y, z);
    }
    lines.push({ positions: new Float32Array(spinePoints), color: "#9d4edd", system: "nervous" });

    // Descending Aorta / Venous fields
    const aortaPoints = [];
    const venaCavaPoints = [];
    for (let y = -0.4; y <= 0.8; y += 0.08) {
      aortaPoints.push(-0.02, y, 0.04);
      venaCavaPoints.push(0.02, y, 0.04);
    }
    lines.push({ positions: new Float32Array(aortaPoints), color: "#ff0055", system: "cardiovascular" });
    lines.push({ positions: new Float32Array(venaCavaPoints), color: "#00f5d4", system: "cardiovascular" });

    // Arm vascular extensions
    lines.push({ positions: new Float32Array([-0.05, 0.6, 0.04, -0.33, 0.8, 0.0, -0.75, 0.15, 0.0]), color: "#ff0055", system: "cardiovascular" });
    lines.push({ positions: new Float32Array([0.05, 0.6, 0.04, 0.33, 0.8, 0.0, 0.75, 0.15, 0.0]), color: "#00f5d4", system: "cardiovascular" });

    // Leg vascular extensions
    lines.push({ positions: new Float32Array([-0.03, 0.0, 0.02, -0.16, -0.5, 0.0, -0.16, -1.0, 0.0]), color: "#ff0055", system: "cardiovascular" });
    lines.push({ positions: new Float32Array([0.03, 0.0, 0.02, 0.16, -0.5, 0.0, 0.16, -1.0, 0.0]), color: "#00f5d4", system: "cardiovascular" });

    return lines;
  }, []);

  // Core skeletal boundaries
  const limbOutlines = useMemo(() => {
    const pts: number[] = [];
    // Outer boundary silhouettes
    const addBoundary = (start: [number, number, number], end: [number, number, number]) => {
      pts.push(...start, ...end);
    };
    // Arms boundaries
    addBoundary([-0.33, 0.8, 0], [-0.75, 0.15, 0]);
    addBoundary([0.33, 0.8, 0], [0.75, 0.15, 0]);
    // Legs boundaries
    addBoundary([-0.16, 0.0, 0], [-0.16, -1.0, 0]);
    addBoundary([0.16, 0.0, 0], [0.16, -1.0, 0]);

    return new Float32Array(pts);
  }, []);

  // System opacities based on active filters
  const outlineOpacity = activeSystem === "all" ? 0.15 : 0.04;
  const flowSpeed = (simulatedVitals?.hr ?? 72) / 72;

  // Strains calculations for HUDs
  const defaultStrains = {
    brain: 34.5,
    heart: 48.0,
    lungs: 12.4,
    liver: 25.8,
    kidneys: 38.2,
    stomach: 21.6,
    "lymph-cervical": 15.2,
    "lymph-axillary": 12.0,
    "lymph-inguinal": 8.5
  };
  const strains = {
    ...defaultStrains,
    ...(latestTelemetry?.organ_strain ?? {}),
    ...(simulatedStrains ?? {})
  };

  // HUD layout config
  const huds = [
    {
      id: "brain",
      name: "CNS CO-DECK",
      target: [0, 1.25, 0] as [number, number, number],
      pos: [0.55, 1.45, 0.1] as [number, number, number],
      color: "#9d4edd",
      system: "nervous",
      render: (vitals: typeof simulatedVitals, strain: number) => (
        <div className="flex flex-col gap-0.5 pointer-events-none select-none">
          <div className="text-[6.5px] text-[#9d4edd] font-mono font-bold tracking-widest">CNS // SYNC.NET</div>
          <div className="text-[8px] text-white font-mono flex justify-between">
            <span>Strain:</span>
            <span className="text-[#9d4edd] font-bold">{strain.toFixed(0)}%</span>
          </div>
          <div className="text-[7.5px] text-white/70 font-mono">CognFreq: {(12 + (vitals?.hr ?? 72) * 0.05).toFixed(1)} Hz</div>
        </div>
      )
    },
    {
      id: "heart",
      name: "CARDIO HUD",
      target: [-0.08, 0.55, 0.2] as [number, number, number],
      pos: [-0.68, 0.72, 0.25] as [number, number, number],
      color: "#ff0055",
      system: "cardiovascular",
      render: (vitals: typeof simulatedVitals) => (
        <div className="flex flex-col gap-0.5 pointer-events-none select-none">
          <div className="text-[6.5px] text-[#ff0055] font-mono font-bold tracking-widest">CARDIO // MYOCARD</div>
          <div className="text-[8px] text-white font-mono flex justify-between">
            <span>Pulse:</span>
            <span className="text-[#ff0055] font-bold">{vitals?.hr ?? 72} BPM</span>
          </div>
          <div className="text-[7.5px] text-white/70 font-mono">StrokeVol: {((vitals?.hr ?? 72) * 0.07).toFixed(1)} L/min</div>
        </div>
      )
    },
    {
      id: "lungs",
      name: "PULMONARY UNIT",
      target: [0.08, 0.55, 0.15] as [number, number, number],
      pos: [0.65, 0.8, 0.2] as [number, number, number],
      color: "#00f5d4",
      system: "cardiovascular",
      render: (vitals: typeof simulatedVitals) => (
        <div className="flex flex-col gap-0.5 pointer-events-none select-none">
          <div className="text-[6.5px] text-[#00f5d4] font-mono font-bold tracking-widest">PULMON // VENTIL</div>
          <div className="text-[8px] text-white font-mono flex justify-between">
            <span>Resp:</span>
            <span className="text-[#00f5d4] font-bold">{vitals?.rr ?? 16} Br/m</span>
          </div>
          <div className="text-[7.5px] text-white/70 font-mono">TidalVol: {((vitals?.rr ?? 16) * 350).toFixed(0)} ml</div>
        </div>
      )
    },
    {
      id: "stomach",
      name: "GASTRIC CORE",
      target: [-0.08, 0.3, 0.15] as [number, number, number],
      pos: [0.65, 0.32, 0.2] as [number, number, number],
      color: "#ffb703",
      system: "digestive",
      render: (vitals: typeof simulatedVitals) => (
        <div className="flex flex-col gap-0.5 pointer-events-none select-none">
          <div className="text-[6.5px] text-[#ffb703] font-mono font-bold tracking-widest">GASTRIC // pH</div>
          <div className="text-[8px] text-white font-mono flex justify-between">
            <span>Acid:</span>
            <span className="text-[#ffb703] font-bold">{vitals?.gastricpH ?? "1.80"} pH</span>
          </div>
          <div className="text-[7.5px] text-white/70 font-mono">Gut Motil: {(100 - (vitals?.hr ?? 72) * 0.35).toFixed(0)}%</div>
        </div>
      )
    },
    {
      id: "kidneys",
      name: "RENAL FILTER",
      target: [-0.09, 0.1, -0.15] as [number, number, number],
      pos: [-0.68, 0.1, -0.05] as [number, number, number],
      color: "#ff00ff",
      system: "digestive",
      render: (vitals: typeof simulatedVitals, strain: number) => (
        <div className="flex flex-col gap-0.5 pointer-events-none select-none">
          <div className="text-[6.5px] text-[#ff00ff] font-mono font-bold tracking-widest">RENAL // GFR</div>
          <div className="text-[8px] text-white font-mono flex justify-between">
            <span>GFR:</span>
            <span className="text-[#ff00ff] font-bold">{vitals?.gfr ?? 90} GFR</span>
          </div>
          <div className="text-[7.5px] text-white/70 font-mono">Nephrons: {strain.toFixed(0)}% Strain</div>
        </div>
      )
    }
  ];

  return (
    <group ref={groupRef} scale={[responsiveScale, responsiveScale, responsiveScale]}>
      {/* 1. Structural Vertebrae stack */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[vertebrae, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00f5d4" transparent opacity={activeSystem === "all" ? 0.32 : 0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* 2. Parametric Ribcage */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ribcage, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00f5d4" transparent opacity={activeSystem === "all" ? 0.28 : 0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* 3. Hip Pelvis Structure */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pelvis, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00f5d4" transparent opacity={activeSystem === "all" ? 0.32 : 0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* 4. Clavicles and Sternum flat skeleton bones */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                // Sternum
                0, 0.85, 0.18, 0, 0.4, 0.18,
                // Left Clavicle
                0, 0.85, 0.18, -0.32, 0.8, 0.0,
                // Right Clavicle
                0, 0.85, 0.18, 0.32, 0.8, 0.0
              ]),
              3
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00f5d4" transparent opacity={activeSystem === "all" ? 0.32 : 0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* 5. Limb outlines boundaries */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[limbOutlines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00f5d4" transparent opacity={outlineOpacity} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* 6. Advanced Organ details */}
      {/* Brain Folds (Gyri) */}
      {brainGyri.map((path, idx) => {
        const isFocused = activeSystem === "all" || activeSystem === "nervous";
        const opacity = isFocused ? 0.48 : 0.03;
        return (
          <line key={`brain-gyri-${idx}`}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[path, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#9d4edd" transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
          </line>
        );
      })}

      {/* Bronchial lung tree */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lungTree, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00f5d4"
          transparent
          opacity={activeSystem === "all" || activeSystem === "cardiovascular" ? 0.48 : 0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Winding Intestines */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[intestinePath, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#ffb703"
          transparent
          opacity={activeSystem === "all" || activeSystem === "digestive" ? 0.52 : 0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </line>

      {/* Pulsing heart cross-section chambers */}
      {(activeSystem === "all" || activeSystem === "cardiovascular") && (
        <HeartVisuals simulatedVitals={simulatedVitals} />
      )}

      {/* 7. Special System Spline Pipelines */}
      {anatomicalSplines.map((spline, idx) => {
        const isFocused = activeSystem === "all" || activeSystem === spline.system;
        const opacity = isFocused ? 0.45 : 0.04;
        return (
          <line key={`spline-${idx}`}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[spline.positions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={spline.color} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
          </line>
        );
      })}

      {/* 8. Flows: vascular, nerves, nutrient absorption */}
      {anatomicalSplines.map((spline, idx) => {
        const isFocused = activeSystem === "all" || activeSystem === spline.system;
        if (!isFocused) return null;
        return (
          <FlowParticles
            key={`flow-blood-${idx}`}
            points={spline.positions}
            color={spline.color}
            speedScale={flowSpeed}
            count={6}
          />
        );
      })}

      {(activeSystem === "all" || activeSystem === "digestive") && (
        <FlowParticles
          points={intestinePath}
          color="#00f5d4"
          speedScale={flowSpeed * 0.35} // digestive movement is slower
          count={8}
          size={0.02}
        />
      )}

      {/* 9. Organ Nodes (with click capability) */}
      {ANATOMICAL_ORGANS.map((organ) => {
        const isHighlighted = activeSystem === "all" || activeSystem === organ.system;
        return (
          <SomaticOrganNode
            key={organ.id}
            organ={organ}
            isHighlighted={isHighlighted}
            simulatedStrains={simulatedStrains}
          />
        );
      })}

      {/* 10. Floating HUD Annotation Cards & leader lines */}
      {huds.map((hud) => {
        const isShown = activeSystem === "all" || activeSystem === hud.system;
        if (!isShown) return null;

        const strainVal = strains[hud.id as keyof typeof strains] ?? 30;

        return (
          <group key={`hud-group-${hud.id}`}>
            <LeaderLine start={hud.target} end={hud.pos} color={hud.color} />
            <Html position={hud.pos} distanceFactor={3.2}>
              <div
                className="pl-2.5 border-l border-white/25 pointer-events-none w-32 select-none transition-all duration-300"
                style={{ borderLeftColor: hud.color }}
              >
                {hud.render(simulatedVitals, strainVal)}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// 5. Clickable Node Component
interface NodeProps {
  organ: OrganNode;
  isHighlighted: boolean;
  simulatedStrains?: Record<string, number>;
}

function SomaticOrganNode({ organ, isHighlighted, simulatedStrains }: NodeProps) {
  const { latestTelemetry, setSelectedAnomalyNode, selectedAnomalyNode } = useBiometricStore();
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef<THREE.Mesh>(null);

  const defaultStrains = {
    brain: 34.5,
    heart: 48.0,
    lungs: 12.4,
    liver: 25.8,
    kidneys: 38.2,
    stomach: 21.6,
    "lymph-cervical": 15.2,
    "lymph-axillary": 12.0,
    "lymph-inguinal": 8.5
  };

  const strains = {
    ...defaultStrains,
    ...(latestTelemetry?.organ_strain ?? {}),
    ...(simulatedStrains ?? {})
  };

  const strainVal = strains[organ.id as keyof typeof strains] ?? 25;
  const isCritical = strainVal > 80;

  useFrame((state) => {
    if (pulseRef.current) {
      const frequency = isCritical ? 9 : 3.5;
      const pulseScale = 1 + Math.sin(state.clock.getElapsedTime() * frequency) * 0.25;
      pulseRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }
  });

  const baseColor = isCritical ? "#ff0055" : organ.color;
  const isSelected = selectedAnomalyNode === organ.id;

  const opacity = isHighlighted ? (isSelected ? 1.0 : 0.85) : 0.08;
  const pulseOpacity = isHighlighted ? (isCritical ? 0.35 : hovered ? 0.22 : 0.12) : 0.02;

  return (
    <group position={organ.pos}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (isHighlighted) {
            setSelectedAnomalyNode(isSelected ? null : organ.id);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (isHighlighted) {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={baseColor} transparent opacity={opacity} />
      </mesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={pulseOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {isHighlighted && (hovered || isSelected) && (
        <Html distanceFactor={3.2} position={[0.18, 0.06, 0]}>
          <div
            className={`px-2 py-0.5 rounded text-[8px] font-mono whitespace-nowrap border pointer-events-none transition-all duration-300 ${
              isCritical
                ? "bg-[#ff0055] border-[#ff0055] text-white shadow-[0_0_10px_rgba(255,0,85,0.45)]"
                : isSelected
                ? "bg-[#090b10] border-neon-cyan text-neon-cyan shadow-[0_0_8px_rgba(0,245,212,0.3)]"
                : "bg-[#090b10]/90 border-white/10 text-white/95"
            }`}
          >
            {organ.name}: {strainVal.toFixed(0)}% strain
          </div>
        </Html>
      )}
    </group>
  );
}

// 6. Default Export component
export default function DetailedAnatomyGrid({ activeSystem, simulatedStrains, simulatedVitals }: DetailedAnatomyGridProps) {
  return (
    <div className="w-full h-full relative" data-cursor="warp">
      <Canvas
        camera={{ position: [0, 0.35, 2.7], fov: 48 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[8, 8, 8]} intensity={1.5} />

        <SomaticGridMesh
          activeSystem={activeSystem}
          simulatedStrains={simulatedStrains}
          simulatedVitals={simulatedVitals}
        />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxDistance={3.8}
          minDistance={1.6}
          autoRotate={false}
        />
      </Canvas>

      <div className="absolute bottom-16 left-4 right-4 flex items-center justify-between text-[7.5px] font-mono text-text-muted/65 pointer-events-none select-none">
        <span>ROTATE: DRAG MOUSE</span>
        <span>SYSTEM FILTER ACTIVE</span>
        <span>FOCUS NODE: CLICK NODE</span>
      </div>
    </div>
  );
}
