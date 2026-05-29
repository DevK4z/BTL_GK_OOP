

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  SmartDevice,
  SmartLight,
  SmartAC,
  SmartLock,
  getDevicePower as oopGetDevicePower,
  getRoomPower as oopGetRoomPower,
  getTotalSystemPower as oopGetTotalPower,
} from './models';
import type { DeviceData, DeviceType, RoomData, ActivityLog, SmartLightDevice, SmartACDevice, SmartLockDevice } from './types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type { DeviceData as Device, DeviceType, RoomData as Room, ActivityLog, SmartLightDevice, SmartACDevice, SmartLockDevice };

export const getDevicePower = oopGetDevicePower;
export const getRoomPower = oopGetRoomPower;
export const getTotalSystemPower = oopGetTotalPower;

function createInitialRooms(): RoomData[] {

  const livingRoom: SmartDevice[] = [
    new SmartLight('D1', 'Đèn trần', 60, true, true, 80, 'Warm White'),
    new SmartLight('D2', 'Đèn bàn', 25, true, true, 60, 'Cool White'),
    new SmartAC('D3', 'Điều hòa', 1200, true, true, 22),
    new SmartLock('D4', 'Khóa cửa chính', 5, true, true, true, '1234'),
  ];

  const kitchen: SmartDevice[] = [
    new SmartLight('D5', 'Đèn bếp', 40, true, true, 100, 'Daylight'),
    new SmartAC('D6', 'Điều hòa bếp', 800, false, true, 25),
  ];

  const bedroom: SmartDevice[] = [
    new SmartLight('D7', 'Đèn ngủ', 15, false, true, 30, 'Sunset'),
    new SmartAC('D8', 'Điều hòa phòng ngủ', 900, true, true, 24),
    new SmartLock('D9', 'Khóa phòng ngủ', 5, true, true, false, '5678'),
  ];

  const garage: SmartDevice[] = [
    new SmartLight('D10', 'Đèn gara', 100, true, true, 100, 'Daylight'),
    new SmartLock('D11', 'Khóa gara', 5, true, true, true, '0000'),
  ];

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.group('🔌 ĐA HÌNH (Polymorphism) — getPowerConsumption()');
    const allDevices = [...livingRoom, ...kitchen, ...bedroom, ...garage];
    allDevices.forEach((d) => {
      console.log(`  ${d.toString()}`);
    });

    console.groupEnd();
    console.group('➕ NẠP CHỒNG TOÁN TỬ — SmartDevice.combinePower()');
    const light = livingRoom[0]; 
    const ac = livingRoom[2]; 
    console.log(`  ${light.name} + ${ac.name} = ${SmartDevice.combinePower(light, ac).toFixed(1)}W`);
    console.groupEnd();
  }

  return [
    { id: 'room-1', name: 'Phòng Khách', icon: 'sofa', devices: livingRoom.map((d) => d.toJSON()) },
    { id: 'room-2', name: 'Nhà Bếp', icon: 'cooking-pot', devices: kitchen.map((d) => d.toJSON()) },
    { id: 'room-3', name: 'Phòng Ngủ', icon: 'bed-double', devices: bedroom.map((d) => d.toJSON()) },
    { id: 'room-4', name: 'Gara', icon: 'warehouse', devices: garage.map((d) => d.toJSON()) },
  ];
}

const INITIAL_LOGS: ActivityLog[] = [
  { id: 'log-1', message: 'Khóa cửa chính đã khóa', timestamp: '2 phút trước', type: 'success', icon: 'lock' },
  { id: 'log-2', message: 'Điều hòa phòng khách đặt 22°C', timestamp: '5 phút trước', type: 'info', icon: 'thermometer' },
  { id: 'log-3', message: 'Đèn bếp bật - 100%', timestamp: '12 phút trước', type: 'info', icon: 'lightbulb' },
  { id: 'log-4', message: 'Đèn ngủ tắt', timestamp: '18 phút trước', type: 'info', icon: 'lightbulb-off' },
  { id: 'log-5', message: 'Hệ thống cập nhật firmware', timestamp: '1 giờ trước', type: 'warning', icon: 'refresh-cw' },
  { id: 'log-6', message: 'Khóa phòng ngủ mở khóa', timestamp: '2 giờ trước', type: 'success', icon: 'unlock' },
];

let logCounter = INITIAL_LOGS.length;

interface SmartHomeStore {
  hubName: string;
  rooms: RoomData[];
  activityLogs: ActivityLog[];
  sidebarCollapsed: boolean;
  activeView: string;
  apiKey: string;
  chatHistory: ChatMessage[];

  toggleDevice: (roomId: string, deviceId: string) => void;
  updateLight: (roomId: string, deviceId: string, brightness: number, color: string) => void;
  updateAC: (roomId: string, deviceId: string, temperature: number) => void;
  toggleLock: (roomId: string, deviceId: string) => void;
  setOnline: (roomId: string, deviceId: string, online: boolean) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveView: (view: string) => void;
  setApiKey: (key: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;

  addRoom: (name: string, icon: string) => string;
  removeRoom: (roomId: string) => void;
  addDevice: (roomId: string, device: DeviceData) => void;
  removeDevice: (roomId: string, deviceId: string) => void;
}

export const useSmartHomeStore = create<SmartHomeStore>()(
  persist(
    (set) => ({
      hubName: 'Smart Home Hub',
      rooms: createInitialRooms(),
      activityLogs: INITIAL_LOGS,
      sidebarCollapsed: false,
      activeView: 'overview',
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
      chatHistory: [],

      toggleDevice: (roomId, deviceId) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: room.devices.map((d) =>
                    d.id === deviceId ? { ...d, status: !d.status } : d,
                  ),
                }
              : room,
          ),
        })),

      updateLight: (roomId, deviceId, brightness, color) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: room.devices.map((d) =>
                    d.id === deviceId && d.type === 'SmartLight'
                      ? { ...d, brightness: Math.max(0, Math.min(100, brightness)), color }
                      : d,
                  ),
                }
              : room,
          ),
        })),

      updateAC: (roomId, deviceId, temperature) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: room.devices.map((d) =>
                    d.id === deviceId && d.type === 'SmartAC'
                      ? { ...d, temperature }
                      : d,
                  ),
                }
              : room,
          ),
        })),

      toggleLock: (roomId, deviceId) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: room.devices.map((d) =>
                    d.id === deviceId && d.type === 'SmartLock'
                      ? { ...d, isLocked: !d.isLocked }
                      : d,
                  ),
                }
              : room,
          ),
        })),

      setOnline: (roomId, deviceId, online) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: room.devices.map((d) =>
                    d.id === deviceId ? { ...d, isOnline: online } : d,
                  ),
                }
              : room,
          ),
        })),

      addLog: (log) =>
        set((state) => {
          logCounter++;
          const newLog: ActivityLog = {
            ...log,
            id: `log-${logCounter}`,
            timestamp: new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          };
          return { activityLogs: [newLog, ...state.activityLogs].slice(0, 30) };
        }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setActiveView: (view) => set({ activeView: view }),
      setApiKey: (key) => set({ apiKey: key }),
      addChatMessage: (msg) => set((state) => ({
        chatHistory: [...state.chatHistory, {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }]
      })),
      clearChatHistory: () => set({ chatHistory: [] }),

      addRoom: (name, icon) => {
        const newId = `room-${Date.now()}`;
        const newRoom: RoomData = { id: newId, name, icon, devices: [] };
        set((state) => ({ rooms: [...state.rooms, newRoom] }));
        return newId;
      },

      removeRoom: (roomId) =>
        set((state) => ({
          rooms: state.rooms.filter((r) => r.id !== roomId),
        })),

      addDevice: (roomId, device) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? { ...room, devices: [...room.devices, device] }
              : room,
          ),
        })),

      removeDevice: (roomId, deviceId) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? { ...room, devices: room.devices.filter((d) => d.id !== deviceId) }
              : room,
          ),
        })),
    }),
    {
      name: 'smart-home-hub-storage', 
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        rooms: state.rooms,
        activityLogs: state.activityLogs,
        apiKey: state.apiKey,
        chatHistory: state.chatHistory,
      }),
    },
  ),
);
