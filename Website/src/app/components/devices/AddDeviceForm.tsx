'use client';

import { useState } from 'react';
import { Plus, X, Lightbulb, Thermometer, Lock, Save } from 'lucide-react';
import { useSmartHomeStore } from '../../store';
import type { DeviceType, DeviceData } from '../../types';

interface AddDeviceFormProps {
  roomId: string;
  onClose: () => void;
}

export default function AddDeviceForm({ roomId, onClose }: AddDeviceFormProps) {
  const { addDevice, addLog } = useSmartHomeStore();
  const [deviceType, setDeviceType] = useState<DeviceType>('SmartLight');
  const [name, setName] = useState('');
  const [basePower, setBasePower] = useState<number>(10);

  // SmartLight specific
  const [brightness, setBrightness] = useState<number>(100);
  const [color, setColor] = useState('White');

  // SmartAC specific
  const [temperature, setTemperature] = useState<number>(24);

  // SmartLock specific
  const [passcode, setPasscode] = useState('0000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = `D${Date.now()}`;
    const baseDevice = {
      id: newId,
      name,
      basePower,
      status: false,
      isOnline: true,
    };

    let newDevice: DeviceData;

    switch (deviceType) {
      case 'SmartLight':
        newDevice = {
          ...baseDevice,
          type: 'SmartLight',
          brightness,
          color,
        };
        break;
      case 'SmartAC':
        newDevice = {
          ...baseDevice,
          type: 'SmartAC',
          temperature,
        };
        break;
      case 'SmartLock':
        newDevice = {
          ...baseDevice,
          type: 'SmartLock',
          isLocked: true,
          passcode,
        };
        break;
      default:
        return;
    }

    addDevice(roomId, newDevice);
    addLog({
      message: `Thêm thiết bị mới: ${name}`,
      type: 'success',
      icon: 'plus',
    });
    onClose();
  };

  return (
    <div className="add-device-form bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 mt-4 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <Plus size={18} className="text-blue-400" />
          Thêm Thiết Bị Mới
        </h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">Tên thiết bị</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Đèn trần, Điều hòa..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">Công suất cơ bản (W)</label>
            <input
              type="number"
              required
              min="0"
              value={basePower}
              onChange={(e) => setBasePower(Number(e.target.value))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 block">Loại thiết bị</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDeviceType('SmartLight')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                deviceType === 'SmartLight'
                  ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <Lightbulb size={24} className="mb-2" />
              <span className="text-sm font-medium">SmartLight</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceType('SmartAC')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                deviceType === 'SmartAC'
                  ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <Thermometer size={24} className="mb-2" />
              <span className="text-sm font-medium">SmartAC</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceType('SmartLock')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                deviceType === 'SmartLock'
                  ? 'border-purple-400 bg-purple-400/10 text-purple-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <Lock size={24} className="mb-2" />
              <span className="text-sm font-medium">SmartLock</span>
            </button>
          </div>
        </div>

        {/* Polymorphic UI Section */}
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 mt-4 space-y-4">
          <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Thông số đặc thù ({deviceType})
          </h5>

          {deviceType === 'SmartLight' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-slate-300">Độ sáng: {brightness}%</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-yellow-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 block">Màu sắc</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                >
                  <option value="White">Trắng (White)</option>
                  <option value="Warm White">Trắng ấm (Warm White)</option>
                  <option value="Cool White">Trắng lạnh (Cool White)</option>
                  <option value="Daylight">Ánh sáng ban ngày (Daylight)</option>
                  <option value="RGB">Nhiều màu (RGB)</option>
                </select>
              </div>
            </div>
          )}

          {deviceType === 'SmartAC' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 block">Nhiệt độ mặc định (°C)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="16"
                    max="30"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="flex-1 accent-blue-400"
                  />
                  <span className="text-xl font-bold text-white w-12 text-center">{temperature}°C</span>
                </div>
              </div>
            </div>
          )}

          {deviceType === 'SmartLock' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 block">Mã PIN (4-6 số)</label>
                <input
                  type="password"
                  required
                  pattern="\d{4,6}"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="VD: 1234"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 tracking-[0.3em] font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            <Save size={18} />
            Lưu Thiết Bị
          </button>
        </div>
      </form>
    </div>
  );
}
