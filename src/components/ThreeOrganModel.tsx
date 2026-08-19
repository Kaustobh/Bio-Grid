"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useBiometricStore } from "@/store/useBiometricStore";

interface BrainNode {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
  type: string;
  confidence: number;
  details: string;
}

// Multi-colored nodes mapping localized diagnostic structures
const ANOMALIES: BrainNode[] = [
  { id: "node-prefrontal", name: "Prefrontal Cognitive Hub", pos: [0.6, 0.7, 1.1], color: "#4ade80", type: "Executive Synapse Flow", confidence: 97.4, details: "Prefrontal cortex neurotransmission verified at baseline efficiency. Alpha power indicates optimized focus and stress resilience." },
  { id: "node-hippocampus", name: "Hippocampus Memory Hub", pos: [-0.5, -0.4, 0.6], color: "#60a5fa", type: "Sleep Spindle Spreading", confidence: 88.5, details: "Mild hippocampal sleep spindle congestion observed. Correlated with melatonin phase offsets. Chrono-nutrition patch dispatch recommended." },
  { id: "node-cerebellum", name: "Cerebellar Strain Hub", pos: [0.2, -0.9, -0.9], color: "#ef4444", type: "Motor Output Strain", confidence: 91.8, details: "Elevated metabolic cerebellar strain spike detected during cardio testing. Hydration replenishment and mineral intake logged required." },
  { id: "node-occipital", name: "Occipital Visual Hub", pos: [-0.4, -0.1, -1.3], color: "#ffb703", type: "Alpha Rhythm Dysrhythmia", confidence: 93.1, details: "Occipital visual feedback loops stable. Faint blue-light exposure signature detected during deep sleep cycles." }
];

// Procedural Brain Hemisphere Component
function BrainHemisphere({ side }: { side: "left" | "right" }) {
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const veinRef = useRef<THREE.Group>(null);
  
  const xOffset = side === "left" ? -0.55 : 0.55;

  // Slow orbital drift rotation
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (pointsRef.current) pointsRef.current.rotation.y = elapsed * 0.08;
    if (lineRef.current) lineRef.current.rotation.y = elapsed * 0.08;
    if (veinRef.current) veinRef.current.rotation.y = elapsed * 0.08;
  });

  // Mathematically model the wrinkled gyri folds of the cortex (sulci)
  // Maps points on a sphere perturbed by high-frequency sinusoidal oscillations
  const { positions, indices } = React.useMemo(() => {
    const tempPositions: number[] = [];
    const tempIndices: number[] = [];
    const uSegments = 16;
    const vSegments = 16;

    for (let i = 0; i <= uSegments; i++) {
      const theta = (i / uSegments) * Math.PI; // 0 to PI
      for (let j = 0; j <= vSegments; j++) {
        const phi = (j / vSegments) * 2 * Math.PI; // 0 to 2PI

        // Brain shape formula (distort sphere to create lobes and cortex folds)
        const baseRadius = 1.0;
        // High frequency sine/cos offsets simulate brain fold wrinkles
        const foldsOffset = 0.16 * Math.sin(6.0 * theta) * Math.cos(6.0 * phi);
        const r = baseRadius + foldsOffset;

        // Spherical to Cartesian coordinate translation
        // Shrink width slightly (0.75 factor) to make brain hemispheres oblong
        const x = r * Math.sin(theta) * Math.cos(phi) * 0.75 + xOffset;
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(theta) * 1.1; // Oblong length

        tempPositions.push(x, y, z);
      }
    }

    // Grid wireframe line indices
    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const current = i * (vSegments + 1) + j;
        const nextRow = (i + 1) * (vSegments + 1) + j;
        
        // Connect horizontal grid lines
        tempIndices.push(current, current + 1);
        // Connect vertical grid lines
        tempIndices.push(current, nextRow);
      }
    }

    return {
      positions: new Float32Array(tempPositions),
      indices: new Uint16Array(tempIndices)
    };
  }, [xOffset]);

  // Generate glowing procedural veins winding along the hemisphere surface
  const veinCurves = React.useMemo(() => {
    const curvesList: THREE.Vector3[][] = [];
    const numVeins = 3;
    
    for (let v = 0; v < numVeins; v++) {
      const points: THREE.Vector3[] = [];
      const basePhi = (v / numVeins) * 2 * Math.PI;
      
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const theta = t * Math.PI;
        const phi = basePhi + Math.sin(t * Math.PI * 2) * 0.6;
        
        const foldsOffset = 0.16 * Math.sin(6.0 * theta) * Math.cos(6.0 * phi);
        const r = 1.02 + foldsOffset; // slightly outside the grid cortex
        
        const x = r * Math.sin(theta) * Math.cos(phi) * 0.75 + xOffset;
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(theta) * 1.1;
        
        points.push(new THREE.Vector3(x, y, z));
      }
      curvesList.push(points);
    }
    return curvesList;
  }, [xOffset]);

  return (
    <group>
      {/* 1. Cortical Grid Wireframe */}
      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="index"
            args={[indices, 1]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={side === "left" ? "#9d4edd" : "#00f5d4"}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 2. Synapse Point Cloud Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={side === "left" ? "#b5179e" : "#00f5d4"}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3. Glowing Vascular Vein Pathways */}
      <group ref={veinRef}>
        {veinCurves.map((curvePoints, idx) => {
          const curve = new THREE.CatmullRomCurve3(curvePoints);
          const points = curve.getPoints(30);
          const linePositions = new Float32Array(points.flatMap(p => [p.x, p.y, p.z]));

          return (
            <line key={idx}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[linePositions, 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#60a5fa"
                linewidth={2}
                transparent
                opacity={0.5}
                blending={THREE.AdditiveBlending}
              />
            </line>
          );
        })}
      </group>
    </group>
  );
}

function DiagnosticNode({ node }: { node: BrainNode }) {
  const { selectedAnomalyNode, setSelectedAnomalyNode } = useBiometricStore();
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedAnomalyNode === node.id;
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 7) * 0.3;
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={node.pos}>
      {/* Node Hub Ball */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAnomalyNode(isSelected ? null : node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer Warning Pulse Circle */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={isSelected ? 0.35 : hovered ? 0.25 : 0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* HTML holographic diagnostics tooltip */}
      <Html distanceFactor={4} position={[0.25, 0.15, 0]}>
        <div
          className={`px-2 py-0.5 rounded text-[8px] font-mono whitespace-nowrap border pointer-events-none transition-all duration-300 ${
            isSelected
              ? "bg-[#ff0055] border-[#ff0055] text-white shadow-[0_0_10px_rgba(255,0,85,0.4)]"
              : hovered
              ? "bg-deep-space border-neon-cyan text-neon-cyan"
              : "bg-deep-space/85 border-white/10 text-white/80"
          }`}
          style={{
            borderColor: isSelected ? "#ff0055" : hovered ? "var(--neon-cyan)" : "rgba(255,255,255,0.15)",
          }}
        >
          {isSelected ? `! ${node.name.toUpperCase()}` : node.name}
        </div>
      </Html>
    </group>
  );
}

export default function ThreeOrganModel() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <div className="w-full h-full relative" data-cursor="warp">
      <Canvas
        camera={{ position: [0, 0, 4.0], fov: 50 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        
        <group ref={groupRef}>
          {/* Left Hemisphere Lobe */}
          <BrainHemisphere side="left" />
          {/* Right Hemisphere Lobe */}
          <BrainHemisphere side="right" />

          {/* Interactive Multi-colored Nodes */}
          {ANOMALIES.map((node) => (
            <DiagnosticNode key={node.id} node={node} />
          ))}
        </group>

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxDistance={7}
          minDistance={2.5}
          autoRotate={false}
        />
      </Canvas>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[8px] font-mono text-text-muted select-none pointer-events-none">
        <span>DRAG TO ROTATE 3D LOBES</span>
        <span>SCROLL TO ZOOM CORTEX</span>
      </div>
    </div>
  );
}

export { ANOMALIES };
