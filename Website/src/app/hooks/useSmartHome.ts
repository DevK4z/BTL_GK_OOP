

'use client';

import { useMemo } from 'react';
import { useSmartHomeStore } from '../store';
import {
  SmartDevice,
  SmartLight,
  SmartAC,
  SmartLock,
  DeviceFactory,
} from '../models';
import type { DeviceData, RoomData } from '../types';

interface SmartHomeHook {

  rooms: RoomData[];

  deviceInstances: SmartDevice[];

  totalSystemPower: number;

  activeDeviceCount: number;

  totalDeviceCount: number;

  onlineDeviceCount: number;

  toggleDevice: (roomId: string, deviceId: string) => void;

  getDeviceInstance: (deviceId: string) => SmartDevice | undefined;

  combineTwoDevices: (idA: string, idB: string) => number;
}

export function useSmartHome(): SmartHomeHook {
  const { rooms, toggleDevice: storeToggle, addLog } = useSmartHomeStore();

  const deviceInstances = useMemo<SmartDevice[]>(() => {
    const instances: SmartDevice[] = [];
    rooms.forEach((room) => {
      room.devices.forEach((deviceData: DeviceData) => {

        const instance = DeviceFactory.fromJSON(deviceData);
        instances.push(instance);
      });
    });
    return instances;
  }, [rooms]);

  const totalSystemPower = useMemo<number>(() => {
    return deviceInstances.reduce(
      (total: number, device: SmartDevice) => total + device.getPowerConsumption(),
      0,
    );
  }, [deviceInstances]);

  const activeDeviceCount = useMemo(
    () => deviceInstances.filter((d) => d.status).length,
    [deviceInstances],
  );

  const totalDeviceCount = deviceInstances.length;

  const onlineDeviceCount = useMemo(
    () => deviceInstances.filter((d) => d.isOnline).length,
    [deviceInstances],
  );

  const toggleDevice = (roomId: string, deviceId: string) => {

    const device = deviceInstances.find((d) => d.id === deviceId);
    storeToggle(roomId, deviceId);
    if (device) {
      addLog({
        message: `${device.name} ${device.status ? 'tắt' : 'bật'}`,
        type: 'info',
        icon: device.status ? 'power-off' : 'power',
      });
    }
  };

  const getDeviceInstance = (deviceId: string): SmartDevice | undefined => {
    return deviceInstances.find((d) => d.id === deviceId);
  };

  const combineTwoDevices = (idA: string, idB: string): number => {
    const deviceA = deviceInstances.find((d) => d.id === idA);
    const deviceB = deviceInstances.find((d) => d.id === idB);
    if (!deviceA || !deviceB) return 0;
    return SmartDevice.combinePower(deviceA, deviceB);
  };

  return {
    rooms,
    deviceInstances,
    totalSystemPower,
    activeDeviceCount,
    totalDeviceCount,
    onlineDeviceCount,
    toggleDevice,
    getDeviceInstance,
    combineTwoDevices,
  };
}

export { SmartDevice, SmartLight, SmartAC, SmartLock };
