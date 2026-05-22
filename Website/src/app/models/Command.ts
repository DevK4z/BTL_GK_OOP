import { useSmartHomeStore } from '../store';

export interface ICommand {
  execute(): void;
  getDescription(): string;
}

export class ToggleDeviceCommand implements ICommand {
  constructor(private roomId: string, private deviceId: string, private deviceName: string) {}

  execute(): void {
    useSmartHomeStore.getState().toggleDevice(this.roomId, this.deviceId);
  }

  getDescription(): string {
    return `Đã đổi trạng thái (bật/tắt) thiết bị: ${this.deviceName}`;
  }
}

export class ToggleLockCommand implements ICommand {
  constructor(private roomId: string, private deviceId: string, private deviceName: string) {}

  execute(): void {
    useSmartHomeStore.getState().toggleLock(this.roomId, this.deviceId);
  }

  getDescription(): string {
    return `Đã đổi trạng thái khóa: ${this.deviceName}`;
  }
}

export class TurnOnDeviceCommand implements ICommand {
  constructor(private roomId: string, private deviceId: string, private deviceName: string) {}

  execute(): void {

    const state = useSmartHomeStore.getState();
    const room = state.rooms.find(r => r.id === this.roomId);
    if (room) {
      const device = room.devices.find(d => d.id === this.deviceId);
      if (device && !device.status) {
        state.toggleDevice(this.roomId, this.deviceId);
      }
    }
  }

  getDescription(): string {
    return `Đã bật: ${this.deviceName}`;
  }
}

export class TurnOffDeviceCommand implements ICommand {
  constructor(private roomId: string, private deviceId: string, private deviceName: string) {}

  execute(): void {
    const state = useSmartHomeStore.getState();
    const room = state.rooms.find(r => r.id === this.roomId);
    if (room) {
      const device = room.devices.find(d => d.id === this.deviceId);
      if (device && device.status) {
        state.toggleDevice(this.roomId, this.deviceId);
      }
    }
  }

  getDescription(): string {
    return `Đã tắt: ${this.deviceName}`;
  }
}

export class SetACTemperatureCommand implements ICommand {
  constructor(private roomId: string, private deviceId: string, private deviceName: string, private temp: number) {}

  execute(): void {
    useSmartHomeStore.getState().updateAC(this.roomId, this.deviceId, this.temp);
  }

  getDescription(): string {
    return `Đã chỉnh nhiệt độ ${this.deviceName} thành ${this.temp}°C`;
  }
}

export class MacroCommand implements ICommand {
  private commands: ICommand[] = [];

  constructor(private macroName: string) {}

  addCommand(cmd: ICommand): void {
    this.commands.push(cmd);
  }

  execute(): void {

    for (const cmd of this.commands) {
      cmd.execute();
    }

    useSmartHomeStore.getState().addLog({
      message: `Đã kích hoạt chế độ: ${this.macroName} (${this.commands.length} tác vụ)`,
      type: 'info',
      icon: 'sparkles'
    });
  }

  getDescription(): string {
    return `Macro: ${this.macroName} gồm ${this.commands.length} lệnh con`;
  }
}

export class CommandFactory {
  static createSleepModeMacro(): MacroCommand {
    const macro = new MacroCommand("Chế độ Đi Ngủ");
    const state = useSmartHomeStore.getState();

    state.rooms.forEach(room => {
      room.devices.forEach(device => {
        if (device.type === 'SmartLight') {
           macro.addCommand(new TurnOffDeviceCommand(room.id, device.id, device.name));
        } else if (device.type === 'SmartLock') {

           if (!(device as any).isLocked) {
             macro.addCommand(new ToggleLockCommand(room.id, device.id, device.name));
           }
        } else if (device.type === 'SmartAC') {
           macro.addCommand(new SetACTemperatureCommand(room.id, device.id, device.name, 26));
        }
      });
    });

    return macro;
  }

  static createLeaveHomeMacro(): MacroCommand {
    const macro = new MacroCommand("Chế độ Ra Khỏi Nhà");
    const state = useSmartHomeStore.getState();

    state.rooms.forEach(room => {
      room.devices.forEach(device => {
        if (device.type === 'SmartLight' || device.type === 'SmartAC') {
           macro.addCommand(new TurnOffDeviceCommand(room.id, device.id, device.name));
        } else if (device.type === 'SmartLock') {
           if (!(device as any).isLocked) {
             macro.addCommand(new ToggleLockCommand(room.id, device.id, device.name));
           }
        }
      });
    });

    return macro;
  }
}
