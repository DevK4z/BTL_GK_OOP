'use client';

import React, { useRef, useState, useMemo, Suspense, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Text,
  Grid,
  Float,
  Environment,
  TransformControls,
  RoundedBox,
  Cylinder
} from '@react-three/drei';
import { EffectComposer, Bloom, N8AO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSmartHomeStore } from '../../store';
import type { RoomData, DeviceData, FurnitureData, FurnitureType } from '../../types';
import { Plus, Trash2, Edit3, Check } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   COLOR MAPPING
   ═══════════════════════════════════════════════════════════ */
const COLOR_MAP: Record<string, string> = {
  'Warm White': '#ffcc88',
  'Cool White': '#e0f0ff',
  'Daylight': '#ffffff',
  'Sunset': '#ff7043',
};

/* ═══════════════════════════════════════════════════════════
   SmartLight3D — PBR
   ═══════════════════════════════════════════════════════════ */
const SmartLight3D = memo(function SmartLight3D({ device, position, onClick }: { device: DeviceData, position: [number, number, number], onClick: () => void }) {
  const lightColor = COLOR_MAP[device.color || 'Warm White'] || '#ffcc88';
  const intensity = device.status ? ((device.brightness || 80) / 100) * 3 : 0;

  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshPhysicalMaterial color="#333" metalness={0.9} roughness={0.2} clearcoat={1} />
      </mesh>
      <mesh position={[0, 1.65, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }} castShadow>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial
          color={device.status ? '#ffffff' : '#888'}
          emissive={device.status ? lightColor : '#000'}
          emissiveIntensity={device.status ? 2 : 0}
          transmission={0.9}
          opacity={1}
          metalness={0}
          roughness={0}
          ior={1.5}
          thickness={0.05}
        />
      </mesh>
      {device.status && (
        <pointLight position={[0, 1.5, 0]} color={lightColor} intensity={intensity} distance={5} decay={2} castShadow />
      )}
      <Text position={[0, 2.05, 0]} fontSize={0.12} color={device.status ? '#fff' : '#888'} anchorX="center" anchorY="middle">
        {device.name}
      </Text>
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   SmartAC3D — PBR
   ═══════════════════════════════════════════════════════════ */
const SmartAC3D = memo(function SmartAC3D({ device, position, onClick }: { device: DeviceData, position: [number, number, number], onClick: () => void }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (fanRef.current && device.status) fanRef.current.rotation.z += delta * 8;
  });

  return (
    <group position={position}>
      <RoundedBox args={[0.8, 0.25, 0.2]} radius={0.05} smoothness={4} onClick={(e) => { e.stopPropagation(); onClick(); }} castShadow>
        <meshPhysicalMaterial color={device.status ? '#ffffff' : '#e0e0e0'} metalness={0.1} roughness={0.2} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, -0.1, 0.06]}>
        <boxGeometry args={[0.65, 0.04, 0.08]} />
        <meshPhysicalMaterial color="#333" metalness={0.5} roughness={0.8} />
      </mesh>
      <mesh ref={fanRef} position={[0.25, 0, 0.11]}>
        <torusGeometry args={[0.05, 0.015, 16, 8]} />
        <meshPhysicalMaterial color={device.status ? '#00b0ff' : '#555'} emissive={device.status ? '#00b0ff' : '#000'} emissiveIntensity={device.status ? 1.5 : 0} />
      </mesh>
      <Float speed={2} floatIntensity={device.status ? 0.2 : 0}>
        <Text position={[0, 0.28, 0.05]} fontSize={0.14} color={device.status ? '#00b0ff' : '#888'} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#fff">
          {device.status ? `${device.temperature || 25}°C` : 'TẮT'}
        </Text>
      </Float>
      <Text position={[0, 0.48, 0]} fontSize={0.1} color="#aaa" anchorX="center">{device.name}</Text>
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   SmartLock3D — PBR
   ═══════════════════════════════════════════════════════════ */
const SmartLock3D = memo(function SmartLock3D({ device, position, onClick }: { device: DeviceData, position: [number, number, number], onClick: () => void }) {
  const doorRef = useRef<THREE.Group>(null!);
  const targetRotation = device.isLocked === false ? -Math.PI / 2 : 0;
  useFrame(() => {
    if (doorRef.current) doorRef.current.rotation.y = THREE.MathUtils.lerp(doorRef.current.rotation.y, targetRotation, 0.1);
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.65, 1.4, 0.08]} />
        <meshPhysicalMaterial color="#3e2723" metalness={0} roughness={0.9} clearcoat={0.1} />
      </mesh>
      <group ref={doorRef} position={[-0.275, 0, 0.01]}>
        <mesh position={[0.275, 0, 0.04]} onClick={(e) => { e.stopPropagation(); onClick(); }} castShadow>
          <boxGeometry args={[0.55, 1.3, 0.06]} />
          <meshPhysicalMaterial color="#5d4037" roughness={0.8} metalness={0.1} clearcoat={0.3} />
        </mesh>
        <mesh position={[0.48, 0, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.12, 16]} />
          <meshPhysicalMaterial color="#eceff1" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0.42, 0.2, 0.08]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshPhysicalMaterial color={device.isLocked ? '#00e676' : '#ff1744'} emissive={device.isLocked ? '#00e676' : '#ff1744'} emissiveIntensity={2} />
        </mesh>
      </group>
      <Text position={[0, 0.9, 0.1]} fontSize={0.1} color="#aaa" anchorX="center">{device.name}</Text>
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   FURNITURE COMPONENTS (Procedural PBR)
   ═══════════════════════════════════════════════════════════ */
const Sofa3D = memo(function Sofa3D() {
  return (
    <group position={[0, 0.2, 0]} castShadow receiveShadow>
      {/* Base */}
      <RoundedBox args={[1.8, 0.3, 0.8]} radius={0.05} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#8d6e63" roughness={1} metalness={0} clearcoat={0} />
      </RoundedBox>
      {/* Backrest */}
      <RoundedBox args={[1.8, 0.6, 0.2]} radius={0.05} smoothness={4} position={[0, 0.45, -0.3]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#8d6e63" roughness={1} metalness={0} />
      </RoundedBox>
      {/* Armrests */}
      <RoundedBox args={[0.2, 0.5, 0.8]} radius={0.05} smoothness={4} position={[-0.8, 0.4, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#795548" roughness={1} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.5, 0.8]} radius={0.05} smoothness={4} position={[0.8, 0.4, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#795548" roughness={1} metalness={0} />
      </RoundedBox>
    </group>
  );
});

const Table3D = memo(function Table3D() {
  return (
    <group position={[0, 0.3, 0]} castShadow receiveShadow>
      {/* Top */}
      <RoundedBox args={[1.2, 0.05, 0.8]} radius={0.02} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#4e342e" roughness={0.6} metalness={0.1} clearcoat={0.5} />
      </RoundedBox>
      {/* Legs */}
      {[-0.5, 0.5].map(x => [-0.3, 0.3].map(z => (
        <Cylinder key={`${x}-${z}`} args={[0.03, 0.03, 0.3, 16]} position={[x, -0.15, z]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#eceff1" metalness={1} roughness={0.1} />
        </Cylinder>
      )))}
    </group>
  );
});

const TV3D = memo(function TV3D() {
  return (
    <group position={[0, 0.6, 0]} castShadow receiveShadow>
      {/* Screen */}
      <RoundedBox args={[1.6, 0.9, 0.05]} radius={0.02} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#111" roughness={0.1} metalness={0.8} clearcoat={1} />
      </RoundedBox>
      {/* Stand */}
      <RoundedBox args={[0.4, 0.02, 0.2]} radius={0.01} smoothness={4} position={[0, -0.46, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#333" roughness={0.5} metalness={0.5} />
      </RoundedBox>
      <Cylinder args={[0.04, 0.04, 0.1, 16]} position={[0, -0.43, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#eceff1" metalness={1} roughness={0.2} />
      </Cylinder>
    </group>
  );
});

const Plant3D = memo(function Plant3D() {
  return (
    <group position={[0, 0.2, 0]} castShadow receiveShadow>
      {/* Pot */}
      <Cylinder args={[0.2, 0.15, 0.4, 32]} position={[0, 0, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#fafafa" roughness={0.2} metalness={0.1} clearcoat={1} />
      </Cylinder>
      {/* Leaves */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshPhysicalMaterial color="#2e7d32" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[0.1, 0.5, 0.1]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshPhysicalMaterial color="#388e3c" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[-0.1, 0.45, -0.1]} castShadow receiveShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshPhysicalMaterial color="#4caf50" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   Furniture Manager (TransformControls + Rendering)
   ═══════════════════════════════════════════════════════════ */
function FurnitureItem({
  furniture,
  roomId,
  isEditMode,
  updateFurniture,
  removeFurniture
}: {
  furniture: FurnitureData;
  roomId: string;
  isEditMode: boolean;
  updateFurniture: any;
  removeFurniture: any;
}) {
  const [isSelected, setIsSelected] = useState(false);

  // Deselect if edit mode turns off
  React.useEffect(() => {
    if (!isEditMode) setIsSelected(false);
  }, [isEditMode]);

  const innerContent = (
    <group 
      position={!isEditMode ? furniture.position : [0,0,0]} 
      rotation={!isEditMode ? furniture.rotation : [0,0,0]}
      onClick={(e) => {
        if (isEditMode) {
          e.stopPropagation();
          setIsSelected(true);
        }
      }}
      onPointerMissed={() => isEditMode && setIsSelected(false)}
    >
      {furniture.type === 'Sofa' && <Sofa3D />}
      {furniture.type === 'Table' && <Table3D />}
      {furniture.type === 'TV' && <TV3D />}
      {furniture.type === 'Plant' && <Plant3D />}
      
      {/* Delete button floating above when selected */}
      {isEditMode && isSelected && (
        <Float speed={2} floatIntensity={1} position={[0, 1.2, 0]}>
          <group onClick={(e) => { e.stopPropagation(); removeFurniture(roomId, furniture.id); }}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <Text position={[0, 0, 0.16]} fontSize={0.12} color="#fff" anchorX="center" anchorY="middle">X</Text>
          </group>
        </Float>
      )}
    </group>
  );

  if (isEditMode && isSelected) {
    return (
      <TransformControls
        mode="translate"
        position={furniture.position}
        rotation={furniture.rotation}
        onObjectChange={(e) => {
          if (e?.target?.object) {
            const pos = e.target.object.position;
            const rot = e.target.object.rotation;
            updateFurniture(roomId, furniture.id, [pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z]);
          }
        }}
      >
        {innerContent}
      </TransformControls>
    );
  }

  return innerContent;
}

/* ═══════════════════════════════════════════════════════════
   Room3D — Dựng phòng 3D (sàn + tường)
   ═══════════════════════════════════════════════════════════ */
function Room3D() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshPhysicalMaterial color="#1a1f2e" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.5, -5]} receiveShadow>
        <planeGeometry args={[10, 3]} />
        <meshPhysicalMaterial color="#222942" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 3]} />
        <meshPhysicalMaterial color="#1e2538" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scene3D
   ═══════════════════════════════════════════════════════════ */
interface Scene3DProps {
  room: RoomData;
  onToggleDevice: (roomId: string, deviceId: string) => void;
  onToggleLock: (roomId: string, deviceId: string) => void;
  isEditMode: boolean;
  updateFurniture: any;
  removeFurniture: any;
}

function Scene3D({ room, onToggleDevice, onToggleLock, isEditMode, updateFurniture, removeFurniture }: Scene3DProps) {
  const devicePositions = useMemo(() => {
    const lights: DeviceData[] = [];
    const acs: DeviceData[] = [];
    const locks: DeviceData[] = [];
    room.devices.forEach((d) => {
      if (d.type === 'SmartLight') lights.push(d);
      else if (d.type === 'SmartAC') acs.push(d);
      else if (d.type === 'SmartLock') locks.push(d);
    });
    return { lights, acs, locks };
  }, [room.devices]);

  return (
    <>
      <Environment preset="apartment" background blur={0.8} />
      
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* Make OrbitControls default so TransformControls auto-disables it when dragging */}
      <OrbitControls makeDefault minDistance={2} maxDistance={20} maxPolarAngle={Math.PI / 2 - 0.05} target={[0, 0, 0]} />

      <Grid position={[0, 0.01, 0]} args={[10, 10]} cellSize={0.5} cellThickness={0.5} cellColor="#3d5afe" sectionSize={2} sectionThickness={1.5} sectionColor="#4fc3f7" fadeDistance={15} fadeStrength={1.5} infiniteGrid visible={isEditMode} />

      <Room3D />

      {/* Devices */}
      {devicePositions.lights.map((device, i) => (
        <SmartLight3D key={device.id} device={device} position={[-2 + i * 2, 0, 0]} onClick={() => !isEditMode && onToggleDevice(room.id, device.id)} />
      ))}
      {devicePositions.acs.map((device, i) => (
        <SmartAC3D key={device.id} device={device} position={[-1 + i * 2.5, 2, -4.85]} onClick={() => !isEditMode && onToggleDevice(room.id, device.id)} />
      ))}
      {devicePositions.locks.map((device, i) => (
        <SmartLock3D key={device.id} device={device} position={[-4.9, 0.7, -1 + i * 2.5]} onClick={() => !isEditMode && onToggleLock(room.id, device.id)} />
      ))}

      {/* Furniture */}
      {room.furniture?.map((f) => (
        <FurnitureItem key={f.id} furniture={f} roomId={room.id} isEditMode={isEditMode} updateFurniture={updateFurniture} removeFurniture={removeFurniture} />
      ))}

      {/* Post Processing */}
      <EffectComposer disableNormalPass multisampling={4}>
        <N8AO aoRadius={0.5} intensity={1} color="#000000" />
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
      </EffectComposer>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SmartHome3DView — Main Component
   ═══════════════════════════════════════════════════════════ */
export default function SmartHome3DView({
  rooms,
  onToggleDevice,
  onToggleLock,
}: {
  rooms: RoomData[];
  onToggleDevice: (roomId: string, deviceId: string) => void;
  onToggleLock: (roomId: string, deviceId: string) => void;
}) {
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const { addFurniture, updateFurniture, removeFurniture } = useSmartHomeStore();

  const currentRoom = rooms[selectedRoomIdx] || rooms[0];

  if (!currentRoom) {
    return <div className="smart3d-empty"><p>Chưa có phòng nào. Hãy tạo phòng trước!</p></div>;
  }

  return (
    <div className="smart3d-container">
      {/* Header */}
      <div className="smart3d-header flex-wrap">
        <div className="smart3d-header__info">
          <h2 className="smart3d-header__title">🌟 Ultra-Realistic 3D Twin</h2>
          <p className="smart3d-header__subtitle">Đồ họa PBR & Post-processing • Trải nghiệm chân thực</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${isEditMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
          >
            {isEditMode ? <><Check size={16} /> Hoàn tất Bố trí</> : <><Edit3 size={16} /> Bố trí Nội thất</>}
          </button>
          <select className="smart3d-header__select" value={selectedRoomIdx} onChange={(e) => setSelectedRoomIdx(Number(e.target.value))}>
            {rooms.map((r, i) => <option key={r.id} value={i}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Editor Toolbar (Only in Edit Mode) */}
      {isEditMode && (
        <div className="p-3 bg-[#131a2e] border border-blue-500/30 rounded-xl flex gap-3 overflow-x-auto shadow-lg shadow-blue-900/20">
          <div className="text-sm text-blue-400 font-semibold flex items-center mr-2 border-r border-white/10 pr-4">Thêm Nội thất:</div>
          {['Sofa', 'Table', 'TV', 'Plant'].map(type => (
            <button
              key={type}
              onClick={() => addFurniture(currentRoom.id, type as FurnitureType)}
              className="px-4 py-1.5 bg-[#0f1525] hover:bg-blue-600/20 text-white rounded-lg border border-white/10 hover:border-blue-500/50 text-sm flex items-center gap-2 transition-all"
            >
              <Plus size={14} /> {type}
            </button>
          ))}
          <div className="ml-auto text-xs text-gray-400 flex items-center bg-black/20 px-3 py-1 rounded-lg">
            Click vào vật thể để Kéo Thả / Nhấn X màu đỏ để xóa
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div className="smart3d-canvas-wrap" style={{ height: '600px' }}>
        <Suspense fallback={<div className="smart3d-loading"><div className="smart3d-loading__spinner" /><span>Đang render PBR...</span></div>}>
          <Canvas shadows camera={{ position: [7, 6, 7], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
            <Scene3D room={currentRoom} onToggleDevice={onToggleDevice} onToggleLock={onToggleLock} isEditMode={isEditMode} updateFurniture={updateFurniture} removeFurniture={removeFurniture} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}
