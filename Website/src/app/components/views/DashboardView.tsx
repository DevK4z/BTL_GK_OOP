'use client';

import { useState } from 'react';
import { Zap, Cpu, ShieldCheck, Plus, PlusCircle } from 'lucide-react';
import MetricCard from '../dashboard/MetricCard';
import HeroBanner from '../dashboard/HeroBanner';
import RoomCard from '../rooms/RoomCard';
import DeviceControl from '../devices/DeviceControl';
import ActivityFeed from '../dashboard/ActivityFeed';
import AIAdvisorPanel from '../dashboard/AIAdvisorPanel';
import EnergyChart from '../dashboard/EnergyChart';
import AddDeviceForm from '../devices/AddDeviceForm';
import type { RoomData } from '../../types';

interface DashboardViewProps {
  rooms: RoomData[];
  totalSystemPower: number;
  activeDeviceCount: number;
  totalDeviceCount: number;
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  setShowAddRoom: (show: boolean) => void;
}

export default function DashboardView({
  rooms,
  totalSystemPower,
  activeDeviceCount,
  totalDeviceCount,
  selectedRoomId,
  setSelectedRoomId,
  setShowAddRoom,
}: DashboardViewProps) {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const selectedRoom = selectedRoomId
    ? rooms.find((r) => r.id === selectedRoomId)
    : null;

  return (
    <>
      <HeroBanner />
      <section className="metrics-row" id="metrics-section">
        <MetricCard
          id="metric-power"
          label="Tổng Điện Năng"
          value={totalSystemPower}
          suffix="W"
          sublabel="Đang sử dụng"
          icon={Zap}
          accent="blue"
          animateValue
        />
        <MetricCard
          id="metric-devices"
          label="Thiết Bị Hoạt Động"
          value={`${activeDeviceCount}/${totalDeviceCount}`}
          sublabel="Đang bật"
          icon={Cpu}
          accent="green"
        />
        <MetricCard
          id="metric-status"
          label="Trạng Thái Hệ Thống"
          value="TỐI ƯU"
          sublabel="Uptime: 42 ngày 18 giờ"
          icon={ShieldCheck}
          accent="amber"
        />
      </section>

      <section className="content-grid" id="content-section">
        <div className="content-grid__main">
          <h2 className="section-title">🏠 Khu Vực Hoạt Động</h2>
          <div className="rooms-grid">
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
            <button className="add-card" onClick={() => setShowAddRoom(true)} id="add-room-overview">
              <Plus size={24} />
              <span>Thêm phòng</span>
            </button>
          </div>

          {selectedRoom && (
            <div className="room-detail" id="room-detail">
              <div className="flex items-center justify-between mb-4">
                <h3 className="room-detail__title m-0">
                  Thiết bị trong {selectedRoom.name}
                </h3>
                <button
                  onClick={() => setShowAddDevice(!showAddDevice)}
                  className="flex items-center gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusCircle size={16} />
                  Thêm thiết bị
                </button>
              </div>
              
              {showAddDevice && (
                <AddDeviceForm 
                  roomId={selectedRoom.id} 
                  onClose={() => setShowAddDevice(false)} 
                />
              )}

              <div className="room-detail__devices mt-4">
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
        </div>

        <div className="content-grid__side">
          <ActivityFeed />
          <AIAdvisorPanel />
        </div>
      </section>

      <section className="chart-section" id="chart-section">
        <EnergyChart />
      </section>
    </>
  );
}
