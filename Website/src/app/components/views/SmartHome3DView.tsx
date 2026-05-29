'use client';

import React, { useRef, useState, useMemo, Suspense, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomData, DeviceData } from '../../types';

/* ═══════════════════════════════════════════════════════════
   COLOR MAPPING — Maps device color strings to hex values
   ═══════════════════════════════════════════════════════════ */
const COLOR_MAP: Record<string, string> = {
  'Warm White': '#ffd699',
  'Cool White': '#e0f0ff',
  'Daylight': '#fff5e6',
  'Sunset': '#ff7043',
  'Ocean Blue': '#4fc3f7',
  'Forest Green': '#66bb6a',
  'Rose Pink': '#f48fb1',
  'Party Mode': '#ce93d8',
};

/* ═══════════════════════════════════════════════════════════
   SmartLight3D — Bóng đèn phát sáng tương tác
   ═══════════════════════════════════════════════════════════ */
interface SmartLight3DProps {
  device: DeviceData;
  position: [number, number, number];
  onClick: () => void;
}

const SmartLight3D = memo(function SmartLight3D({ device, position, onClick }: SmartLight3DProps) {
  const bulbRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);

  const lightColor = COLOR_MAP[device.color || 'Warm White'] || '#ffd699';
  const intensity = device.status ? ((device.brightness || 80) / 100) * 2.5 : 0;

  // Subtle pulsing glow when ON
  useFrame((_, delta) => {
    if (bulbRef.current && device.status) {
      const mat = bulbRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.003) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Đuôi đèn (cylinder) */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Bóng đèn (sphere) */}
      <mesh
        ref={bulbRef}
        position={[0, 1.65, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        castShadow
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={device.status ? lightColor : '#444'}
          emissive={device.status ? lightColor : '#000'}
          emissiveIntensity={device.status ? 0.6 : 0}
          transparent
          opacity={device.status ? 0.95 : 0.6}
          roughness={0.2}
        />
      </mesh>

      {/* PointLight khi bật */}
      {device.status && (
        <pointLight
          ref={glowRef}
          position={[0, 1.5, 0]}
          color={lightColor}
          intensity={intensity}
          distance={4}
          decay={2}
          castShadow
        />
      )}

      {/* Label */}
      <Text
        position={[0, 2.05, 0]}
        fontSize={0.12}
        color={device.status ? '#fff' : '#888'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {device.name}
      </Text>

      {/* Status indicator */}
      <Text
        position={[0, 1.38, 0]}
        fontSize={0.08}
        color={device.status ? '#4ade80' : '#ef4444'}
        anchorX="center"
      >
        {device.status ? `${device.brightness || 80}%` : 'TẮT'}
      </Text>
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   SmartAC3D — Điều hòa gắn tường với quạt xoay
   ═══════════════════════════════════════════════════════════ */
interface SmartAC3DProps {
  device: DeviceData;
  position: [number, number, number];
  onClick: () => void;
}

const SmartAC3D = memo(function SmartAC3D({ device, position, onClick }: SmartAC3DProps) {
  const fanRef = useRef<THREE.Mesh>(null!);

  // Fan rotation animation when ON
  useFrame((_, delta) => {
    if (fanRef.current && device.status) {
      fanRef.current.rotation.z += delta * 6;
    }
  });

  return (
    <group position={position}>
      {/* Thân máy (wall-mounted box) */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        castShadow
      >
        <boxGeometry args={[0.8, 0.25, 0.2]} />
        <meshStandardMaterial
          color={device.status ? '#e3f2fd' : '#78909c'}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Khe gió phía dưới */}
      <mesh position={[0, -0.1, 0.06]}>
        <boxGeometry args={[0.65, 0.04, 0.08]} />
        <meshStandardMaterial
          color={device.status ? '#bbdefb' : '#607d8b'}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Quạt gió (rotating indicator) */}
      <mesh ref={fanRef} position={[0.25, 0, 0.11]}>
        <torusGeometry args={[0.05, 0.015, 8, 4]} />
        <meshStandardMaterial
          color={device.status ? '#42a5f5' : '#90a4ae'}
          emissive={device.status ? '#1565c0' : '#000'}
          emissiveIntensity={device.status ? 0.5 : 0}
        />
      </mesh>

      {/* LED trạng thái */}
      <mesh position={[-0.3, 0.08, 0.11]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color={device.status ? '#4caf50' : '#f44336'}
          emissive={device.status ? '#4caf50' : '#f44336'}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Temperature Text */}
      <Float speed={2} floatIntensity={device.status ? 0.15 : 0}>
        <Text
          position={[0, 0.28, 0.05]}
          fontSize={0.14}
          color={device.status ? '#1e88e5' : '#888'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000"
          font={undefined}
        >
          {device.status ? `${device.temperature || 25}°C` : 'TẮT'}
        </Text>
      </Float>

      {/* Device name */}
      <Text
        position={[0, 0.48, 0]}
        fontSize={0.1}
        color="#ccc"
        anchorX="center"
        outlineWidth={0.008}
        outlineColor="#000"
      >
        {device.name}
      </Text>

      {/* Wind particles effect when ON */}
      {device.status && <ACWindEffect position={[0, -0.2, 0.15]} />}
    </group>
  );
});

/** Hiệu ứng gió nhẹ cho AC */
function ACWindEffect({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Points>(null!);
  const particleCount = 20;

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.6;
      arr[i * 3 + 1] = -Math.random() * 0.4;
      arr[i * 3 + 2] = Math.random() * 0.3;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      let y = pos.getY(i) - delta * 0.5;
      if (y < -0.5) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#90caf9"
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════
   SmartLock3D — Cửa với animation mở/đóng
   ═══════════════════════════════════════════════════════════ */
interface SmartLock3DProps {
  device: DeviceData;
  position: [number, number, number];
  onClick: () => void;
}

const SmartLock3D = memo(function SmartLock3D({ device, position, onClick }: SmartLock3DProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const targetRotation = device.isLocked === false ? -Math.PI / 2 : 0;

  // Smooth door open/close animation
  useFrame(() => {
    if (!doorRef.current) return;
    doorRef.current.rotation.y = THREE.MathUtils.lerp(
      doorRef.current.rotation.y,
      targetRotation,
      0.06,
    );
  });

  return (
    <group position={position}>
      {/* Khung cửa (Door frame) */}
      <mesh castShadow>
        <boxGeometry args={[0.65, 1.4, 0.08]} />
        <meshStandardMaterial color="#5d4037" roughness={0.7} />
      </mesh>

      {/* Cánh cửa (pivots from left edge) */}
      <group ref={doorRef} position={[-0.275, 0, 0.01]}>
        <mesh
          position={[0.275, 0, 0.04]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          castShadow
        >
          <boxGeometry args={[0.55, 1.3, 0.06]} />
          <meshStandardMaterial
            color={device.isLocked ? '#6d4c41' : '#8d6e63'}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Tay nắm cửa */}
        <mesh position={[0.48, 0, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
          <meshStandardMaterial color="#bdbdbd" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* LED khóa */}
        <mesh position={[0.42, 0.2, 0.08]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial
            color={device.isLocked ? '#4caf50' : '#f44336'}
            emissive={device.isLocked ? '#4caf50' : '#f44336'}
            emissiveIntensity={1}
          />
        </mesh>
      </group>

      {/* Label */}
      <Text
        position={[0, 0.9, 0.1]}
        fontSize={0.1}
        color="#ccc"
        anchorX="center"
        outlineWidth={0.008}
        outlineColor="#000"
      >
        {device.name}
      </Text>

      {/* Lock status */}
      <Text
        position={[0, -0.85, 0.1]}
        fontSize={0.08}
        color={device.isLocked ? '#4ade80' : '#ef4444'}
        anchorX="center"
      >
        {device.isLocked ? '🔒 KHÓA' : '🔓 MỞ'}
      </Text>
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   Room3D — Dựng phòng 3D (sàn + tường)
   ═══════════════════════════════════════════════════════════ */
function Room3D() {
  return (
    <group>
      {/* Sàn nhà */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#1a1f2e" roughness={0.8} />
      </mesh>

      {/* Tường sau */}
      <mesh position={[0, 1.2, -3]} receiveShadow>
        <planeGeometry args={[6, 2.5]} />
        <meshStandardMaterial color="#1e2538" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Tường trái */}
      <mesh position={[-3, 1.2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 2.5]} />
        <meshStandardMaterial color="#222942" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Viền sàn */}
      <mesh position={[0, 0, -3]} receiveShadow>
        <boxGeometry args={[6, 0.08, 0.04]} />
        <meshStandardMaterial color="#334" />
      </mesh>
      <mesh position={[-3, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[6, 0.08, 0.04]} />
        <meshStandardMaterial color="#334" />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scene3D — Composition: Camera, Lighting, Room, Devices
   ═══════════════════════════════════════════════════════════ */
interface Scene3DProps {
  room: RoomData;
  onToggleDevice: (roomId: string, deviceId: string) => void;
  onToggleLock: (roomId: string, deviceId: string) => void;
}

function Scene3D({ room, onToggleDevice, onToggleLock }: Scene3DProps) {
  // Calculate device positions dynamically in a grid-like layout
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
      {/* Lighting */}
      <ambientLight intensity={0.25} color="#b0bec5" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <hemisphereLight args={['#1a237e', '#0d1b2a', 0.2]} />

      {/* Controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0.5, 0]}
      />

      {/* Floor Grid */}
      <Grid
        position={[0, 0, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#2a3555"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#3d5afe"
        fadeDistance={12}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Room geometry */}
      <Room3D />

      {/* === Render SmartLight devices === */}
      {devicePositions.lights.map((device, i) => {
        const x = -1.5 + i * 1.5;
        return (
          <SmartLight3D
            key={device.id}
            device={device}
            position={[x, 0, 0]}
            onClick={() => onToggleDevice(room.id, device.id)}
          />
        );
      })}

      {/* === Render SmartAC devices (on back wall) === */}
      {devicePositions.acs.map((device, i) => {
        const x = -1 + i * 2;
        return (
          <SmartAC3D
            key={device.id}
            device={device}
            position={[x, 1.5, -2.85]}
            onClick={() => onToggleDevice(room.id, device.id)}
          />
        );
      })}

      {/* === Render SmartLock devices (on left wall) === */}
      {devicePositions.locks.map((device, i) => {
        const z = -1 + i * 2;
        return (
          <SmartLock3D
            key={device.id}
            device={device}
            position={[-2.9, 0.7, z]}
            onClick={() => onToggleLock(room.id, device.id)}
          />
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SmartHome3DView — Main Component (exported)
   ═══════════════════════════════════════════════════════════ */
interface SmartHome3DViewProps {
  rooms: RoomData[];
  onToggleDevice: (roomId: string, deviceId: string) => void;
  onToggleLock: (roomId: string, deviceId: string) => void;
}

export default function SmartHome3DView({
  rooms,
  onToggleDevice,
  onToggleLock,
}: SmartHome3DViewProps) {
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const currentRoom = rooms[selectedRoomIdx] || rooms[0];

  if (!currentRoom) {
    return (
      <div className="smart3d-empty">
        <p>Chưa có phòng nào. Hãy tạo phòng trước!</p>
      </div>
    );
  }

  return (
    <div className="smart3d-container">
      {/* Room Selector */}
      <div className="smart3d-header">
        <div className="smart3d-header__info">
          <h2 className="smart3d-header__title">🏠 3D Digital Twin</h2>
          <p className="smart3d-header__subtitle">
            Click vào thiết bị để bật/tắt • Kéo chuột để xoay
          </p>
        </div>
        <select
          className="smart3d-header__select"
          value={selectedRoomIdx}
          onChange={(e) => setSelectedRoomIdx(Number(e.target.value))}
        >
          {rooms.map((r, i) => (
            <option key={r.id} value={i}>
              {r.name} ({r.devices.length} thiết bị)
            </option>
          ))}
        </select>
      </div>

      {/* Stats bar */}
      <div className="smart3d-stats">
        {currentRoom.devices.map((d) => (
          <div
            key={d.id}
            className={`smart3d-stats__chip ${d.status ? 'smart3d-stats__chip--on' : ''}`}
          >
            <span className="smart3d-stats__dot" />
            {d.name}
          </div>
        ))}
      </div>

      {/* 3D Canvas */}
      <div className="smart3d-canvas-wrap">
        <Suspense
          fallback={
            <div className="smart3d-loading">
              <div className="smart3d-loading__spinner" />
              <span>Đang tải mô hình 3D...</span>
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [6, 5, 6], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Scene3D
              room={currentRoom}
              onToggleDevice={onToggleDevice}
              onToggleLock={onToggleLock}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Legend */}
      <div className="smart3d-legend">
        <div className="smart3d-legend__item">
          <span className="smart3d-legend__icon smart3d-legend__icon--light">💡</span>
          SmartLight — Bóng đèn phát sáng
        </div>
        <div className="smart3d-legend__item">
          <span className="smart3d-legend__icon smart3d-legend__icon--ac">❄️</span>
          SmartAC — Điều hòa gắn tường
        </div>
        <div className="smart3d-legend__item">
          <span className="smart3d-legend__icon smart3d-legend__icon--lock">🔒</span>
          SmartLock — Cửa thông minh
        </div>
      </div>
    </div>
  );
}
