import type { DeviceData, RoomData } from '../types';
export * from '../types';
import { DeviceFactory } from './DeviceFactory';

export * from './SmartDevice';
export * from './SmartLight';
export * from './SmartAC';
export * from './SmartLock';
export * from './DeviceFactory';

export function getDevicePower(deviceData: DeviceData): number {
  const device = DeviceFactory.fromJSON(deviceData);
  return device.getPowerConsumption();
}

export function getRoomPower(room: RoomData): number {
  return room.devices.reduce(
    (total, device) => total + getDevicePower(device),
    0,
  );
}

export function getTotalSystemPower(rooms: RoomData[]): number {
  return rooms.reduce((total, room) => total + getRoomPower(room), 0);
}
