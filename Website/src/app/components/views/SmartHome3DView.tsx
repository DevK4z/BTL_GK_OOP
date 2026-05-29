/**
 * ============================================================================
 * SmartHome3DView.tsx — Bản vẽ kỹ thuật (Technical Blueprint)
 * ============================================================================
 *
 * PHONG CÁCH:
 * - Isometric Orthographic Projection (Góc nhìn kỹ thuật trục đo).
 * - Wireframe & Minimalist (Tối giản hình khối, loại bỏ trang trí).
 * - Overlay HTML thuần túy (CSS viền đen, nền trắng, chữ sắc nét).
 * - Vùng hoạt động (Active Zones) biểu thị bằng lưới mờ.
 *
 * ============================================================================
 */

'use client';

import React, { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, OrthographicCamera, Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceData, RoomData } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Props & Cấu hình Theme Bản Vẽ Kỹ Thuật (Blueprint)
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

// Bảng màu hệ thống dạng Bản vẽ Blueprint
const BP = {
  BG: '#0b1121',             // Nền xanh đen sâu
  GRID_MAJ: '#1e293b',       // Lưới chính
  GRID_MIN: '#0f172a',       // Lưới phụ
  ROOM_LINE: '#3b82f6',      // Khung phòng (Xanh lam)
  DEVICE_OFF: '#475569',     // Thiết bị tắt (Xám)
  DEVICE_ON: '#06b6d4',      // Thiết bị bật (Cyan kỹ thuật)
  ZONE_LIGHT: '#eab308',     // Vùng chiếu sáng (Vàng)
  ZONE_AC: '#38bdf8',        // Vùng khí lạnh (Xanh nhạt)
  LABEL_BG: '#ffffff',       // Nền nhãn trắng
  LABEL_TEXT: '#000000',     // Chữ đen
  LABEL_BORDER: '#000000',   // Viền đen
};

// ─────────────────────────────────────────────────────────────────────────────
// 1) HTML Label Component — Overlay 2D Sắc Nét
// ─────────────────────────────────────────────────────────────────────────────

function BlueprintLabel({
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
          background: BP.LABEL_BG,
          border: `1px solid ${BP.LABEL_BORDER}`,
          padding: '6px 10px',
          color: BP.LABEL_TEXT,
          fontFamily: '"SF Mono", "Courier New", monospace', // Font kỹ thuật
          fontSize: '12px',
          whiteSpace: 'nowrap',
          boxShadow: '3px 3px 0px rgba(0,0,0,0.5)',
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none',
          pointerEvents: onClick ? 'auto' : 'none',
        }}
      >
        <strong
          style={{
            display: 'block',
            borderBottom: `1px solid ${BP.LABEL_BORDER}`,
            paddingBottom: '4px',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </strong>
        {lines.map((line, idx) => (
          <div key={idx} style={{ lineHeight: '1.4' }}>
            {line}
          </div>
        ))}
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Thiết Bị 3D — Tối Giản & Wireframe
// ─────────────────────────────────────────────────────────────────────────────

// Đèn: Sphere + Cone Wireframe
function SmartLightBlueprint({ device, roomId, position, onToggle }: Device3DProps) {
  const isOn = device.status;
  const brightness = device.brightness ?? 0;
  const color = isOn ? BP.DEVICE_ON : BP.DEVICE_OFF;

  return (
    <group position={position}>
      {/* Khối đèn cơ bản */}
      <mesh
        position={[0, 1.5, 0]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={BP.BG} />
        <Edges color={color} threshold={15} />
      </mesh>

      {/* Vùng hoạt động: Nón chiếu sáng dạng lưới mờ */}
      {isOn && (
        <mesh position={[0, 0.75, 0]}>
          <coneGeometry args={[1.2, 1.5, 16]} />
          <meshBasicMaterial color={BP.ZONE_LIGHT} wireframe transparent opacity={0.3} />
        </mesh>
      )}

      {/* Nhãn HTML */}
      <BlueprintLabel
        position={[0, 2.2, 0]}
        title={`[ĐÈN] ${device.name}`}
        lines={[
          `Mức chiếu sáng: ${brightness}%`,
          `Trạng thái: ${isOn ? 'ON' : 'OFF'}`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

// Điều hòa: Box + Box Wireframe tỏa xuống
function SmartACBlueprint({ device, roomId, position, onToggle }: Device3DProps) {
  const isOn = device.status;
  const temp = device.temperature ?? 25;
  const powerW = isOn ? (device.basePower * (1.0 + Math.abs(temp - 25) * 0.05)).toFixed(0) : '0';
  const color = isOn ? BP.DEVICE_ON : BP.DEVICE_OFF;

  return (
    <group position={position}>
      {/* Khối AC */}
      <mesh
        position={[0, 1.5, 0]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <boxGeometry args={[1.2, 0.4, 0.5]} />
        <meshBasicMaterial color={BP.BG} />
        <Edges color={color} />
      </mesh>

      {/* Vùng hoạt động: Vùng phủ nhiệt dạng Box lưới */}
      {isOn && (
        <mesh position={[0, 0.65, 0.3]}>
          <boxGeometry args={[1.6, 1.3, 1.0]} />
          <meshBasicMaterial color={BP.ZONE_AC} wireframe transparent opacity={0.25} />
        </mesh>
      )}

      <BlueprintLabel
        position={[0, 2.2, 0]}
        title={`[ĐIỀU HÒA] ${device.name}`}
        lines={[
          `Công suất tiêu thụ: ${powerW} W`,
          `Nhiệt độ thiết lập: ${temp} °C`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

// Khóa cửa: Khung bản lề + Cánh cửa Wireframe
function SmartLockBlueprint({ device, roomId, position, onToggle }: Device3DProps) {
  const doorRef = React.useRef<THREE.Group>(null);
  const isOn = device.status;
  const isLocked = device.isLocked ?? true;
  const color = isLocked ? BP.DEVICE_OFF : BP.DEVICE_ON;

  // Animation mở cửa
  useFrame(() => {
    if (doorRef.current) {
      const target = isLocked ? 0 : -Math.PI / 2.5; // Mở vuông góc
      doorRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRef.current.rotation.y,
        target,
        0.1
      );
    }
  });

  return (
    <group position={position}>
      {/* Khung cửa */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.2, 1.5, 0.1]} />
        <meshBasicMaterial color={BP.BG} />
        <Edges color={BP.DEVICE_OFF} />
      </mesh>

      {/* Cánh cửa */}
      <group ref={doorRef} position={[-0.6, 0, 0]}>
        <mesh
          position={[0.6, 0.75, 0]}
          onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <boxGeometry args={[1.2, 1.5, 0.05]} />
          <meshBasicMaterial color={BP.BG} />
          {/* Cánh cửa sẽ nhấp nháy lưới nếu mở */}
          <Edges color={color} />
          {/* Lưới gạch chéo phụ trợ trên cánh cửa (chi tiết kỹ thuật) */}
          <meshBasicMaterial wireframe color={color} transparent opacity={0.3} />
        </mesh>
      </group>

      <BlueprintLabel
        position={[0, 2.0, 0]}
        title={`[KHÓA] ${device.name}`}
        lines={[
          `Cửa: ${isLocked ? 'KHÓA' : 'MỞ'}`,
          `Mạng: ${isOn ? 'Online' : 'Offline'}`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floor Plate — Sàn Phòng Blueprint
// ─────────────────────────────────────────────────────────────────────────────

function BlueprintRoomPlate({
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
      {/* Khung viền sàn phòng */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={size} />
        <meshBasicMaterial color={BP.BG} />
        <Edges color={BP.ROOM_LINE} />
      </mesh>

      {/* Ký hiệu chéo góc (crosshair) ở 4 góc phòng */}
      <mesh position={[-size[0] / 2 + 0.2, 0.02, -size[1] / 2 + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color={BP.ROOM_LINE} wireframe />
      </mesh>
      <mesh position={[size[0] / 2 - 0.2, 0.02, -size[1] / 2 + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color={BP.ROOM_LINE} wireframe />
      </mesh>
      <mesh position={[-size[0] / 2 + 0.2, 0.02, size[1] / 2 - 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color={BP.ROOM_LINE} wireframe />
      </mesh>
      <mesh position={[size[0] / 2 - 0.2, 0.02, size[1] / 2 - 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color={BP.ROOM_LINE} wireframe />
      </mesh>

      {/* Nhãn tên phòng — Đặt ở góc trái dưới mặt sàn, áp sát đất */}
      <Html position={[-size[0] / 2 + 0.5, 0, size[1] / 2 - 0.5]} zIndexRange={[50, 0]}>
        <div
          style={{
            background: BP.ROOM_LINE,
            color: BP.BG,
            padding: '2px 6px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          {roomName}
        </div>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller & Logic Bố Trí
// ─────────────────────────────────────────────────────────────────────────────

function RoomBlueprintGroup({
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
  const spacing = 4.0;
  const plateW = Math.max(cols * spacing, 6.0);
  const plateH = Math.max(rows * spacing, 6.0);

  return (
    <group position={roomPosition}>
      <BlueprintRoomPlate position={[0, 0, 0]} size={[plateW, plateH]} roomName={room.name} />

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
            return <SmartLightBlueprint key={device.id} device={device} roomId={room.id} position={pos} onToggle={onToggle} />;
          case 'SmartAC':
            return <SmartACBlueprint key={device.id} device={device} roomId={room.id} position={pos} onToggle={onToggle} />;
          case 'SmartLock':
            return <SmartLockBlueprint key={device.id} device={device} roomId={room.id} position={pos} onToggle={onToggle} />;
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
  // Tính toán lưới phòng
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
      style={{
        width: '100%',
        height: 'calc(100vh - 140px)',
        minHeight: '600px',
        background: BP.BG,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `2px solid ${BP.GRID_MAJ}`,
        position: 'relative',
      }}
    >
      {/* Ghi chú bản vẽ trên UI */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          color: BP.LABEL_BG,
          fontFamily: 'monospace',
          fontSize: '13px',
          pointerEvents: 'none',
        }}
      >
        <div><strong>BẢN VẼ KỸ THUẬT:</strong> SMART HOME HUB IoT</div>
        <div style={{ color: BP.DEVICE_OFF }}>CHẾ ĐỘ: ISOMETRIC ORTHOGRAPHIC</div>
      </div>

      <Canvas>
        <color attach="background" args={[BP.BG]} />

        {/* Camera Isometric */}
        <OrthographicCamera
          makeDefault
          position={[20, 20, 20]} // Góc nhìn Isometric chuẩn
          zoom={30}
          near={-100}
          far={100}
        />

        {/* Khóa xoay để giữ góc Isometric, chỉ cho phép kéo thả/zoom */}
        <OrbitControls
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Lưới kỹ thuật toàn cảnh */}
        <gridHelper args={[100, 100, BP.GRID_MAJ, BP.GRID_MIN]} position={[0, -0.01, 0]} />

        {/* Render các phòng */}
        {rooms.map((room, idx) => (
          <RoomBlueprintGroup
            key={room.id}
            room={room}
            roomPosition={roomPositions[idx]}
            onToggle={onToggleDevice}
          />
        ))}
      </Canvas>
    </div>
  );
}
