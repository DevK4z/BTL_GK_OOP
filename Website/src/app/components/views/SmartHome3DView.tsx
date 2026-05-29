/**
 * ============================================================================
 * SmartHome3DView.tsx — Bản vẽ kỹ thuật (Technical Blueprint) - Cải tiến Visuals
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

// Bảng màu hệ thống dạng Bản vẽ Blueprint (Dark mode viền neon sáng)
const BP = {
  BG: '#0b1120',             // Nền xanh đen sâu
  GRID_MAJ: '#1e293b',       // Lưới chính (Slate 800)
  GRID_MIN: '#0f172a',       // Lưới phụ (Slate 900)
  ROOM_LINE: '#64748b',      // Khung phòng
  MESH_BASE: '#172554',      // Màu khối base (Đậm hơn sàn để nổi khối)
  DEVICE_OFF: '#475569',     // Thiết bị tắt (Xám)
  DEVICE_ON: '#0ea5e9',      // Thiết bị bật (Cyan/Blue kỹ thuật)
  ZONE_LIGHT: '#fde047',     // Vùng chiếu sáng (Vàng chanh)
  ZONE_AC: '#7dd3fc',        // Vùng khí lạnh (Xanh nhạt)
  LABEL_BG: 'rgba(15, 23, 42, 0.75)', // Nền nhãn trong suốt nhẹ
  LABEL_TEXT: '#e0f2fe',     // Chữ xanh nhạt sáng
  LABEL_BORDER: '#0ea5e9',   // Viền xanh
  LABEL_ACCENT: '#38bdf8',   // Điểm nhấn chữ
};

// ─────────────────────────────────────────────────────────────────────────────
// 1) HTML Label Component — Callout Overlay
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
          position: 'relative',
          background: BP.LABEL_BG,
          backdropFilter: 'blur(4px)',
          border: `1px solid ${BP.LABEL_BORDER}`,
          padding: '6px 10px',
          color: BP.LABEL_TEXT,
          fontFamily: '"SF Mono", "Courier New", monospace', // Font kỹ thuật
          fontSize: '11px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none',
          pointerEvents: onClick ? 'auto' : 'none',
          // Đẩy label lệch lên trên và sang phải để tránh đè khối 3D
          transform: 'translate3d(30px, -40px, 0)', 
        }}
      >
        {/* Đường kẻ chỉ nối từ hộp label xuống tâm object */}
        <div style={{
          position: 'absolute',
          bottom: '-21px',
          left: '-31px',
          width: '30px',
          height: '20px',
          borderBottom: `1px solid ${BP.LABEL_BORDER}`,
          borderLeft: `1px solid ${BP.LABEL_BORDER}`,
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        <strong
          style={{
            display: 'block',
            borderBottom: `1px solid ${BP.LABEL_BORDER}`,
            paddingBottom: '4px',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: BP.LABEL_ACCENT,
          }}
        >
          {title}
        </strong>
        {lines.map((line, idx) => {
          // Highlight thông số quan trọng (ON, MỞ, số)
          const highlightedLine = line
            .replace(/(ON|MỞ|Online)/g, `<span style="color: #4ade80; font-weight: bold;">$1</span>`)
            .replace(/(OFF|KHÓA|Offline)/g, `<span style="color: #f87171; font-weight: bold;">$1</span>`)
            .replace(/(\d+[%W]?)/g, `<span style="color: #fde047;">$1</span>`);

          return (
            <div 
              key={idx} 
              style={{ lineHeight: '1.5', opacity: 0.9 }}
              dangerouslySetInnerHTML={{ __html: highlightedLine }}
            />
          );
        })}
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Thiết Bị 3D — Tối Giản & Wireframe
// ─────────────────────────────────────────────────────────────────────────────

function SmartLightBlueprint({ device, roomId, position, onToggle }: Device3DProps) {
  const isOn = device.status;
  const brightness = device.brightness ?? 0;
  const color = isOn ? BP.DEVICE_ON : BP.DEVICE_OFF;

  return (
    <group position={position}>
      <mesh
        position={[0, 1.5, 0]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshBasicMaterial color={BP.MESH_BASE} />
        <Edges color={color} threshold={15} />
      </mesh>

      {isOn && (
        <mesh position={[0, 0.75, 0]}>
          <coneGeometry args={[1.5, 1.5, 16]} />
          <meshBasicMaterial color={BP.ZONE_LIGHT} wireframe transparent opacity={0.25} />
        </mesh>
      )}

      <BlueprintLabel
        position={[0, 1.5, 0]}
        title={`[ĐÈN] ${device.name}`}
        lines={[
          `Mức sáng : ${brightness}%`,
          `Trạng thái: ${isOn ? 'ON' : 'OFF'}`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

function SmartACBlueprint({ device, roomId, position, onToggle }: Device3DProps) {
  const isOn = device.status;
  const temp = device.temperature ?? 25;
  const powerW = isOn ? (device.basePower * (1.0 + Math.abs(temp - 25) * 0.05)).toFixed(0) : '0';
  const color = isOn ? BP.DEVICE_ON : BP.DEVICE_OFF;

  return (
    <group position={position}>
      <mesh
        position={[0, 1.5, 0]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <boxGeometry args={[1.4, 0.5, 0.6]} />
        <meshBasicMaterial color={BP.MESH_BASE} />
        <Edges color={color} />
      </mesh>

      {isOn && (
        <mesh position={[0, 0.5, 0.4]}>
          <boxGeometry args={[1.8, 1.5, 1.2]} />
          <meshBasicMaterial color={BP.ZONE_AC} wireframe transparent opacity={0.25} />
        </mesh>
      )}

      <BlueprintLabel
        position={[0, 1.5, 0]}
        title={`[ĐIỀU HÒA] ${device.name}`}
        lines={[
          `Công suất: ${powerW}W`,
          `Nhiệt độ : ${temp}°C`,
        ]}
        onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
      />
    </group>
  );
}

function SmartLockBlueprint({ device, roomId, position, onToggle }: Device3DProps) {
  const doorRef = React.useRef<THREE.Group>(null);
  const isOn = device.status;
  const isLocked = device.isLocked ?? true;
  const color = isLocked ? BP.DEVICE_OFF : BP.DEVICE_ON;

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
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.4, 1.5, 0.1]} />
        <meshBasicMaterial color={BP.MESH_BASE} />
        <Edges color={BP.DEVICE_OFF} />
      </mesh>

      <group ref={doorRef} position={[-0.7, 0, 0]}>
        <mesh
          position={[0.7, 0.75, 0]}
          onClick={(e) => { e.stopPropagation(); onToggle(roomId, device.id); }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <boxGeometry args={[1.4, 1.5, 0.05]} />
          <meshBasicMaterial color={BP.MESH_BASE} />
          <Edges color={color} />
          <meshBasicMaterial wireframe color={color} transparent opacity={0.2} />
        </mesh>
      </group>

      <BlueprintLabel
        position={[0, 1.5, 0]}
        title={`[KHÓA] ${device.name}`}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={size} />
        <meshBasicMaterial color={BP.BG} />
        <Edges color={BP.ROOM_LINE} />
      </mesh>

      {/* Crosshairs ở các góc */}
      {[
        [-size[0] / 2 + 0.3, -size[1] / 2 + 0.3],
        [size[0] / 2 - 0.3, -size[1] / 2 + 0.3],
        [-size[0] / 2 + 0.3, size[1] / 2 - 0.3],
        [size[0] / 2 - 0.3, size[1] / 2 - 0.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial color={BP.ROOM_LINE} wireframe />
        </mesh>
      ))}

      {/* Nhãn tên phòng */}
      <Html position={[-size[0] / 2 + 0.5, 0, size[1] / 2 - 0.5]} zIndexRange={[50, 0]}>
        <div
          style={{
            background: BP.ROOM_LINE,
            color: '#ffffff',
            padding: '3px 8px',
            fontFamily: '"SF Mono", "Courier New", monospace',
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', // Ngăn ngắt dòng
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
  const spacing = 5.5; // Tăng khoảng cách giữa các thiết bị để nhãn không đè nhau
  const plateW = Math.max(cols * spacing + 1.0, 7.0);
  const plateH = Math.max(rows * spacing + 1.0, 7.0);

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
  const roomPositions = useMemo(() => {
    const COLS = 2;
    const SPACING_X = 18; // Tăng khoảng cách các phòng
    const SPACING_Z = 16;
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
      className="touch-none" // Ngăn trình duyệt xử lý thao tác vuốt trên mobile (kẹt cuộn trang)
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
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          color: BP.LABEL_ACCENT,
          fontFamily: '"SF Mono", "Courier New", monospace',
          fontSize: '13px',
          pointerEvents: 'none',
        }}
      >
        <div><strong>BẢN VẼ KỸ THUẬT:</strong> SMART HOME HUB IoT</div>
        <div style={{ color: BP.DEVICE_OFF }}>CHẾ ĐỘ: ISOMETRIC ORTHOGRAPHIC</div>
      </div>

      <Canvas>
        <color attach="background" args={[BP.BG]} />

        <OrthographicCamera
          makeDefault
          position={[25, 25, 25]} 
          zoom={25} // Thu nhỏ lại một chút để bao quát tốt hơn
          near={-100}
          far={100}
        />

        <OrbitControls
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0}
          enableDamping
          dampingFactor={0.05}
        />

        <gridHelper args={[150, 150, BP.GRID_MAJ, BP.GRID_MIN]} position={[0, -0.01, 0]} />

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
