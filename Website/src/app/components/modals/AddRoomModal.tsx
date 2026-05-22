'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Sofa,
  CookingPot,
  BedDouble,
  Warehouse,
  Bath,
  BookOpen,
  Monitor,
  TreePine,
  Plus,
} from 'lucide-react';
import { useSmartHomeStore } from '../../store';

const ROOM_ICONS = [
  { value: 'sofa', label: 'Phòng khách', Icon: Sofa },
  { value: 'cooking-pot', label: 'Nhà bếp', Icon: CookingPot },
  { value: 'bed-double', label: 'Phòng ngủ', Icon: BedDouble },
  { value: 'warehouse', label: 'Gara', Icon: Warehouse },
  { value: 'bath', label: 'Phòng tắm', Icon: Bath },
  { value: 'book-open', label: 'Phòng học', Icon: BookOpen },
  { value: 'monitor', label: 'Phòng làm việc', Icon: Monitor },
  { value: 'tree-pine', label: 'Sân vườn', Icon: TreePine },
];

interface AddRoomModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (roomId: string, roomName: string) => void;
}

export default function AddRoomModal({ open, onClose, onSuccess }: AddRoomModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { addRoom, addLog } = useSmartHomeStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('sofa');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newRoomId = addRoom(name.trim(), icon);
    addLog({
      message: `Thêm phòng mới: ${name.trim()}`,
      type: 'success',
      icon: 'power',
    });

    const roomName = name.trim();
    setName('');
    setIcon('sofa');
    onClose();

    if (onSuccess) {
      onSuccess(newRoomId, roomName);
    }
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
            Thêm Phòng Mới
          </h2>
          <button className="modal-dialog__close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-dialog__body">

          <div className="modal-field">
            <label className="modal-field__label" htmlFor="room-name">
              Tên phòng
            </label>
            <input
              id="room-name"
              type="text"
              className="modal-field__input"
              placeholder="VD: Phòng khách tầng 2..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal-field">
            <label className="modal-field__label">Biểu tượng</label>
            <div className="modal-icon-grid">
              {ROOM_ICONS.map(({ value, label, Icon: IconComp }) => (
                <button
                  key={value}
                  type="button"
                  className={`modal-icon-btn ${icon === value ? 'modal-icon-btn--active' : ''}`}
                  onClick={() => setIcon(value)}
                  title={label}
                >
                  <IconComp size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-dialog__actions">
            <button type="button" className="modal-btn modal-btn--cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="modal-btn modal-btn--primary" disabled={!name.trim()}>
              <Plus size={16} />
              Thêm Phòng
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
