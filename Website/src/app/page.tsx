'use client';

import { Clock } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import AddRoomModal from './components/modals/AddRoomModal';
import AddDeviceModal from './components/modals/AddDeviceModal';
import DashboardView from './components/views/DashboardView';
import RoomsView from './components/views/RoomsView';
import DevicesView from './components/views/DevicesView';
import PowerView from './components/views/PowerView';
import LogsView from './components/views/LogsView';
import OOPView from './components/views/OOPView';
import { useSmartHomeStore } from './store';
import { useSmartHome } from './hooks/useSmartHome';
import { useState } from 'react';

export default function Home() {
  const { sidebarCollapsed, activeView } = useSmartHomeStore();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [addDeviceTarget, setAddDeviceTarget] = useState<{ roomId: string; roomName: string } | null>(null);

  const {
    rooms,
    totalSystemPower,
    activeDeviceCount,
    totalDeviceCount,
  } = useSmartHome();

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'app-layout--collapsed' : ''}`}>
      <Sidebar />

      <main className="main-content" id="main-content">
        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-header__title">
              {activeView === 'overview' && 'Tổng Quan Hệ Thống'}
              {activeView === 'rooms' && 'Quản Lý Phòng'}
              {activeView === 'devices' && 'Quản Lý Thiết Bị'}
              {activeView === 'power' && 'Phân Tích Điện Năng'}
              {activeView === 'logs' && 'Nhật Ký Hệ Thống'}
              {activeView === 'oop' && 'OOP Architecture'}
            </h1>
            <p className="page-header__subtitle">Smart Home Hub • BTL Giữa Kỳ OOP</p>
          </div>
          <div className="page-header__time">
            <Clock size={14} />
            <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {activeView === 'overview' && (
          <DashboardView
            rooms={rooms}
            totalSystemPower={totalSystemPower}
            activeDeviceCount={activeDeviceCount}
            totalDeviceCount={totalDeviceCount}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            setShowAddRoom={setShowAddRoom}
          />
        )}

        {activeView === 'rooms' && (
          <RoomsView
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            setShowAddRoom={setShowAddRoom}
            setAddDeviceTarget={setAddDeviceTarget}
          />
        )}

        {activeView === 'devices' && (
          <DevicesView
            rooms={rooms}
            setAddDeviceTarget={setAddDeviceTarget}
          />
        )}

        {activeView === 'power' && (
          <PowerView
            rooms={rooms}
            totalSystemPower={totalSystemPower}
          />
        )}

        {activeView === 'logs' && <LogsView />}
        
        {activeView === 'oop' && <OOPView />}
      </main>

      {/* ===== MODALS ===== */}
      <AddRoomModal
        open={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        onSuccess={(roomId, roomName) => {
          setAddDeviceTarget({ roomId, roomName });
        }}
      />
      {addDeviceTarget && (
        <AddDeviceModal
          open={!!addDeviceTarget}
          onClose={() => setAddDeviceTarget(null)}
          roomId={addDeviceTarget.roomId}
          roomName={addDeviceTarget.roomName}
        />
      )}
    </div>
  );
}

