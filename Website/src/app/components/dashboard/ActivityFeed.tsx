'use client';

import {
  Lock,
  Unlock,
  Thermometer,
  Lightbulb,
  LightbulbOff,
  RefreshCw,
  Power,
  PowerOff,
  Palette,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useSmartHomeStore } from '../../store';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  lock: Lock,
  unlock: Unlock,
  thermometer: Thermometer,
  lightbulb: Lightbulb,
  'lightbulb-off': LightbulbOff,
  'refresh-cw': RefreshCw,
  power: Power,
  'power-off': PowerOff,
  palette: Palette,
};

const TYPE_STYLES: Record<string, string> = {
  info: 'activity-item--info',
  warning: 'activity-item--warning',
  error: 'activity-item--error',
  success: 'activity-item--success',
};

export default function ActivityFeed() {
  const { activityLogs } = useSmartHomeStore();

  return (
    <div className="activity-feed" id="activity-feed">
      <h3 className="activity-feed__title">
        <RefreshCw size={16} className="activity-feed__title-icon" />
        Hoạt Động Gần Đây
      </h3>
      <div className="activity-feed__list">
        {activityLogs.map((log) => {
          const IconComp = ICON_MAP[log.icon] || Info;
          return (
            <div
              key={log.id}
              className={`activity-item ${TYPE_STYLES[log.type] || ''}`}
            >
              <div className="activity-item__icon">
                <IconComp size={15} />
              </div>
              <div className="activity-item__content">
                <span className="activity-item__message">{log.message}</span>
                <span className="activity-item__time">{log.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
