import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";

function noise3(x: number, y: number, z: number) {
  return Math.sin(x * 2.3) * Math.cos(y * 2.1) * Math.sin(z * 2.7)
    + Math.sin(x * 5.1 + z * 3.3) * 0.42
    + Math.cos(y * 4.4 + x * 1.7) * 0.28;
}

function Planet() {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.32, 6);
    const position = geo.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index);
      const bump = noise3(vertex.x, vertex.y, vertex.z);
      vertex.multiplyScalar(1 + bump * 0.035);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.09;
  });

  return (
    <group ref={group} rotation={[0.22, 0, 0.14]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#246a49" roughness={0.52} metalness={0.28} flatShading />
      </mesh>
      <mesh geometry={geometry} scale={1.006}>
        <meshBasicMaterial color="#C9E68F" wireframe transparent opacity={0.07} />
      </mesh>
      {[0, 1, 2].map((ring) => (
        <mesh key={ring} rotation={[Math.PI / 2 + ring * 0.26, ring * 0.32, 0]}>
          <torusGeometry args={[1.86 + ring * 0.16, 0.0035, 6, 180]} />
          <meshBasicMaterial color="#C9E68F" transparent opacity={0.3 - ring * 0.06} />
        </mesh>
      ))}
      <Orbiters />
      <Atmosphere />
    </group>
  );
}

function Orbiters() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.children.forEach((child, index) => {
      const angle = time * (0.22 + index * 0.11) + index * 2.2;
      const radius = 2.05 + index * 0.3;
      child.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 0.8 + index) * 0.62,
        Math.sin(angle) * radius,
      );
    });
  });

  return (
    <group ref={group}>
      {[0, 1, 2].map((index) => (
        <mesh key={index}>
          <sphereGeometry args={[index === 1 ? 0.045 : 0.032, 16, 16]} />
          <meshBasicMaterial color={index === 1 ? "#D9A441" : "#C9E68F"} />
        </mesh>
      ))}
    </group>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.14}>
      <sphereGeometry args={[1.32, 48, 48]} />
      <meshBasicMaterial color="#7fb069" transparent opacity={0.06} side={THREE.BackSide} />
    </mesh>
  );
}

export default function HeroScene({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas dpr={[1, 1.7]} camera={{ position: [0, 0.35, 4.9], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 3]} intensity={2.6} color="#fff4d6" />
        <pointLight position={[-4, -3, -2]} intensity={9} color="#C9E68F" />
        <Float speed={1.1} rotationIntensity={0.22} floatIntensity={0.65}>
          <Planet />
        </Float>
        <Sparkles count={60} scale={[7, 5, 4]} size={1.6} speed={0.3} color="#C9E68F" opacity={0.55} />
        <Stars radius={60} depth={30} count={1100} factor={2.6} saturation={0} fade speed={0.35} />
      </Canvas>
    </div>
  );
}
