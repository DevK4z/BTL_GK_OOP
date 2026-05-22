import type { DeviceData, DeviceType } from '../types';

export abstract class SmartDevice {
  private readonly _id: string;
  private readonly _name: string;
  private _isOnline: boolean;

  protected _status: boolean;
  protected _basePower: number;

  constructor(
    id: string,
    name: string,
    basePower: number,
    status: boolean = false,
    isOnline: boolean = true,
  ) {
    this._id = id;
    this._name = name;
    this._basePower = basePower;
    this._status = status;
    this._isOnline = isOnline;
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get status(): boolean { return this._status; }
  get basePower(): number { return this._basePower; }
  get isOnline(): boolean { return this._isOnline; }

  set status(value: boolean) { this._status = value; }
  set isOnline(value: boolean) { this._isOnline = value; }

  abstract getPowerConsumption(): number;
  abstract get type(): DeviceType;
  abstract toJSON(): DeviceData;

  toggle(): void {
    this._status = !this._status;
  }

  toString(): string {
    return `[${this.type}] ${this._name} (${this._status ? 'BẬT' : 'TẮT'}) — ${this.getPowerConsumption().toFixed(1)}W`;
  }

  static combinePower(a: SmartDevice, b: SmartDevice): number {
    return a.getPowerConsumption() + b.getPowerConsumption();
  }
}
