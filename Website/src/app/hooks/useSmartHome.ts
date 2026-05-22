/**
 * ====================================================================
 *  SMART HOME HUB — CUSTOM HOOK (Controller / Bridge Layer)
 * ====================================================================
 *
 *  Hook `useSmartHome` là cầu nối giữa:
 *    - MODEL LAYER (OOP classes: SmartDevice, SmartLight, ...)
 *    - VIEW LAYER (React components)
 *    - STORE LAYER (Zustand + localStorage)
 *
 *  CHỨC NĂNG CHÍNH:
 *  ────────────────
 *  1. HYDRATION (Rehydrate):
 *     Chuyển Plain Object (JSON) từ Zustand store → OOP class instance.
 *     Sau khi hydrate, object có đầy đủ prototype chain → gọi được
 *     các method OOP (getPowerConsumption, toggle, toString, ...).
 *
 *  2. ĐA HÌNH (Polymorphism) trong getTotalSystemPower():
 *     Duyệt mảng SmartDevice[] (base type), mỗi phần tử tự động
 *     gọi đúng getPowerConsumption() của lớp con.
 *
 *  3. NẠP CHỒNG TOÁN TỬ (Operator Overloading):
 *     SmartDevice.combinePower(deviceA, deviceB) mô phỏng operator+.
 *
 *  4. FACTORY METHOD:
 *     SmartDevice.fromJSON(data) tạo đúng lớp con từ discriminator type.
 *
 * ====================================================================
 */

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

// ─────────────────────────────────────────────────────────────────────
//  INTERFACE — Dữ liệu trả về từ Hook
// ─────────────────────────────────────────────────────────────────────

interface SmartHomeHook {
  /** Danh sách phòng (Plain Object, từ Zustand store) */
  rooms: RoomData[];

  /** Tất cả thiết bị đã hydrate thành OOP instances */
  deviceInstances: SmartDevice[];

  /** Tổng công suất hệ thống (W) — tính qua đa hình */
  totalSystemPower: number;

  /** Số thiết bị đang BẬT */
  activeDeviceCount: number;

  /** Tổng số thiết bị */
  totalDeviceCount: number;

  /** Số thiết bị đang online */
  onlineDeviceCount: number;

  /** Bật/tắt thiết bị + ghi log */
  toggleDevice: (roomId: string, deviceId: string) => void;

  /** Lấy OOP instance của một thiết bị cụ thể */
  getDeviceInstance: (deviceId: string) => SmartDevice | undefined;

  /**
   * Demo Nạp chồng toán tử: cộng công suất 2 thiết bị
   * @returns Tổng W của 2 thiết bị, hoặc 0 nếu không tìm thấy
   */
  combineTwoDevices: (idA: string, idB: string) => number;
}

// ─────────────────────────────────────────────────────────────────────
//  CUSTOM HOOK
// ─────────────────────────────────────────────────────────────────────

/**
 * Custom Hook — useSmartHome()
 *
 * Khởi tạo OOP instances từ dữ liệu Zustand store bằng từ khóa `new`
 * thông qua Factory Method `SmartDevice.fromJSON()`.
 *
 * Mỗi khi store thay đổi (toggle, update), hook tự động:
 *   1. Re-hydrate JSON → OOP instances (useMemo)
 *   2. Tính lại tổng công suất qua đa hình
 *   3. Cập nhật UI tự động (React reactivity)
 */
export function useSmartHome(): SmartHomeHook {
  const { rooms, toggleDevice: storeToggle, addLog } = useSmartHomeStore();

  // ── HYDRATION: JSON → OOP Class Instances ─────────────────────
  //
  // useMemo đảm bảo chỉ re-hydrate khi `rooms` thực sự thay đổi.
  // SmartDevice.fromJSON() sử dụng Factory Method Pattern:
  //   - type === 'SmartLight' → new SmartLight(...)
  //   - type === 'SmartAC'    → new SmartAC(...)
  //   - type === 'SmartLock'  → new SmartLock(...)
  //
  const deviceInstances = useMemo<SmartDevice[]>(() => {
    const instances: SmartDevice[] = [];
    rooms.forEach((room) => {
      room.devices.forEach((deviceData: DeviceData) => {
        // Factory Method: tạo đúng class con từ discriminator `type`
        const instance = DeviceFactory.fromJSON(deviceData);
        instances.push(instance);
      });
    });
    return instances;
  }, [rooms]);

  // ── ĐA HÌNH: Tính tổng công suất hệ thống ────────────────────
  //
  // Duyệt mảng SmartDevice[] (kiểu base class).
  // Mỗi phần tử gọi getPowerConsumption() → Late Binding:
  //   - SmartLight → basePower × (brightness / 100)
  //   - SmartAC    → basePower × (1 + |temp - 25| × 0.05)
  //   - SmartLock  → basePower (cố định)
  //
  const totalSystemPower = useMemo<number>(() => {
    return deviceInstances.reduce(
      (total: number, device: SmartDevice) => total + device.getPowerConsumption(),
      0,
    );
  }, [deviceInstances]);

  // ── Thống kê thiết bị ──────────────────────────────────────────
  const activeDeviceCount = useMemo(
    () => deviceInstances.filter((d) => d.status).length,
    [deviceInstances],
  );

  const totalDeviceCount = deviceInstances.length;

  const onlineDeviceCount = useMemo(
    () => deviceInstances.filter((d) => d.isOnline).length,
    [deviceInstances],
  );

  // ── Toggle + Log ───────────────────────────────────────────────
  const toggleDevice = (roomId: string, deviceId: string) => {
    // Tìm device hiện tại để biết trạng thái cũ (cho log message)
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

  // ── Lấy instance theo ID ───────────────────────────────────────
  const getDeviceInstance = (deviceId: string): SmartDevice | undefined => {
    return deviceInstances.find((d) => d.id === deviceId);
  };

  // ── NẠP CHỒNG TOÁN TỬ (Operator Overloading Simulation) ──────
  //
  // Mô phỏng operator+ từ C++:
  //   float total = deviceA + deviceB;
  // Trong TypeScript:
  //   const total = SmartDevice.combinePower(deviceA, deviceB);
  //
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

// ── Re-export OOP classes cho components cần truy cập trực tiếp ──
export { SmartDevice, SmartLight, SmartAC, SmartLock };
