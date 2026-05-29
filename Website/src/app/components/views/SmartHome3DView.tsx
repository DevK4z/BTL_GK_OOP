/**
 * ============================================================================
 * SmartHome3DView.tsx — Realistic 3D Smart Home Environment
 * ============================================================================
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera, Environment, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceData, RoomData } from '../../types';

interface SmartHome3DViewProps {
  rooms: RoomData[];
  onToggleDevice: (roomId: string, deviceId: string) => void;
}

interface Device3DProps {
  device: DeviceData;
  roomId: string;
  position: [number, number, number];
  onToggle: (roomId: string, deviceId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1) UI Label Component (Sleek Modern UI)
// ─────────────────────────────────────────────────────────────────────────────

function ModernLabel({
  position,
  title,
  lines,
  onClick,
}: {
  position: [number, number, number];
  title: string;
  lines: string[];
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Html position={position} center zIndexRange={[100, 0]}>
      <div
        onClick={onClick}
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '12px',
          padding: '8px 12px',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none',
          pointerEvents: onClick ? 'auto' : 'none',
          transform: 'translate3d(30px, -50px, 0)',
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: '-25px',
          left: '-31px',
          width: '30px',
          height: '24px',
          borderBottom: '2px solid rgba(255, 255, 255, 0.6)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '0 0 0 8px',
          pointerEvents: 'none'
        }} />

        <strong style={{ display: 'block', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '4px', marginBottom: '4px', color: '#0f172a' }}>
          {title}
        </strong>
        {lines.map((line, idx) => {
          const highlightedLine = line
            .replace(/(ON|MỞ|Online)/g, `<span style="color: #10b981; font-weight: bold;">$1</span>`)
            .replace(/(OFF|KHÓA|Offline)/g, `<span style="color: #ef4444; font-weight: bold;">$1</span>`);

          return (
            <div key={idx} style={{ lineHeight: '1.6', fontSize: '11px', color: '#475569' }} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
          );
        })}
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Realistic Devices
// ─────────────────────────────────────────────────────────────────────────────

function SmartLightRealistic({ device, roomId, position, onToggle }: Device3DProps) {
  const isOn = device.status;
  const brightness = device.brightness ?? 0;
  
  // Convert color name to hex
  let bulbColor = '#ffffff';
  if (device.color === 'Warm White') bulbColor = '#ffeedd';
  if (device.color === 'Daylight') bulbColor = '#e0f7fa';
  if (device.color === 'Cool White') bulbColor = '#f0f8ff';
  if (device.color === 'Sunset') bulbColor = '#ffccaa';

  return (
    <group position={position}>
      {/* Light Base (Metal) */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 32]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Glass Bulb */}
      <mesh 
        position={[0, 1.2, 0]} 
        castShadow 
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial 
          color={isOn ? bulbColor : '#ffffff'} 
          transmission={1} 
          thickness={0.5} 
          roughness={isOn ? 0.1 : 0.3} 
          ior={1.5} 
        />
      </mesh>

      {/* Glowing Inner Core */}
      {isOn && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={bulbColor} />
          <pointLight color={bulbColor} intensity={brightness / 50} distance={10} castShadow />
        </mesh>
      )}

      <ModernLabel
        position={[0, 1.8, 0]}
        title={`💡 ${device.name}`}
        lines={[
          `Độ sáng: ${brightness}%`,
          `Trạng thái: ${isOn ? 'ON' : 'OFF'}`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

function SmartACRealistic({ device, roomId, position, onToggle }: Device3DProps) {
  const isOn = device.status;
  const temp = device.temperature ?? 25;
  const powerW = isOn ? (device.basePower * (1.0 + Math.abs(temp - 25) * 0.05)).toFixed(0) : '0';

  return (
    <group position={position}>
      {/* AC Main Body (Glossy White Plastic) */}
      <RoundedBox 
        args={[2.2, 0.8, 0.6]} 
        radius={0.1} 
        smoothness={4} 
        position={[0, 1.2, 0]} 
        castShadow 
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.1} />
      </RoundedBox>

      {/* Flap (Darker grey) */}
      <mesh position={[0, 0.9, 0.2]} rotation={[isOn ? -0.2 : 0, 0, 0]}>
        <boxGeometry args={[2.0, 0.1, 0.2]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>

      {/* LED Display */}
      <mesh position={[0.6, 1.2, 0.31]}>
        <planeGeometry args={[0.4, 0.2]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {isOn && (
        <Html position={[0.6, 1.2, 0.32]} transform distanceFactor={5}>
          <div style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '24px' }}>
            {temp}°
          </div>
        </Html>
      )}

      <ModernLabel
        position={[0, 1.8, 0]}
        title={`❄️ ${device.name}`}
        lines={[
          `Nhiệt độ : ${temp}°C`,
          `Công suất: ${powerW}W`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

function SmartLockRealistic({ device, roomId, position, onToggle }: Device3DProps) {
  const doorRef = useRef<THREE.Group>(null);
  const isOn = device.status;
  const isLocked = device.isLocked ?? true;

  useFrame(() => {
    if (doorRef.current) {
      const target = isLocked ? 0 : -Math.PI / 2.5; 
      doorRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRef.current.rotation.y,
        target,
        0.1
      );
    }
  });

  return (
    <group position={position}>
      {/* Door Frame */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 3, 0.15]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Door Panel */}
      <group ref={doorRef} position={[-0.8, 0, 0]}>
        <mesh 
          position={[0.8, 1.5, 0]} 
          castShadow 
          receiveShadow
          onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <boxGeometry args={[1.6, 2.9, 0.1]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Smart Lock Keypad */}
        <mesh position={[1.4, 1.5, 0.06]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.05]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
        </mesh>

        {/* Lock LED Indicator */}
        <mesh position={[1.4, 1.6, 0.09]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={isLocked ? '#ef4444' : '#10b981'} />
        </mesh>

        {/* Handle */}
        <mesh position={[1.4, 1.4, 0.1]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      <ModernLabel
        position={[0, 3.2, 0]}
        title={`🔒 ${device.name}`}
        lines={[
          `Cửa : ${isLocked ? 'KHÓA' : 'MỞ'}`,
          `Mạng: ${isOn ? 'Online' : 'Offline'}`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floor Plate — Realistic Room Floor
// ─────────────────────────────────────────────────────────────────────────────

function RealisticRoomPlate({
  position,
  size,
  roomName,
}: {
  position: [number, number, number];
  size: [number, number];
  roomName: string;
}) {
  return (
    <group position={position}>
      {/* Floor Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Wall Borders (Low walls to signify room edges) */}
      <mesh position={[0, 0.1, -size[1] / 2]} receiveShadow castShadow>
        <boxGeometry args={[size[0], 0.3, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, size[1] / 2]} receiveShadow castShadow>
        <boxGeometry args={[size[0], 0.3, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <mesh position={[-size[0] / 2, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.1, 0.3, size[1]]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <mesh position={[size[0] / 2, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.1, 0.3, size[1]]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>

      {/* Room Name Tag */}
      <Html position={[-size[0] / 2 + 0.5, 0.3, size[1] / 2 - 0.5]} zIndexRange={[50, 0]}>
        <div style={{
          background: '#334155',
          color: '#ffffff',
          padding: '4px 10px',
          borderRadius: '12px',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          {roomName}
        </div>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller & Grouping
// ─────────────────────────────────────────────────────────────────────────────

function RealisticRoomGroup({
  room,
  roomPosition,
  onToggle,
}: {
  room: RoomData;
  roomPosition: [number, number, number];
  onToggle: (roomId: string, deviceId: string) => void;
}) {
  const count = room.devices.length;
  const cols = count > 0 ? Math.min(count, 3) : 1;
  const rows = count > 0 ? Math.ceil(count / cols) : 1;
  const spacing = 4.5;
  const plateW = Math.max(cols * spacing + 1.0, 6.0);
  const plateH = Math.max(rows * spacing + 1.0, 6.0);

  return (
    <group position={roomPosition}>
      <RealisticRoomPlate position={[0, 0, 0]} size={[plateW, plateH]} roomName={room.name} />

      {room.devices.map((device, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const ox = ((cols - 1) * spacing) / 2;
        const oz = ((rows - 1) * spacing) / 2;
        const x = col * spacing - ox;
        const z = row * spacing - oz;
        const pos: [number, number, number] = [x, 0, z];

        switch (device.type) {
          case 'SmartLight':
            return <SmartLightRealistic key={device.id} device={device} roomId={room.id} position={pos} onToggle={onToggle} />;
          case 'SmartAC':
            return <SmartACRealistic key={device.id} device={device} roomId={room.id} position={pos} onToggle={onToggle} />;
          case 'SmartLock':
            return <SmartLockRealistic key={device.id} device={device} roomId={room.id} position={pos} onToggle={onToggle} />;
          default:
            return null;
        }
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────

export default function SmartHome3DView({ rooms, onToggleDevice }: SmartHome3DViewProps) {
  const roomPositions = useMemo(() => {
    const COLS = 2;
    const SPACING_X = 14; 
    const SPACING_Z = 12;
    return rooms.map((_, i): [number, number, number] => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const totalCols = Math.min(rooms.length, COLS);
      const totalRows = Math.ceil(rooms.length / COLS);
      const ox = ((totalCols - 1) * SPACING_X) / 2;
      const oz = ((totalRows - 1) * SPACING_Z) / 2;
      return [col * SPACING_X - ox, 0, row * SPACING_Z - oz];
    });
  }, [rooms.length]);

  return (
    <div
      className="touch-none"
      style={{
        width: '100%',
        height: 'calc(100vh - 140px)',
        minHeight: '600px',
        background: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `2px solid #1e293b`,
        position: 'relative',
      }}
    >
      <Canvas shadows camera={{ position: [20, 20, 30], fov: 40 }}>
        <color attach="background" args={['#0f172a']} />
        
        {/* Lighing & Environment */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
          shadow-bias={-0.0001}
        />
        <Environment preset="city" />

        <OrbitControls
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={0}
          enableDamping
          dampingFactor={0.05}
        />

        {rooms.map((room, idx) => (
          <RealisticRoomGroup
            key={room.id}
            room={room}
            roomPosition={roomPositions[idx]}
            onToggle={onToggleDevice}
          />
        ))}

        {/* Tùy chọn ContactShadows để có bóng mềm siêu thực tế trên mặt đất */}
        <ContactShadows position={[0, -0.08, 0]} opacity={0.4} scale={100} blur={2} far={10} />
      </Canvas>
    </div>
  );
}
