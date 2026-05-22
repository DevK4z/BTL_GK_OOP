import { SmartDevice } from './SmartDevice';
import type { DeviceData, DeviceType } from '../types';

export class SmartLight extends SmartDevice {
  private _brightness: number;
  private _color: string;

  constructor(
    id: string,
    name: string,
    basePower: number,
    status: boolean = false,
    isOnline: boolean = true,
    brightness: number = 100,
    color: string = 'Warm White',
  ) {
    super(id, name, basePower, status, isOnline);
    this._brightness = Math.max(0, Math.min(100, brightness));
    this._color = color;
  }

  get type(): DeviceType { return 'SmartLight'; }

  get brightness(): number { return this._brightness; }
  set brightness(value: number) { this._brightness = Math.max(0, Math.min(100, value)); }
  get color(): string { return this._color; }
  set color(value: string) { this._color = value; }

  getPowerConsumption(): number {
    if (!this._status) return 0;
    return this._basePower * (this._brightness / 100);
  }

  toJSON(): DeviceData {
    return {
      type: 'SmartLight',
      id: this.id,
      name: this.name,
      status: this.status,
      basePower: this.basePower,
      isOnline: this.isOnline,
      brightness: this._brightness,
      color: this._color,
    };
  }
}
