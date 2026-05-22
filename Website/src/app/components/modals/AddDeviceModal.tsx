'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Lightbulb, Snowflake, Lock } from 'lucide-react';
import { useSmartHomeStore } from '../../store';
import type { DeviceData, DeviceType } from '../../models';
import { SmartLight, SmartAC, SmartLock } from '../../models';

const DEVICE_TYPES: { value: DeviceType; label: string; Icon: typeof Lightbulb; desc: string }[] = [
  { value: 'SmartLight', label: 'Đèn thông minh', Icon: Lightbulb, desc: 'Điều chỉnh độ sáng & màu sắc' },
  { value: 'SmartAC', label: 'Điều hòa', Icon: Snowflake, desc: 'Điều chỉnh nhiệt độ 16–32°C' },
  { value: 'SmartLock', label: 'Khóa thông minh', Icon: Lock, desc: 'Khóa/mở từ xa bằng mã PIN' },
];

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export default function AddDeviceModal({ open, onClose, roomId, roomName }: AddDeviceModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { addDevice, addLog } = useSmartHomeStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('SmartLight');
  const [basePower, setBasePower] = useState(60);

  const [brightness, setBrightness] = useState(100);
  const [color, setColor] = useState('Warm White');
  const [temperature, setTemperature] = useState(25);
  const [passcode, setPasscode] = useState('0000');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleTypeChange = (newType: DeviceType) => {
    setType(newType);
    switch (newType) {
      case 'SmartLight': setBasePower(60); break;
      case 'SmartAC': setBasePower(1200); break;
      case 'SmartLock': setBasePower(5); break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const deviceId = `D-${Date.now()}`;

    let device: DeviceData;
    switch (type) {
      case 'SmartLight':
        device = new SmartLight(deviceId, name.trim(), basePower, true, true, brightness, color).toJSON();
        break;
      case 'SmartAC':
        device = new SmartAC(deviceId, name.trim(), basePower, true, true, temperature).toJSON();
        break;
      case 'SmartLock':
        device = new SmartLock(deviceId, name.trim(), basePower, true, true, true, passcode).toJSON();
        break;
    }

    addDevice(roomId, device);
    addLog({
      message: `Thêm ${name.trim()} vào ${roomName}`,
      type: 'success',
      icon: type === 'SmartLight' ? 'lightbulb' : type === 'SmartAC' ? 'thermometer' : 'lock',
    });

    setName('');
    setType('SmartLight');
    setBasePower(60);
    setBrightness(100);
    setColor('Warm White');
    setTemperature(25);
    setPasscode('0000');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog__content">
        <div className="modal-dialog__header">
          <h2 className="modal-dialog__title">
            <Plus size={20} />
            Thêm Thiết Bị — {roomName}
          </h2>
          <button className="modal-dialog__close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-dialog__body">

          <div className="modal-field">
            <label className="modal-field__label">Loại thiết bị</label>
            <div className="modal-type-grid">
              {DEVICE_TYPES.map(({ value, label, Icon: IconComp, desc }) => (
                <button
                  key={value}
                  type="button"
                  className={`modal-type-btn ${type === value ? 'modal-type-btn--active' : ''}`}
                  onClick={() => handleTypeChange(value)}
                >
                  <IconComp size={22} />
                  <span className="modal-type-btn__label">{label}</span>
                  <span className="modal-type-btn__desc">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-field__label" htmlFor="device-name">
              Tên thiết bị
            </label>
            <input
              id="device-name"
              type="text"
              className="modal-field__input"
              placeholder={
                type === 'SmartLight'
                  ? 'VD: Đèn trần phòng khách'
                  : type === 'SmartAC'
                    ? 'VD: Điều hòa Daikin'
                    : 'VD: Khóa cửa chính'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal-field">
            <label className="modal-field__label" htmlFor="device-power">
              Công suất cơ bản (W)
            </label>
            <input
              id="device-power"
              type="number"
              className="modal-field__input"
              min={1}
              max={5000}
              value={basePower}
              onChange={(e) => setBasePower(Number(e.target.value))}
            />
          </div>

          {type === 'SmartLight' && (
            <>
              <div className="modal-field">
                <label className="modal-field__label">
                  Độ sáng: {brightness}%
                </label>
                <input
                  type="range"
                  className="modal-field__slider"
                  min={0}
                  max={100}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
              </div>
              <div className="modal-field">
                <label className="modal-field__label">Màu sắc</label>
                <div className="modal-color-row">
                  {['Warm White', 'Cool White', 'Daylight', 'Sunset'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`modal-color-chip ${color === c ? 'modal-color-chip--active' : ''}`}
                      onClick={() => setColor(c)}
                      data-color={c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'SmartAC' && (
            <div className="modal-field">
              <label className="modal-field__label">
                Nhiệt độ mặc định: {temperature}°C
              </label>
              <input
                type="range"
                className="modal-field__slider"
                min={16}
                max={32}
                step={0.5}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </div>
          )}

          {type === 'SmartLock' && (
            <div className="modal-field">
              <label className="modal-field__label" htmlFor="device-passcode">
                Mã PIN
              </label>
              <input
                id="device-passcode"
                type="text"
                className="modal-field__input"
                placeholder="VD: 1234"
                maxLength={8}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          <div className="modal-dialog__actions">
            <button type="button" className="modal-btn modal-btn--cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="modal-btn modal-btn--primary" disabled={!name.trim()}>
              <Plus size={16} />
              Thêm Thiết Bị
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
