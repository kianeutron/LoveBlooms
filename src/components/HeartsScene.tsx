"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Heart({ position = [0, 0, 0], color = "#ff4d6d", scale = 1 }) {
  const mesh = React.useRef<THREE.Mesh>(null!);

  // Create an extruded heart shape geometry
  const geometry = useMemo(() => {
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();

    heartShape.moveTo(x + 0, y + 0.5);
    heartShape.bezierCurveTo(x + 0, y + 0.5, x - 0.25, y + 0, x - 0.5, y + 0);
    heartShape.bezierCurveTo(x - 1, y + 0, x - 1, y + 0.6, x - 1, y + 0.6);
    heartShape.bezierCurveTo(x - 1, y + 1.1, x - 0.5, y + 1.4, x + 0, y + 1.8);
    heartShape.bezierCurveTo(x + 0.5, y + 1.4, x + 1, y + 1.1, x + 1, y + 0.6);
    heartShape.bezierCurveTo(x + 1, y + 0.6, x + 1, y + 0, x + 0.5, y + 0);
    heartShape.bezierCurveTo(x + 0.25, y + 0, x + 0, y + 0.5, x + 0, y + 0.5);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    const geom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color, 
    emissive: color,
    emissiveIntensity: 0.5,
    roughness: 0.2, 
    metalness: 0.3 
  }), [color]);

  return (
    <Float speed={1.5} rotationIntensity={1.2} floatIntensity={2}>
      <mesh ref={mesh} geometry={geometry} material={material} position={position as any} scale={scale} castShadow receiveShadow />
    </Float>
  );
}

export default function HeartsScene() {
  // Optimized hearts for better performance
  const hearts = useMemo(() => {
    const arr: { position: [number, number, number]; color: string; scale: number }[] = [];
    const palette = ["#ff1744", "#ff4081", "#f50057", "#ff6090", "#c51162", "#e91e63"];
    for (let i = 0; i < 20; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 8 - 2,
        ],
        color: palette[i % palette.length],
        scale: 0.8 + Math.random() * 0.8,
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 5, 2]} intensity={2} castShadow />
        <pointLight position={[-3, 2, 3]} intensity={1.5} color="#ff69b4" />
        <Environment preset="sunset" />
        {hearts.map((h, idx) => (
          <Heart key={idx} position={h.position} color={h.color} scale={h.scale} />
        ))}
        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  );
}
