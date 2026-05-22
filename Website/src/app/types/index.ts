export type DeviceType = 'SmartLight' | 'SmartAC' | 'SmartLock';

export interface DeviceData {
  type: DeviceType;
  id: string;
  name: string;
  status: boolean;
  basePower: number;
  isOnline: boolean;

  brightness?: number;
  color?: string;

  temperature?: number;

  isLocked?: boolean;
  passcode?: string;
}

export type SmartLightDevice = DeviceData & { type: 'SmartLight'; brightness: number; color: string };
export type SmartACDevice = DeviceData & { type: 'SmartAC'; temperature: number };
export type SmartLockDevice = DeviceData & { type: 'SmartLock'; isLocked: boolean; passcode: string };

export interface RoomData {
  id: string;
  name: string;
  icon: string;
  devices: DeviceData[];
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  icon: string;
}

export type Device = DeviceData;
export type Room = RoomData;
