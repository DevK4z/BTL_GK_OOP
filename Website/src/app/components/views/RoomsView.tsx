import { Plus } from 'lucide-react';
import RoomCard from '../rooms/RoomCard';
import DeviceControl from '../devices/DeviceControl';
import type { RoomData } from '../../types';

interface RoomsViewProps {
  rooms: RoomData[];
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  setShowAddRoom: (show: boolean) => void;
  setAddDeviceTarget: (target: { roomId: string; roomName: string } | null) => void;
}

export default function RoomsView({
  rooms,
  selectedRoomId,
  setSelectedRoomId,
  setShowAddRoom,
  setAddDeviceTarget,
}: RoomsViewProps) {
  const selectedRoom = selectedRoomId
    ? rooms.find((r) => r.id === selectedRoomId)
    : null;

  return (
    <section className="rooms-view">
      <div className="rooms-grid rooms-grid--full">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onClick={() =>
              setSelectedRoomId(
                selectedRoomId === room.id ? null : room.id
              )
            }
          />
        ))}
        <button className="add-card" onClick={() => setShowAddRoom(true)} id="add-room-rooms">
          <Plus size={24} />
          <span>Thêm phòng</span>
        </button>
      </div>
      {selectedRoom && (
        <div className="room-detail" id="room-detail-rooms">
          <div className="room-detail__header">
            <h3 className="room-detail__title">
              Thiết bị trong {selectedRoom.name}
            </h3>
            <button
              className="modal-btn modal-btn--primary modal-btn--sm"
              onClick={() => setAddDeviceTarget({ roomId: selectedRoom.id, roomName: selectedRoom.name })}
            >
              <Plus size={14} /> Thêm thiết bị
            </button>
          </div>
          <div className="room-detail__devices">
            {selectedRoom.devices.map((device) => (
              <DeviceControl
                key={device.id}
                device={device}
                roomId={selectedRoom.id}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
