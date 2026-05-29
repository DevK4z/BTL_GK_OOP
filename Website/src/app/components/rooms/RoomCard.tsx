'use client';

import {
  Sofa,
  CookingPot,
  BedDouble,
  Warehouse,
  Zap,
  Cpu,
  Trash2,
} from 'lucide-react';
import { type Room, getRoomPower, getDevicePower, useSmartHomeStore } from '../../store';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  sofa: Sofa,
  'cooking-pot': CookingPot,
  'bed-double': BedDouble,
  warehouse: Warehouse,
};

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const IconComp = ICON_MAP[room.icon] || Sofa;
  const power = getRoomPower(room);
  const activeDevices = room.devices.filter((d) => d.status).length;
  const totalDevices = room.devices.length;

  return (
    <div
      className="room-card"
      id={`room-card-${room.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="room-card__header">
        <div className="room-card__icon-wrap">
          <div className="room-card__icon">
            <IconComp size={22} />
          </div>
          <div
            className={`room-card__status-dot ${
              activeDevices > 0 ? 'room-card__status-dot--active' : ''
            }`}
          />
        </div>
        <button
          className="room-card__delete"
          title="Xóa phòng"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${room.name}" và toàn bộ thiết bị bên trong không?`)) {
              useSmartHomeStore.getState().removeRoom(room.id);
            }
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h3 className="room-card__name">{room.name}</h3>

      <div className="room-card__stats">
        <div className="room-card__stat">
          <Cpu size={14} />
          <span>
            {activeDevices}/{totalDevices} thiết bị
          </span>
        </div>
        <div className="room-card__stat room-card__stat--power">
          <Zap size={14} />
          <span>{power.toFixed(1)}W</span>
        </div>
      </div>

      <div className="room-card__bars">
        {room.devices.map((d) => {
          const pct =
            d.status && power > 0
              ? Math.max(4, (getDevicePower(d) / power) * 100)
              : 4;
          return (
            <div
              key={d.id}
              className={`room-card__bar ${d.status ? 'room-card__bar--on' : ''}`}
              style={{ width: `${pct}%` }}
              title={`${d.name}: ${getDevicePower(d).toFixed(1)}W`}
            />
          );
        })}
      </div>
    </div>
  );
}
