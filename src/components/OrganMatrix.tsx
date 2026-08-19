"use client";

import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useBiometricStore } from "@/store/useBiometricStore";
import { Brain, Heart, Wind, Activity, ArrowLeft } from "lucide-react";
import { playHUDSound } from "@/utils/audio";

interface OrganNode {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const ORGANS: OrganNode[] = [
  { id: "brain", name: "Cerebral Cortex", pos: [0, 1.25, 0], color: "#9d4edd", icon: Brain },
  { id: "heart", name: "Cardiac Core", pos: [-0.08, 0.55, 0.2], color: "#ff0055", icon: Heart },
  { id: "lungs", name: "Pulmonary Field", pos: [0.08, 0.55, 0.15], color: "#00f5d4", icon: Wind },
  { id: "liver", name: "Hepatic Metabolic", pos: [0.08, 0.25, 0.15], color: "#ffb703", icon: Activity },
  { id: "kidneys", name: "Renal Filtration", pos: [-0.09, 0.1, -0.15], color: "#ff00ff", icon: Activity },
  { id: "stomach", name: "Digestive Core", pos: [-0.08, 0.3, 0.15], color: "#00f5d4", icon: Activity }
];

// Procedural 3D Human Body Grid Model
function HumanBodyGrid() {
  const groupRef = useRef<THREE.Group>(null);

  // Slow orbital rotation drift
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  // Generate 3D grid lines representing head, torso, and limbs
  const { positions, indices } = React.useMemo(() => {
    const tempPositions: number[] = [];
    const tempIndices: number[] = [];
    let vertexCount = 0;

    const addLimb = (
      start: [number, number, number],
      end: [number, number, number],
      startR: number,
      endR: number,
      segments: number = 8,
      rows: number = 5
    ) => {
      const startIdx = vertexCount;
      const startVec = new THREE.Vector3(...start);
      const endVec = new THREE.Vector3(...end);
      const dir = new THREE.Vector3().subVectors(endVec, startVec);
      dir.normalize();

      const ortho = new THREE.Vector3(1, 0, 0);
      if (Math.abs(dir.x) > 0.9) {
        ortho.set(0, 1, 0);
      }
      const u = new THREE.Vector3().crossVectors(dir, ortho).normalize();
      const v = new THREE.Vector3().crossVectors(dir, u).normalize();

      for (let r = 0; r <= rows; r++) {
        const t = r / rows;
        const radius = startR + t * (endR - startR);
        const center = new THREE.Vector3().lerpVectors(startVec, endVec, t);

        for (let s = 0; s < segments; s++) {
          const phi = (s / segments) * 2 * Math.PI;
          const px = center.x + radius * (Math.cos(phi) * u.x + Math.sin(phi) * v.x);
          const py = center.y + radius * (Math.cos(phi) * u.y + Math.sin(phi) * v.y);
          const pz = center.z + radius * (Math.cos(phi) * u.z + Math.sin(phi) * v.z);
          tempPositions.push(px, py, pz);
          vertexCount++;
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let s = 0; s < segments; s++) {
          const current = startIdx + r * segments + s;
          const nextCol = startIdx + r * segments + ((s + 1) % segments);
          const nextRow = startIdx + (r + 1) * segments + s;
          tempIndices.push(current, nextCol);
          tempIndices.push(current, nextRow);
        }
      }
    };

    addLimb([0, 0, 0], [0, 0.9, 0], 0.32, 0.35, 10, 6);
    addLimb([-0.33, 0.8, 0], [-0.75, 0.15, 0], 0.09, 0.06, 6, 4);
    addLimb([0.33, 0.8, 0], [0.75, 0.15, 0], 0.09, 0.06, 6, 4);
    addLimb([-0.16, 0.0, 0], [-0.16, -1.0, 0], 0.12, 0.07, 8, 6);
    addLimb([0.16, 0.0, 0], [0.16, -1.0, 0], 0.12, 0.07, 8, 6);

    const headR = 0.17;
    const headCenterY = 1.25;
    const headStartIdx = vertexCount;
    const headSegs = 8;
    
    for (let i = 0; i <= headSegs; i++) {
      const theta = (i / headSegs) * Math.PI;
      for (let j = 0; j < headSegs; j++) {
        const phi = (j / headSegs) * 2 * Math.PI;
        const x = headR * Math.sin(theta) * Math.cos(phi);
        const y = headCenterY + headR * Math.sin(theta) * Math.sin(phi);
        const z = headR * Math.cos(theta);
        tempPositions.push(x, y, z);
        vertexCount++;
      }
    }

    for (let i = 0; i < headSegs; i++) {
      for (let j = 0; j < headSegs; j++) {
        const current = headStartIdx + i * headSegs + j;
        const nextCol = headStartIdx + i * headSegs + ((j + 1) % headSegs);
        const nextRow = headStartIdx + (i + 1) * headSegs + j;
        tempIndices.push(current, nextCol);
        tempIndices.push(current, nextRow);
      }
    }

    return {
      positions: new Float32Array(tempPositions),
      indices: new Uint16Array(tempIndices)
    };
  }, []);

  const particlePositions = React.useMemo(() => {
    // Seeded random number generator for render purity
    let seed = 98765;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const pts: number[] = [];
    const addPt = (x: number, y: number, z: number) => {
      pts.push(x, y, z);
    };

    for (let i = 0; i < 150; i++) {
      const theta = random() * 2 * Math.PI;
      const r = random() * 0.28;
      const y = random() * 0.9;
      addPt(r * Math.cos(theta), y, r * Math.sin(theta));
    }

    for (let i = 0; i < 40; i++) {
      const u = random();
      const v = random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = random() * 0.14;
      addPt(
        r * Math.sin(phi) * Math.cos(theta),
        1.25 + r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }

    const addLimbPts = (startX: number, startY: number, endX: number, endY: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const t = random();
        const y = startY * (1 - t) + endY * t;
        const x = startX * (1 - t) + endX * t + (random() - 0.5) * 0.07;
        const z = (random() - 0.5) * 0.07;
        addPt(x, y, z);
      }
    };
    addLimbPts(-0.33, 0.8, -0.75, 0.15, 30);
    addLimbPts(0.33, 0.8, 0.75, 0.15, 30);
    addLimbPts(-0.16, 0.0, -0.16, -1.0, 40);
    addLimbPts(0.16, 0.0, 0.16, -1.0, 40);

    return new Float32Array(pts);
  }, []);

  const vascularLines = React.useMemo(() => {
    const lines: { positions: Float32Array; color: string }[] = [];

    const spinePoints = [];
    for (let y = -0.95; y <= 1.15; y += 0.05) {
      const x = 0.02 * Math.sin(y * 10);
      const z = -0.05 + 0.01 * Math.cos(y * 10);
      spinePoints.push(x, y, z);
    }
    lines.push({ positions: new Float32Array(spinePoints), color: "#9d4edd" });

    const arteryPoints = [
      -0.03, 0.5, 0.05,
      -0.1, 0.65, 0.04,
      -0.33, 0.8, 0.0,
      -0.55, 0.45, 0.0,
      -0.75, 0.15, 0.0
    ];
    lines.push({ positions: new Float32Array(arteryPoints), color: "#ff0055" });

    const arteryLegPoints = [
      -0.03, 0.5, 0.05,
      -0.05, 0.0, 0.0,
      -0.16, -0.5, 0.0,
      -0.16, -1.0, 0.0
    ];
    lines.push({ positions: new Float32Array(arteryLegPoints), color: "#ff0055" });

    const veinPoints = [
      0.03, 0.5, 0.05,
      0.1, 0.65, 0.04,
      0.33, 0.8, 0.0,
      0.55, 0.45, 0.0,
      0.75, 0.15, 0.0
    ];
    lines.push({ positions: new Float32Array(veinPoints), color: "#00f5d4" });

    const veinLegPoints = [
      0.03, 0.5, 0.05,
      0.05, 0.0, 0.0,
      0.16, -0.5, 0.0,
      0.16, -1.0, 0.0
    ];
    lines.push({ positions: new Float32Array(veinLegPoints), color: "#00f5d4" });

    return lines;
  }, []);

  return (
    <group ref={groupRef}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="index" args={[indices, 1]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00f5d4" transparent opacity={0.12} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0.9, 0, 0, 1.08, 0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00f5d4" transparent opacity={0.15} />
      </line>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color="#00f5d4" transparent opacity={0.25} blending={THREE.AdditiveBlending} />
      </points>

      {vascularLines.map((vLine, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[vLine.positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={vLine.color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </line>
      ))}

      {ORGANS.map((organ) => (
        <ThreeOrganNode key={organ.id} organ={organ} />
      ))}
    </group>
  );
}

function ThreeOrganNode({ organ }: { organ: OrganNode }) {
  const { latestTelemetry, setSelectedAnomalyNode } = useBiometricStore();
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef<THREE.Mesh>(null);

  const strains = latestTelemetry?.organ_strain ?? {
    brain: 34.5,
    heart: 48.0,
    lungs: 12.4,
    liver: 25.8,
    kidneys: 38.2,
    stomach: 21.6
  };
  const strainVal = strains[organ.id as keyof typeof strains] ?? 30;
  const isCritical = strainVal > 80;

  useFrame((state) => {
    if (pulseRef.current) {
      const freq = isCritical ? 9 : 4;
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * freq) * 0.25;
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  const nodeColor = isCritical ? "#ff0055" : organ.color;

  return (
    <group position={organ.pos}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          playHUDSound("click");
          setSelectedAnomalyNode(organ.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          playHUDSound("hover");
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={nodeColor} transparent opacity={0.9} />
      </mesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={isCritical ? 0.35 : hovered ? 0.25 : 0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <Html distanceFactor={3.5} position={[0.2, 0.1, 0]}>
        <div
          onClick={() => {
            playHUDSound("click");
            setSelectedAnomalyNode(organ.id);
          }}
          className={`px-1.5 py-0.5 rounded text-[8px] font-mono whitespace-nowrap border cursor-pointer select-none transition-all duration-300 ${
            isCritical
              ? "bg-[#ff0055]/90 border-[#ff0055] text-white shadow-[0_0_8px_rgba(255,0,85,0.3)] animate-pulse"
              : hovered
              ? "bg-deep-space border-neon-cyan text-neon-cyan shadow-[0_0_8px_rgba(0,245,212,0.3)]"
              : "bg-deep-space/85 border-white/5 text-white/80"
          }`}
          style={{ borderColor: isCritical ? "#ff0055" : hovered ? "var(--neon-cyan)" : "rgba(255,255,255,0.1)" }}
        >
          {organ.name.split(" ")[0]}: {strainVal.toFixed(0)}%
        </div>
      </Html>
    </group>
  );
}

export default function OrganMatrix() {
  const { latestTelemetry, selectedAnomalyNode, setSelectedAnomalyNode } = useBiometricStore();

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const renderOrganDetails = (organId: string) => {
    switch (organId) {
      case "brain":
        return (
          <div className="flex flex-col gap-3 font-mono text-[9px] text-text-muted leading-relaxed">
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Focus State</span>
              <span className="text-text-pure font-bold">EEG Alpha Power Ratio: 1.45 (Optimal)</span>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Stress index</span>
              <span className="text-neon-cyan font-bold">{latestTelemetry?.stress_index ?? 42.5} index</span>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p>Frontal lobe synapses firing within threshold. Standard cognitive workloads logged.</p>
            </div>
          </div>
        );
      case "heart":
        return (
          <div className="flex flex-col gap-3 font-mono text-[9px] text-text-muted leading-relaxed">
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Heart Rate Variability</span>
              <span className="text-text-pure font-bold">HRV: 74 ms (Stable Vagal Tone)</span>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Rate Ticker</span>
              <span className="text-neon-cyan font-bold">{latestTelemetry?.heart_rate ?? 72} BPM</span>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p>Sinus cardiac rhythm stabilized. Left ventricular volume: 62%.</p>
            </div>
          </div>
        );
      case "lungs":
        return (
          <div className="flex flex-col gap-3 font-mono text-[9px] text-text-muted leading-relaxed">
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Oxygen SpO2 Concentration</span>
              <span className="text-text-pure font-bold">SpO2: {latestTelemetry?.blood_oxygen ?? 98.8}%</span>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Tidal Rate</span>
              <span className="text-neon-cyan font-bold">Tidal Volume: 512 ml</span>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p>Pulmonary respiratory fields report normal compliance. Airway resistance optimized.</p>
            </div>
          </div>
        );
      case "liver":
        return (
          <div className="flex flex-col gap-3 font-mono text-[9px] text-text-muted leading-relaxed">
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Enzyme Clearance ALT/AST</span>
              <span className="text-text-pure font-bold">ALT: 24 U/L | AST: 21 U/L</span>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Active supplement clearances</span>
              <span className="text-neon-cyan font-bold">Metformin & Caffeine active</span>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p>Pharmacokinetic clearance rates logged. Hepatic clearance timelines stable.</p>
            </div>
          </div>
        );
      case "kidneys":
        return (
          <div className="flex flex-col gap-3 font-mono text-[9px] text-text-muted leading-relaxed">
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Glomerular Filtration Rate</span>
              <span className="text-text-pure font-bold">GFR: 104 ml/min/1.73m² (Normal)</span>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Clearance Telemetry</span>
              <span className="text-neon-cyan font-bold">BUN: 14 mg/dL | Creatinine: 0.95 mg/dL</span>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p>Renal filtration fields report normal blood clearance. Fluid retention index optimized.</p>
            </div>
          </div>
        );
      case "stomach":
        return (
          <div className="flex flex-col gap-3 font-mono text-[9px] text-text-muted leading-relaxed">
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Gastric pH Curve</span>
              <span className="text-text-pure font-bold">pH Level: 1.8 (Optimal digestion)</span>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block tracking-wider mb-0.5">Gut Motility rate</span>
              <span className="text-neon-cyan font-bold">Motility Index: 92%</span>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p>Microbiome indicators log normal. Nutrient absorption metrics actively updating.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const selectedNode = ORGANS.find(o => o.id === selectedAnomalyNode);

  return (
    <div
      onMouseMove={handleCardMouseMove}
      className="rounded-xl cyber-card p-5 border border-white/10 relative magnetic-border-container flex flex-col gap-4 h-[330px] shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
    >


      {/* Background visual asset */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/organ_schematic.png"
          alt="Organ Strain Backdrop"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header HUD info */}
      <div className="relative z-10 w-full flex items-center justify-between border-b border-white/5 pb-2.5 select-none font-mono">
        <div className="flex items-center gap-2">
          <Activity className="text-neon-violet shrink-0" size={16} />
          <h2 className="text-xs uppercase tracking-widest font-black text-text-pure">3D Organ Mapping</h2>
        </div>
        <span className="text-[8px] text-text-muted uppercase font-bold">REALTIME SCAN</span>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center h-full w-full">
        <AnimatePresence mode="wait">
          {!selectedAnomalyNode ? (
            // 3D Grid body mapping canvas view
            <motion.div
              key="body-mesh-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full relative"
            >
              <Canvas
                camera={{ position: [0, 0.4, 2.6], fov: 50 }}
                style={{ background: "transparent", width: "100%", height: "100%" }}
              >
                <ambientLight intensity={0.4} />
                <pointLight position={[5, 5, 5]} intensity={1.2} />
                <HumanBodyGrid />
                <OrbitControls
                  enableZoom={true}
                  enablePan={false}
                  maxDistance={3.5}
                  minDistance={1.8}
                  autoRotate={false}
                />
              </Canvas>
              
              {/* Controls guide overlay */}
              <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[7px] font-mono text-text-muted/60 pointer-events-none select-none">
                <span>ROTATE SILHOUETTE</span>
                <span>CLICK NODES</span>
              </div>
            </motion.div>
          ) : (
            // Zoomed organ detail sub-card
            <motion.div
              key="organ-details-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col gap-4 font-mono h-full justify-between"
            >
              <div className="flex flex-col gap-3">
                {/* Back button header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <button
                    onMouseEnter={() => playHUDSound("hover")}
                    onClick={() => {
                      playHUDSound("click");
                      setSelectedAnomalyNode(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-text-pure transition-all uppercase font-black cursor-pointer active:scale-95 switch-btn"
                    data-cursor="warp"
                  >
                    <ArrowLeft size={12} />
                    <span>RETURN TO 3D MAP</span>
                  </button>
                  <span className="text-[7.5px] text-neon-alert font-bold">
                    REPORT: {selectedAnomalyNode.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedNode && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                      <span className="text-xs font-black text-text-pure uppercase">{selectedNode.name}</span>
                    </>
                  )}
                </div>

                {/* Sub Diagnostics logs */}
                <div className="bg-black/35 border border-white/5 p-3 rounded">
                  {renderOrganDetails(selectedAnomalyNode)}
                </div>
              </div>

              {/* ClearanceRate Footer */}
              <div className="text-[7.5px] font-mono text-text-muted/50 leading-relaxed border-t border-white/5 pt-2">
                * Clearance rate calculated using the exponential decay formula. Logs intake updates instantly adjust residual liver strain indexes.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
