import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

type Ring = number[][];

function terrainHeight(x: number, z: number) {
  return (
    Math.sin(x * 0.92) * 0.2 +
    Math.cos(z * 0.78) * 0.14 +
    Math.sin((x + z) * 0.58) * 0.08
  );
}

function toLocal(ring: Ring | undefined) {
  const fallback: Ring = [
    [-76.385, -12.66],
    [-76.38, -12.66],
    [-76.3798, -12.6645],
    [-76.3849, -12.6647],
    [-76.385, -12.66],
  ];
  const source = ring && ring.length >= 4 ? ring : fallback;
  const closed = source[0][0] === source[source.length - 1][0] && source[0][1] === source[source.length - 1][1];
  const points = closed ? source.slice(0, -1) : source;
  const lat0 = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const lon0 = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const xs = points.map((point) => (point[0] - lon0) * Math.cos((lat0 * Math.PI) / 180));
  const zs = points.map((point) => point[1] - lat0);
  const max = Math.max(...xs.map(Math.abs), ...zs.map(Math.abs), 0.00001);
  const scale = 2.1 / max;
  return xs.map((x, index) => [x * scale, zs[index] * scale] as [number, number]);
}

function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(7.2, 7.2, 90, 90);
    const position = geo.attributes.position as THREE.BufferAttribute;
    for (let index = 0; index < position.count; index += 1) {
      position.setZ(index, terrainHeight(position.getX(index), position.getY(index)));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0] as any}>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#12392b" roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#C9E68F" wireframe transparent opacity={0.07} />
      </mesh>
    </group>
  );
}

function Parcel({ points }: { points: [number, number][] }) {
  const shape = useMemo(() => {
    const result = new THREE.Shape();
    points.forEach(([x, z], index) => {
      if (index === 0) result.moveTo(x, -z);
      else result.lineTo(x, -z);
    });
    result.closePath();
    return result;
  }, [points]);

  const outline: [number, number, number][] = useMemo(
    () => [...points.map(([x, z]) => [x, 0.66, z] as [number, number, number]), [points[0][0], 0.66, points[0][1]]],
    [points],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.56, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color="#C9E68F"
          emissive="#5f8422"
          emissiveIntensity={0.35}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={outline} color="#f6f4ea" lineWidth={1.6} transparent opacity={0.9} />
      {points.map(([x, z], index) => (
        <mesh key={index} position={[x, 0.7, z]}>
          <sphereGeometry args={[0.035, 14, 14]} />
          <meshBasicMaterial color="#0e2a20" />
        </mesh>
      ))}
    </group>
  );
}

export default function ParcelScene({
  geometry,
  className = "",
  autoRotate = true,
}: {
  geometry?: { coordinates?: number[][][] } | null;
  className?: string;
  autoRotate?: boolean;
}) {
  const points = useMemo(() => toLocal(geometry?.coordinates?.[0] as Ring | undefined), [geometry]);

  return (
    <div className={className}>
      <Canvas dpr={[1, 1.7]} camera={{ position: [3.9, 4.4, 5.2], fov: 40 }} gl={{ antialias: true }}>
        <color attach="background" args={["#0b241b"]} />
        <fog attach="fog" args={["#0b241b", 12, 22]} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[5, 7, 2]} intensity={2.4} color="#fff4d6" />
        <pointLight position={[-3, 2, -4]} intensity={6} color="#C9E68F" />
        <group position={[0, -0.35, 0]}>
          <Terrain />
          <Parcel points={points} />
        </group>
        <Stars radius={50} depth={22} count={700} factor={2.2} saturation={0} fade speed={0.3} />
        <OrbitControls
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={0.55}
          minDistance={3.6}
          maxDistance={9.5}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/15 bg-ink/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-cream/60 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-lime" />
        Relieve referencial · no es imagen en vivo
      </div>
    </div>
  );
}
