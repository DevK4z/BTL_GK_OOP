/**
 * ============================================================================
 * SmartHome3DView.tsx — Trực quan hóa 3D hệ thống Smart Home Hub (v2)
 * ============================================================================
 *
 * CẢI TIẾN v2:
 * - Nhóm thiết bị theo phòng với sàn phòng riêng biệt
 * - Billboard labels (luôn hướng về camera) — dễ đọc mọi góc nhìn
 * - Nhãn to hơn, nền panel bán trong suốt cho contrast cao
 * - Hiệu ứng ring indicator cho trạng thái thiết bị
 * - Fog tạo chiều sâu không gian
 * - Animation mượt mà hơn
 *
 * ============================================================================
 * TÍCH HỢP VÀO DASHBOARD:
 * ============================================================================
 *
 *   import dynamic from 'next/dynamic';
 *   const SmartHome3DView = dynamic(
 *     () => import('./components/views/SmartHome3DView'),
 *     { ssr: false }
 *   );
 *
 *   const { rooms } = useSmartHomeStore();
 *   const { toggleDevice } = useSmartHome();
 *
 *   <SmartHome3DView
 *     rooms={rooms}
 *     onToggleDevice={(roomId, deviceId) => toggleDevice(roomId, deviceId)}
 *   />
 *
 * ============================================================================
 */

'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceData, RoomData } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

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
// Bảng màu hệ thống
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  // Thiết bị
  OFF: '#3a3a4a',
  OFF_LABEL: '#6b7280',
  HOVER: '#818cf8',

  // SmartLight
  LIGHT_ON: '#fbbf24',
  LIGHT_GLOW: '#fde68a',

  // SmartAC
  AC_ON: '#38bdf8',
  AC_COLD: '#0ea5e9',
  AC_HOT: '#f97316',

  // SmartLock
  LOCK_LOCKED: '#ef4444',
  LOCK_UNLOCKED: '#22c55e',
  DOOR_FRAME: '#57534e',
  DOOR_PANEL: '#78716c',

  // Nhãn
  WHITE: '#ffffff',
  YELLOW: '#fbbf24',
  CYAN: '#22d3ee',
  RED: '#ef4444',
  GREEN: '#22c55e',
  MUTED: '#94a3b8',
  DIM: '#475569',

  // Nền
  BG: '#0a0a14',
  FLOOR: '#12121e',
  GRID_LINE: '#1e1e3a',
  ROOM_FLOOR: '#181828',

  // Phòng — màu accent cho mỗi phòng
  ROOM_COLORS: ['#818cf8', '#f472b6', '#34d399', '#fb923c'] as string[],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Label Panel — Bảng nhãn bán trong suốt (Billboard)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * InfoLabel: nhãn text nổi phía trên thiết bị, luôn quay về camera.
 * Nền panel tối bán trong suốt để text luôn dễ đọc.
 */
function InfoLabel({
  position,
  lines,
  accentColor = C.WHITE,
  width = 2.4,
}: {
  position: [number, number, number];
  lines: { text: string; color: string; size: number; bold?: boolean }[];
  accentColor?: string;
  width?: number;
}) {
  const totalHeight = lines.reduce((sum, l) => sum + l.size * 1.6, 0) + 0.15;

  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <group>
        {/* Nền panel */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[width, totalHeight]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.55} />
        </mesh>

        {/* Viền trên màu accent */}
        <mesh position={[0, totalHeight / 2 - 0.02, -0.005]}>
          <planeGeometry args={[width, 0.04]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>

        {/* Render từng dòng text */}
        {(() => {
          let yOffset = totalHeight / 2 - 0.15;
          return lines.map((line, i) => {
            const y = yOffset - line.size * 0.5;
            yOffset -= line.size * 1.6;
            return (
              <Text
                key={i}
                position={[0, y, 0]}
                fontSize={line.size}
                color={line.color}
                anchorX="center"
                anchorY="middle"
                fontWeight={line.bold ? 'bold' : 'normal'}
                outlineWidth={0.008}
                outlineColor="#000000"
                maxWidth={width - 0.2}
              >
                {line.text}
              </Text>
            );
          });
        })()}
      </group>
    </Billboard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Ring — Vòng tròn chỉ trạng thái xung quanh thiết bị
// ─────────────────────────────────────────────────────────────────────────────

function StatusRing({
  radius = 0.55,
  color,
  active,
}: {
  radius?: number;
  color: string;
  active: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && active) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.3;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[radius - 0.04, radius, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={active ? 0.7 : 0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1) SmartLight3D
// ─────────────────────────────────────────────────────────────────────────────

function SmartLight3D({ device, roomId, position, onToggle }: Device3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  const isOn = device.status;
  const brightness = device.brightness ?? 0;

  const meshColor = useMemo(() => {
    if (hovered) return C.HOVER;
    if (isOn) return C.LIGHT_ON;
    return C.OFF;
  }, [hovered, isOn]);

  useFrame((state) => {
    if (meshRef.current) {
      if (isOn) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
    if (glowRef.current) {
      const target = isOn ? (brightness / 100) * 4 : 0;
      glowRef.current.intensity = THREE.MathUtils.lerp(glowRef.current.intensity, target, 0.1);
    }
  });

  const powerW = isOn ? ((device.basePower * brightness) / 100).toFixed(1) : '0';

  return (
    <group position={position}>
      {/* Status ring */}
      <StatusRing color={C.LIGHT_ON} active={isOn} radius={0.6} />

      {/* Chân đèn — trụ nhỏ */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 16]} />
        <meshStandardMaterial color="#555" roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Bóng đèn */}
      <mesh
        ref={meshRef}
        position={[0, 0.55, 0]}
        castShadow
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color={meshColor}
          emissive={isOn ? C.LIGHT_ON : '#000'}
          emissiveIntensity={isOn ? (brightness / 100) * 1.0 : 0}
          roughness={0.2}
          metalness={0.05}
          transparent={!isOn}
          opacity={isOn ? 1 : 0.6}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        ref={glowRef}
        position={[0, 0.55, 0]}
        color={C.LIGHT_GLOW}
        distance={6}
        decay={2}
      />

      {/* Nhãn thông tin */}
      <InfoLabel
        position={[0, 1.5, 0]}
        accentColor={isOn ? C.LIGHT_ON : C.OFF}
        width={2.2}
        lines={[
          { text: device.name, color: C.WHITE, size: 0.18, bold: true },
          {
            text: isOn ? `ĐỘ SÁNG: ${brightness}%` : '⏻ TẮT',
            color: isOn ? C.YELLOW : C.OFF_LABEL,
            size: 0.16,
            bold: true,
          },
          { text: `${powerW}W`, color: C.MUTED, size: 0.12 },
        ]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) SmartAC3D
// ─────────────────────────────────────────────────────────────────────────────

function SmartAC3D({ device, roomId, position, onToggle }: Device3DProps) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const fanRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const isOn = device.status;
  const temp = device.temperature ?? 25;

  const meshColor = useMemo(() => {
    if (hovered) return C.HOVER;
    if (isOn) return C.AC_ON;
    return C.OFF;
  }, [hovered, isOn]);

  const tempColor = useMemo(() => {
    if (!isOn) return C.OFF_LABEL;
    if (temp <= 20) return C.CYAN;
    if (temp >= 28) return C.AC_HOT;
    return C.GREEN;
  }, [isOn, temp]);

  // Animation: rung nhẹ body + xoay quạt
  useFrame((state) => {
    if (bodyRef.current && isOn) {
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 6) * 0.005;
    }
    if (fanRef.current) {
      if (isOn) {
        fanRef.current.rotation.z += 0.15;
      }
    }
  });

  const powerW = isOn
    ? (device.basePower * (1.0 + Math.abs(temp - 25) * 0.05)).toFixed(0)
    : '0';

  return (
    <group position={position}>
      {/* Status ring */}
      <StatusRing color={C.AC_ON} active={isOn} radius={0.8} />

      {/* Giá đỡ tường */}
      <mesh position={[0, 0.9, -0.2]} castShadow>
        <boxGeometry args={[0.15, 0.6, 0.06]} />
        <meshStandardMaterial color="#444" roughness={0.8} metalness={0.4} />
      </mesh>

      {/* Thân máy — bo tròn */}
      <mesh
        ref={bodyRef}
        position={[0, 0.9, 0]}
        castShadow
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[1.2, 0.4, 0.35]} />
        <meshStandardMaterial
          color={meshColor}
          emissive={isOn ? C.AC_ON : '#000'}
          emissiveIntensity={isOn ? 0.25 : 0}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* LED chỉ thị trên thân */}
      <mesh position={[0.45, 0.95, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={isOn ? C.GREEN : C.RED} />
      </mesh>

      {/* Khe gió — cánh quạt quay khi bật */}
      <mesh position={[0, 0.65, 0.1]}>
        <boxGeometry args={[1.0, 0.06, 0.08]} />
        <meshStandardMaterial
          color={isOn ? '#1e3a5f' : '#333'}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Quạt gió ẩn (biểu tượng xoay) */}
      {isOn && (
        <mesh ref={fanRef} position={[0, 0.65, 0.16]}>
          <ringGeometry args={[0.08, 0.15, 6]} />
          <meshBasicMaterial color={C.AC_ON} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Nhãn */}
      <InfoLabel
        position={[0, 1.8, 0]}
        accentColor={isOn ? C.AC_ON : C.OFF}
        width={2.4}
        lines={[
          { text: device.name, color: C.WHITE, size: 0.18, bold: true },
          {
            text: isOn ? `NHIỆT ĐỘ: ${temp} °C` : '⏻ TẮT',
            color: tempColor,
            size: 0.17,
            bold: true,
          },
          { text: `${powerW}W`, color: C.MUTED, size: 0.12 },
        ]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) SmartLock3D
// ─────────────────────────────────────────────────────────────────────────────

function SmartLock3D({ device, roomId, position, onToggle }: Device3DProps) {
  const doorRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const isOn = device.status;
  const isLocked = device.isLocked ?? true;

  const lockColor = isLocked ? C.LOCK_LOCKED : C.LOCK_UNLOCKED;

  useFrame(() => {
    if (doorRef.current) {
      const target = isLocked ? 0 : -Math.PI / 3;
      doorRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRef.current.rotation.y,
        target,
        0.06,
      );
    }
  });

  return (
    <group position={position}>
      {/* Status ring */}
      <StatusRing
        color={lockColor}
        active={isOn}
        radius={0.9}
      />

      {/* ── Khung cửa ── */}
      {/* Thanh trên */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.2, 0.1, 0.14]} />
        <meshStandardMaterial color={C.DOOR_FRAME} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Thanh trái (bản lề) */}
      <mesh position={[-0.6, 0.75, 0]} castShadow>
        <boxGeometry args={[0.1, 1.6, 0.14]} />
        <meshStandardMaterial color={C.DOOR_FRAME} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Thanh phải */}
      <mesh position={[0.6, 0.75, 0]} castShadow>
        <boxGeometry args={[0.1, 1.6, 0.14]} />
        <meshStandardMaterial color={C.DOOR_FRAME} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Bậc cửa */}
      <mesh position={[0, -0.01, 0]} castShadow>
        <boxGeometry args={[1.2, 0.06, 0.2]} />
        <meshStandardMaterial color={C.DOOR_FRAME} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* ── Cánh cửa (xoay bản lề trái) ── */}
      <group ref={doorRef} position={[-0.5, 0, 0]}>
        <mesh
          position={[0.5, 0.75, 0]}
          castShadow
          onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <boxGeometry args={[1.0, 1.5, 0.06]} />
          <meshStandardMaterial
            color={hovered ? '#8d8476' : C.DOOR_PANEL}
            roughness={0.5}
            metalness={0.15}
          />
        </mesh>

        {/* Panel trang trí trên cánh cửa */}
        <mesh position={[0.5, 1.1, 0.035]}>
          <boxGeometry args={[0.7, 0.45, 0.01]} />
          <meshStandardMaterial color="#6b6560" roughness={0.7} />
        </mesh>
        <mesh position={[0.5, 0.4, 0.035]}>
          <boxGeometry args={[0.7, 0.45, 0.01]} />
          <meshStandardMaterial color="#6b6560" roughness={0.7} />
        </mesh>

        {/* Tay nắm + ổ khóa */}
        <group position={[0.85, 0.75, 0.04]}>
          {/* Tay nắm */}
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.04, 0.2, 0.06]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* LED khóa */}
          <mesh position={[0, 0.15, 0.02]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color={hovered ? C.HOVER : lockColor}
              emissive={lockColor}
              emissiveIntensity={0.8}
              metalness={0.8}
              roughness={0.1}
            />
          </mesh>
        </group>
      </group>

      {/* Nhãn */}
      <InfoLabel
        position={[0, 2.1, 0]}
        accentColor={lockColor}
        width={2.6}
        lines={[
          { text: device.name, color: C.WHITE, size: 0.18, bold: true },
          {
            text: `TRẠNG THÁI: ${isLocked ? '🔒 KHÓA' : '🔓 MỞ'}`,
            color: lockColor,
            size: 0.17,
            bold: true,
          },
          {
            text: isOn ? 'KẾT NỐI' : 'NGOẠI TUYẾN',
            color: isOn ? C.MUTED : C.DIM,
            size: 0.12,
          },
        ]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Floor Plate — Sàn phòng riêng biệt
// ─────────────────────────────────────────────────────────────────────────────

function RoomFloorPlate({
  position,
  size,
  accentColor,
  roomName,
  deviceCount,
}: {
  position: [number, number, number];
  size: [number, number];
  accentColor: string;
  roomName: string;
  deviceCount: number;
}) {
  return (
    <group position={position}>
      {/* Mặt sàn phòng */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color={C.ROOM_FLOOR}
          roughness={0.85}
          metalness={0.05}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Viền phòng — 4 cạnh */}
      {/* Trên */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -size[1] / 2]}>
        <planeGeometry args={[size[0], 0.06]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.7} />
      </mesh>
      {/* Dưới */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, size[1] / 2]}>
        <planeGeometry args={[size[0], 0.06]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.7} />
      </mesh>
      {/* Trái */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-size[0] / 2, 0.008, 0]}>
        <planeGeometry args={[0.06, size[1]]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.7} />
      </mesh>
      {/* Phải */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size[0] / 2, 0.008, 0]}>
        <planeGeometry args={[0.06, size[1]]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.7} />
      </mesh>

      {/* Tên phòng — Billboard */}
      <Billboard position={[0, 0.3, -size[1] / 2 + 0.3]}>
        {/* Nền */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[3.0, 0.45]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.15} />
        </mesh>
        <Text
          fontSize={0.22}
          color={accentColor}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.01}
          outlineColor="#000"
        >
          {`◈ ${roomName.toUpperCase()}  (${deviceCount})`}
        </Text>
      </Billboard>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Device Renderer — Dispatch đúng component 3D theo type
// ─────────────────────────────────────────────────────────────────────────────

function DeviceRenderer({ device, roomId, position, onToggle }: Device3DProps) {
  const adjustedPos = useMemo((): [number, number, number] => {
    switch (device.type) {
      case 'SmartLight':
        return [position[0], 0, position[2]];
      case 'SmartAC':
        return [position[0], 0, position[2]];
      case 'SmartLock':
        return [position[0], 0, position[2]];
      default:
        return position;
    }
  }, [device.type, position]);

  switch (device.type) {
    case 'SmartLight':
      return <SmartLight3D device={device} roomId={roomId} position={adjustedPos} onToggle={onToggle} />;
    case 'SmartAC':
      return <SmartAC3D device={device} roomId={roomId} position={adjustedPos} onToggle={onToggle} />;
    case 'SmartLock':
      return <SmartLock3D device={device} roomId={roomId} position={adjustedPos} onToggle={onToggle} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Group — Nhóm một phòng chứa nhiều thiết bị
// ─────────────────────────────────────────────────────────────────────────────

function RoomGroup({
  room,
  roomPosition,
  accentColor,
  onToggle,
}: {
  room: RoomData;
  roomPosition: [number, number, number];
  accentColor: string;
  onToggle: (roomId: string, deviceId: string) => void;
}) {
  const devices = room.devices;
  const count = devices.length;

  // Tính toán kích thước sàn phòng và vị trí thiết bị trong phòng
  const cols = count > 0 ? Math.min(count, 3) : 1;
  const rows = count > 0 ? Math.ceil(count / cols) : 1;
  const spacing = 2.8;
  const plateW = Math.max(cols * spacing + 1.0, 4.5);
  const plateH = Math.max(rows * spacing + 1.5, 4.0);

  return (
    <group position={roomPosition}>
      {/* Sàn phòng */}
      <RoomFloorPlate
        position={[0, 0, 0]}
        size={[plateW, plateH]}
        accentColor={accentColor}
        roomName={room.name}
        deviceCount={count}
      />

      {/* Thiết bị */}
      {devices.map((device, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const ox = ((cols - 1) * spacing) / 2;
        const oz = ((rows - 1) * spacing) / 2;
        const x = col * spacing - ox;
        const z = row * spacing - oz + 0.3;

        return (
          <DeviceRenderer
            key={device.id}
            device={device}
            roomId={room.id}
            position={[x, 0, z]}
            onToggle={onToggle}
          />
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene: Sàn tổng, lưới, ánh sáng, fog
// ─────────────────────────────────────────────────────────────────────────────

function SceneEnvironment() {
  return (
    <>
      {/* Fog — chiều sâu không gian */}
      <fog attach="fog" args={[C.BG, 15, 45]} />

      {/* Ánh sáng */}
      <ambientLight intensity={0.5} color="#d0d4ff" />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.3}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-6, 8, -4]} intensity={0.25} color="#a0b4ff" />
      {/* Rim light nhẹ từ dưới để thấy chi tiết ở mặt dưới */}
      <pointLight position={[0, 0.3, 0]} intensity={0.2} color="#4a5568" distance={30} />

      {/* Sàn tổng */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={C.FLOOR} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Lưới tọa độ */}
      <gridHelper args={[60, 60, C.GRID_LINE, C.GRID_LINE]} position={[0, -0.01, 0]} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tính vị trí phòng — bố trí 2 cột
// ─────────────────────────────────────────────────────────────────────────────

function computeRoomPositions(roomCount: number): [number, number, number][] {
  const COLS = 2;
  const SPACING_X = 12;
  const SPACING_Z = 10;
  const positions: [number, number, number][] = [];

  for (let i = 0; i < roomCount; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const totalCols = Math.min(roomCount, COLS);
    const totalRows = Math.ceil(roomCount / COLS);
    const ox = ((totalCols - 1) * SPACING_X) / 2;
    const oz = ((totalRows - 1) * SPACING_Z) / 2;
    positions.push([col * SPACING_X - ox, 0, row * SPACING_Z - oz]);
  }

  return positions;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────

export default function SmartHome3DView({ rooms, onToggleDevice }: SmartHome3DViewProps) {
  const roomPositions = useMemo(() => computeRoomPositions(rooms.length), [rooms.length]);

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 140px)',
        minHeight: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: C.BG,
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
      }}
    >
      {/* Legend — chú thích phòng */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {rooms.map((room, i) => (
          <div key={room.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: C.ROOM_COLORS[i % C.ROOM_COLORS.length],
              }}
            />
            <span style={{ color: '#ccc', fontSize: 12, fontFamily: 'system-ui' }}>
              {room.name} ({room.devices.length})
            </span>
          </div>
        ))}
      </div>

      {/* Hướng dẫn điều khiển */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 6,
          padding: '6px 12px',
          color: '#666',
          fontSize: 11,
          fontFamily: 'system-ui',
        }}
      >
        🖱 Kéo xoay • Cuộn zoom • Click thiết bị để toggle
      </div>

      <Canvas
        shadows
        camera={{
          position: [12, 14, 16],
          fov: 45,
          near: 0.1,
          far: 200,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <color attach="background" args={[C.BG]} />

        <SceneEnvironment />

        {/* Render các phòng */}
        {rooms.map((room, idx) => (
          <RoomGroup
            key={room.id}
            room={room}
            roomPosition={roomPositions[idx]}
            accentColor={C.ROOM_COLORS[idx % C.ROOM_COLORS.length]}
            onToggle={onToggleDevice}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
}
