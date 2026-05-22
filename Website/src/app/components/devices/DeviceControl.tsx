'use client';

import {
  Lightbulb,
  Thermometer,
  Lock,
  Unlock,
  Power,
  WifiOff,
  Sun,
  Snowflake,
  Trash2,
} from 'lucide-react';
import {
  type Device,
  type SmartLightDevice,
  type SmartACDevice,
  type SmartLockDevice,
  getDevicePower,
  useSmartHomeStore,
} from '../../store';

interface DeviceControlProps {
  device: Device;
  roomId: string;
}

export default function DeviceControl({ device, roomId }: DeviceControlProps) {
  const { toggleDevice, updateLight, updateAC, toggleLock, addLog, removeDevice } =
    useSmartHomeStore();

  if (!device.isOnline) {
    return (
      <div className="device-control device-control--offline" id={`device-${device.id}`}>
        <div className="device-control__header">
          <WifiOff size={18} />
          <span className="device-control__name">{device.name}</span>
          <span className="device-control__badge device-control__badge--offline">
            Mất kết nối
          </span>
        </div>
      </div>
    );
  }

  const power = getDevicePower(device);

  const handleToggle = () => {
    toggleDevice(roomId, device.id);
    addLog({
      message: `${device.name} ${device.status ? 'tắt' : 'bật'}`,
      type: 'info',
      icon: device.status ? 'power-off' : 'power',
    });
  };

  if (device.type === 'SmartLight') {
    const light = device as SmartLightDevice;
    return (
      <div
        className={`device-control device-control--light ${device.status ? 'device-control--on' : ''}`}
        id={`device-${device.id}`}
      >
        <div className="device-control__header">
          <div className={`device-control__type-icon device-control__type-icon--light`}>
            <Lightbulb size={18} />
          </div>
          <div className="device-control__info">
            <span className="device-control__name">{device.name}</span>
            <span className="device-control__power">{power.toFixed(1)}W</span>
          </div>
          <div className="device-control__actions">
            <button
              className="device-control__delete"
              title="Xóa thiết bị"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Bạn có chắc muốn xóa "${device.name}"?`)) {
                  removeDevice(roomId, device.id);
                }
              }}
            >
              <Trash2 size={15} />
            </button>
            <button
              className={`device-control__toggle ${device.status ? 'device-control__toggle--on' : ''}`}
              onClick={handleToggle}
              aria-label={`Toggle ${device.name}`}
            >
              <div className="device-control__toggle-knob" />
            </button>
          </div>
        </div>

        {device.status && (
          <div className="device-control__body">
            <div className="device-control__slider-group">
              <Sun size={14} />
              <input
                type="range"
                min={0}
                max={100}
                value={light.brightness}
                onChange={(e) =>
                  updateLight(roomId, device.id, Number(e.target.value), light.color)
                }
                className="device-control__slider"
              />
              <span className="device-control__slider-value">{light.brightness}%</span>
            </div>
            <div className="device-control__color-row">
              {['Warm White', 'Cool White', 'Daylight', 'Sunset'].map((c) => (
                <button
                  key={c}
                  className={`device-control__color-chip ${light.color === c ? 'device-control__color-chip--active' : ''}`}
                  onClick={() => {
                    updateLight(roomId, device.id, light.brightness, c);
                    addLog({ message: `${device.name} → ${c}`, type: 'info', icon: 'palette' });
                  }}
                  data-color={c}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (device.type === 'SmartAC') {
    const ac = device as SmartACDevice;
    return (
      <div
        className={`device-control device-control--ac ${device.status ? 'device-control--on' : ''}`}
        id={`device-${device.id}`}
      >
        <div className="device-control__header">
          <div className="device-control__type-icon device-control__type-icon--ac">
            <Snowflake size={18} />
          </div>
          <div className="device-control__info">
            <span className="device-control__name">{device.name}</span>
            <span className="device-control__power">{power.toFixed(1)}W</span>
          </div>
          <div className="device-control__actions">
            <button
              className="device-control__delete"
              title="Xóa thiết bị"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Bạn có chắc muốn xóa "${device.name}"?`)) {
                  removeDevice(roomId, device.id);
                }
              }}
            >
              <Trash2 size={15} />
            </button>
            <button
              className={`device-control__toggle ${device.status ? 'device-control__toggle--on' : ''}`}
              onClick={handleToggle}
              aria-label={`Toggle ${device.name}`}
            >
              <div className="device-control__toggle-knob" />
            </button>
          </div>
        </div>

        {device.status && (
          <div className="device-control__body device-control__body--ac">
            <div className="device-control__temp-display">
              <Thermometer size={20} />
              <span className="device-control__temp-value">
                {ac.temperature.toFixed(1)}
              </span>
              <span className="device-control__temp-unit">°C</span>
            </div>
            <div className="device-control__temp-controls">
              <button
                className="device-control__temp-btn"
                onClick={() => {
                  const newTemp = Math.max(16, ac.temperature - 0.5);
                  updateAC(roomId, device.id, newTemp);
                  addLog({ message: `${device.name} → ${newTemp}°C`, type: 'info', icon: 'thermometer' });
                }}
              >
                −
              </button>
              <button
                className="device-control__temp-btn"
                onClick={() => {
                  const newTemp = Math.min(32, ac.temperature + 0.5);
                  updateAC(roomId, device.id, newTemp);
                  addLog({ message: `${device.name} → ${newTemp}°C`, type: 'info', icon: 'thermometer' });
                }}
              >
                +
              </button>
            </div>
            <span className="device-control__mode-label">
              {ac.temperature < 25 ? '❄️ Làm mát' : ac.temperature > 25 ? '🔥 Sưởi ấm' : '🌿 Eco'}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (device.type === 'SmartLock') {
    const lock = device as SmartLockDevice;
    return (
      <div
        className={`device-control device-control--lock ${lock.isLocked ? '' : 'device-control--unlocked'}`}
        id={`device-${device.id}`}
      >
        <div className="device-control__header">
          <div className={`device-control__type-icon device-control__type-icon--lock ${lock.isLocked ? '' : 'device-control__type-icon--unlocked'}`}>
            {lock.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </div>
          <div className="device-control__info">
            <span className="device-control__name">{device.name}</span>
            <span className="device-control__power">{power.toFixed(1)}W</span>
          </div>
          <div className="device-control__actions">
            <button
              className="device-control__delete"
              title="Xóa thiết bị"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Bạn có chắc muốn xóa "${device.name}"?`)) {
                  removeDevice(roomId, device.id);
                }
              }}
            >
              <Trash2 size={15} />
            </button>
            <button
              className={`device-control__toggle ${device.status ? 'device-control__toggle--on' : ''}`}
              onClick={handleToggle}
              aria-label={`Toggle ${device.name}`}
            >
              <div className="device-control__toggle-knob" />
            </button>
          </div>
        </div>

        <div className="device-control__body device-control__body--lock">
          <div className={`device-control__lock-ring ${lock.isLocked ? 'device-control__lock-ring--locked' : 'device-control__lock-ring--unlocked'}`}>
            {lock.isLocked ? <Lock size={28} /> : <Unlock size={28} />}
          </div>
          <div className="device-control__lock-actions">
            <button
              className={`device-control__lock-btn ${lock.isLocked ? 'device-control__lock-btn--active' : ''}`}
              onClick={() => {
                if (!lock.isLocked) {
                  toggleLock(roomId, device.id);
                  addLog({ message: `${device.name} đã khóa`, type: 'success', icon: 'lock' });
                }
              }}
            >
              <Lock size={14} /> Khóa
            </button>
            <button
              className={`device-control__lock-btn ${!lock.isLocked ? 'device-control__lock-btn--active' : ''}`}
              onClick={() => {
                if (lock.isLocked) {
                  toggleLock(roomId, device.id);
                  addLog({ message: `${device.name} mở khóa`, type: 'success', icon: 'unlock' });
                }
              }}
            >
              <Unlock size={14} /> Mở
            </button>
          </div>
          <span className={`device-control__lock-status ${lock.isLocked ? '' : 'device-control__lock-status--open'}`}>
            {lock.isLocked ? '🔒 Đã bảo mật' : '🔓 Đang mở'}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
