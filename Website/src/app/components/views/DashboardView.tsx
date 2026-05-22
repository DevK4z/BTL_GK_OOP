'use client';

import { useState } from 'react';
import { Zap, Cpu, ShieldCheck, Plus, Lightbulb, Snowflake, Lock } from 'lucide-react';
import MetricCard from '../dashboard/MetricCard';
import HeroBanner from '../dashboard/HeroBanner';
import RoomCard from '../rooms/RoomCard';
import DeviceControl from '../devices/DeviceControl';
import ActivityFeed from '../dashboard/ActivityFeed';
import EnergyChart from '../dashboard/EnergyChart';
import AIAdvisorPanel from '../dashboard/AIAdvisorPanel';
import { useSmartHomeStore } from '../../store';
import { SmartLight, SmartAC, SmartLock } from '../../models';
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
  const { addDevice, addLog } = useSmartHomeStore();
  const selectedRoom = selectedRoomId
    ? rooms.find((r) => r.id === selectedRoomId)
    : null;

  // Form State cho "Thêm Thiết Bị Nhanh" (Polymorphic UI)
  const [formRoomId, setFormRoomId] = useState(rooms[0]?.id || '');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'SmartLight' | 'SmartAC' | 'SmartLock'>('SmartLight');
  const [basePower, setBasePower] = useState(60);

  // Dynamic States
  const [brightness, setBrightness] = useState(100);
  const [color, setColor] = useState('Warm White');
  const [temperature, setTemperature] = useState(25);
  const [passcode, setPasscode] = useState('0000');

  const handleTypeChange = (type: 'SmartLight' | 'SmartAC' | 'SmartLock') => {
    setDeviceType(type);
    if (type === 'SmartLight') setBasePower(60);
    else if (type === 'SmartAC') setBasePower(1200);
    else if (type === 'SmartLock') setBasePower(5);
  };

  const handleAddDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim() || !formRoomId) return;

    const deviceId = `D-${Date.now()}`;
    let newDeviceInstance;

    // OOP Polymorphism & Encapsulation:
    // Tạo đối tượng thực tế bằng "new" để kiểm tra tính hợp lệ dữ liệu (đóng gói)
    // trước khi đưa vào Database/Zustand Store.
    if (deviceType === 'SmartLight') {
      newDeviceInstance = new SmartLight(deviceId, deviceName.trim(), basePower, true, true, brightness, color);
    } else if (deviceType === 'SmartAC') {
      newDeviceInstance = new SmartAC(deviceId, deviceName.trim(), basePower, true, true, temperature);
    } else {
      newDeviceInstance = new SmartLock(deviceId, deviceName.trim(), basePower, true, true, true, passcode);
    }

    addDevice(formRoomId, newDeviceInstance.toJSON());

    // Thêm vào Activity Log
    const targetRoom = rooms.find(r => r.id === formRoomId);
    addLog({
      message: `Thêm thiết bị "${deviceName.trim()}" vào ${targetRoom?.name || 'phòng'}`,
      type: 'success',
      icon: deviceType === 'SmartLight' ? 'lightbulb' : deviceType === 'SmartAC' ? 'thermometer' : 'lock'
    });

    // Reset Form
    setDeviceName('');
    setBrightness(100);
    setColor('Warm White');
    setTemperature(25);
    setPasscode('0000');
  };

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
          label="Trạng Thế Hệ Thống"
          value="TỐI ƯU"
          sublabel="Uptime: 42 ngày 18 giờ"
          icon={ShieldCheck}
          accent="amber"
        />
      </section>

      <section className="content-grid" id="content-section">
        <div className="content-grid__main space-y-6">
          
          {/* Khu Vực Hoạt Động */}
          <div>
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
              <button className="add-card cursor-pointer" onClick={() => setShowAddRoom(true)} id="add-room-overview">
                <Plus size={24} />
                <span>Thêm phòng</span>
              </button>
            </div>
          </div>

          {/* Form Thêm Thiết Bị Nhanh (Polymorphic UI) */}
          <div className="bg-[#131a2e] border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-400" />
              Thêm Thiết Bị Nhanh (Polymorphic UI Form)
            </h3>
            
            <form onSubmit={handleAddDeviceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {/* Chọn Phòng */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Chọn Phòng nhận thiết bị</label>
                  <select 
                    value={formRoomId}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full bg-[#0f1525] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Chọn Loại Thiết Bị */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Loại thiết bị</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'SmartLight', label: 'Đèn', Icon: Lightbulb },
                      { type: 'SmartAC', label: 'Điều hòa', Icon: Snowflake },
                      { type: 'SmartLock', label: 'Khóa', Icon: Lock },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleTypeChange(item.type as any)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          deviceType === item.type 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                            : 'bg-[#0f1525] border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <item.Icon size={16} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tên Thiết Bị */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Tên thiết bị</label>
                  <input
                    type="text"
                    required
                    placeholder="Tên thiết bị..."
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="w-full bg-[#0f1525] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Phân thân Đa Hình của Form (Polymorphic inputs) */}
              <div className="flex flex-col justify-between space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Công suất cơ bản (W)</label>
                  <input
                    type="number"
                    required
                    value={basePower}
                    onChange={(e) => setBasePower(Number(e.target.value))}
                    className="w-full bg-[#0f1525] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Phần input đa hình động */}
                <div className="p-3 bg-[#0f1525] border border-white/5 rounded-xl flex-grow flex flex-col justify-center">
                  {deviceType === 'SmartLight' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 flex justify-between">
                          <span>Độ sáng</span>
                          <span className="text-blue-400 font-bold">{brightness}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={brightness}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="w-full accent-blue-500 mt-1 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Màu sắc</label>
                        <select
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full bg-[#131a2e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="Warm White">Warm White</option>
                          <option value="Cool White">Cool White</option>
                          <option value="Daylight">Daylight</option>
                          <option value="Sunset">Sunset</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {deviceType === 'SmartAC' && (
                    <div>
                      <label className="text-xs text-gray-400 flex justify-between">
                        <span>Nhiệt độ cài đặt</span>
                        <span className="text-emerald-400 font-bold">{temperature}°C</span>
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="32"
                        step="0.5"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full accent-emerald-500 mt-1 cursor-pointer"
                      />
                    </div>
                  )}

                  {deviceType === 'SmartLock' && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Mã PIN bảo mật</label>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="VD: 1234"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-[#131a2e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-sm font-semibold select-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={16} />
                  Xác nhận Thêm Thiết Bị
                </button>
              </div>
            </form>
          </div>

          {selectedRoom && (
            <div className="room-detail" id="room-detail">
              <h3 className="room-detail__title">
                Thiết bị trong {selectedRoom.name}
              </h3>
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
        </div>

        <div className="content-grid__side space-y-6">
          <AIAdvisorPanel />
          <ActivityFeed />
        </div>
      </section>

      <section className="chart-section" id="chart-section">
        <EnergyChart />
      </section>
    </>
  );
}
