import { SmartDevice } from './SmartDevice';
import type { DeviceData, DeviceType } from '../types';

export class SmartAC extends SmartDevice {
  private _temperature: number;

  constructor(
    id: string,
    name: string,
    basePower: number,
    status: boolean = false,
    isOnline: boolean = true,
    temperature: number = 25,
  ) {
    super(id, name, basePower, status, isOnline);
    this._temperature = Math.max(16, Math.min(32, temperature));
  }

  get type(): DeviceType { return 'SmartAC'; }

  get temperature(): number { return this._temperature; }
  set temperature(value: number) { this._temperature = Math.max(16, Math.min(32, value)); }

  getPowerConsumption(): number {
    if (!this._status) return 0;
    const tempFactor = 1.0 + Math.abs(this._temperature - 25) * 0.05;
    return this._basePower * tempFactor;
  }

  toJSON(): DeviceData {
    return {
      type: 'SmartAC',
      id: this.id,
      name: this.name,
      status: this.status,
      basePower: this.basePower,
      isOnline: this.isOnline,
      temperature: this._temperature,
    };
  }
}
