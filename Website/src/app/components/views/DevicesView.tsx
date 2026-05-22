import { Plus } from 'lucide-react';
import DeviceControl from '../devices/DeviceControl';
import type { RoomData } from '../../types';

interface DevicesViewProps {
  rooms: RoomData[];
  setAddDeviceTarget: (target: { roomId: string; roomName: string } | null) => void;
}

export default function DevicesView({ rooms, setAddDeviceTarget }: DevicesViewProps) {
  return (
    <section className="devices-view">
      {rooms.map((room) => (
        <div key={room.id} className="devices-view__room">
          <div className="devices-view__room-header">
            <h3 className="devices-view__room-title">{room.name}</h3>
            <button
              className="modal-btn modal-btn--primary modal-btn--sm"
              onClick={() => setAddDeviceTarget({ roomId: room.id, roomName: room.name })}
            >
              <Plus size={14} /> Thêm
            </button>
          </div>
          <div className="devices-view__grid">
            {room.devices.map((device) => (
              <DeviceControl
                key={device.id}
                device={device}
                roomId={room.id}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
