import { SmartDevice } from './SmartDevice';
import type { DeviceData, DeviceType } from '../types';

export class SmartLock extends SmartDevice {
  private _isLocked: boolean;
  private _passcode: string;

  constructor(
    id: string,
    name: string,
    basePower: number,
    status: boolean = false,
    isOnline: boolean = true,
    isLocked: boolean = true,
    passcode: string = '0000',
  ) {
    super(id, name, basePower, status, isOnline);
    this._isLocked = isLocked;
    this._passcode = passcode;
  }

  get type(): DeviceType { return 'SmartLock'; }

  get isLocked(): boolean { return this._isLocked; }
  set isLocked(value: boolean) { this._isLocked = value; }
  get passcode(): string { return this._passcode; }
  set passcode(value: string) { this._passcode = value; }

  toggleLock(): void {
    this._isLocked = !this._isLocked;
  }

  getPowerConsumption(): number {
    if (!this._status) return 0;
    return this._basePower;
  }

  toJSON(): DeviceData {
    return {
      type: 'SmartLock',
      id: this.id,
      name: this.name,
      status: this.status,
      basePower: this.basePower,
      isOnline: this.isOnline,
      isLocked: this._isLocked,
      passcode: this._passcode,
    };
  }
}
