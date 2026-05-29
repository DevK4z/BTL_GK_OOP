import { Zap } from 'lucide-react';
import MetricCard from '../dashboard/MetricCard';
import EnergyChart from '../dashboard/EnergyChart';
import PowerAnalytics from '../dashboard/PowerAnalytics';
import { getRoomPower } from '../../store';
import type { RoomData } from '../../types';

interface PowerViewProps {
  rooms: RoomData[];
  totalSystemPower: number;
}

export default function PowerView({ rooms, totalSystemPower }: PowerViewProps) {
  return (
    <section className="power-view">
      <div className="metrics-row">
        <MetricCard
          id="metric-total-power"
          label="Tổng Điện Năng"
          value={totalSystemPower}
          suffix="W"
          icon={Zap}
          accent="blue"
          animateValue
        />
        {rooms.map((room) => (
          <MetricCard
            key={room.id}
            id={`metric-${room.id}`}
            label={room.name}
            value={getRoomPower(room)}
            suffix="W"
            icon={Zap}
            accent="green"
            animateValue
          />
        ))}
      </div>
      <EnergyChart />
      <PowerAnalytics rooms={rooms} />
    </section>
  );
}

