import type { DeviceData } from '../types';
import { SmartDevice } from './SmartDevice';
import { SmartLight } from './SmartLight';
import { SmartAC } from './SmartAC';
import { SmartLock } from './SmartLock';

export class DeviceFactory {
  static fromJSON(data: DeviceData): SmartDevice {
    switch (data.type) {
      case 'SmartLight':
        return new SmartLight(
          data.id,
          data.name,
          data.basePower,
          data.status,
          data.isOnline,
          data.brightness ?? 100,
          data.color ?? 'Warm White',
        );
      case 'SmartAC':
        return new SmartAC(
          data.id,
          data.name,
          data.basePower,
          data.status,
          data.isOnline,
          data.temperature ?? 25,
        );
      case 'SmartLock':
        return new SmartLock(
          data.id,
          data.name,
          data.basePower,
          data.status,
          data.isOnline,
          data.isLocked ?? true,
          data.passcode ?? '0000',
        );
      default:
        throw new Error(
          `[DeviceFactory.fromJSON] Unknown device type: ${(data as DeviceData).type}`,
        );
    }
  }
}
