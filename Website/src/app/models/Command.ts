/**
 * ============================================================================
 * Command.ts — OOP Command Design Pattern
 * ============================================================================
 * 
 * DESIGN PATTERN: Command Pattern
 * - Đóng gói các yêu cầu (request) thành các object cụ thể.
 * - Cho phép hàng đợi (queue), ghi log, hoặc thực thi chuỗi lệnh (Macro).
 * - Hỗ trợ AI dễ dàng trigger một hoặc nhiều lệnh mà không cần biết chi tiết 
 *   về việc cập nhật State như thế nào.
 */

import { useSmartHomeStore } from '../store';

// Lấy type của Store để pass vào execute()
type AppStore = ReturnType<typeof useSmartHomeStore.getState>;

/**
 * 1. COMMAND INTERFACE
 * Tất cả các lệnh kỹ thuật đều phải implement interface này.
 */
export interface ICommand {
  execute(store: AppStore): void;
}

/**
 * 2. CONCRETE COMMANDS
 */

// Lệnh Bật/Tắt thiết bị (Dùng chung cho Đèn, AC, Khóa)
export class ToggleDeviceCommand implements ICommand {
  constructor(private roomId: string, private deviceId: string, private targetState?: boolean) {}

  execute(store: AppStore): void {
    // Nếu targetState được cung cấp, ta kiểm tra trạng thái hiện tại. 
    // Nếu không khớp mới toggle để ép về đúng targetState.
    if (this.targetState !== undefined) {
      const room = store.rooms.find(r => r.id === this.roomId);
      const device = room?.devices.find(d => d.id === this.deviceId);
      if (device && device.status !== this.targetState) {
        store.toggleDevice(this.roomId, this.deviceId);
      }
    } else {
      // Nếu không cung cấp, chỉ việc đảo ngược trạng thái (toggle)
      store.toggleDevice(this.roomId, this.deviceId);
    }
  }
}

// Lệnh Thiết lập Công suất / Nhiệt độ / Độ sáng (Numerical Value)
export class SetDeviceValueCommand implements ICommand {
  constructor(
    private roomId: string, 
    private deviceId: string, 
    private type: 'SmartLight' | 'SmartAC',
    private value: number
  ) {}

  execute(store: AppStore): void {
    if (this.type === 'SmartLight') {
      // Giữ nguyên màu hiện tại, chỉ đổi độ sáng
      const room = store.rooms.find(r => r.id === this.roomId);
      const device = room?.devices.find(d => d.id === this.deviceId);
      const color = device && 'color' in device ? device.color : 'Warm White';
      
      store.updateLight(this.roomId, this.deviceId, this.value, color);
    } else if (this.type === 'SmartAC') {
      store.updateAC(this.roomId, this.deviceId, this.value);
    }
  }
}

/**
 * 3. MACRO COMMAND (Composite Command)
 * Chứa một chuỗi các Command con để thực thi đồng loạt.
 * Phù hợp cho tính năng "Technical Routine" (Chế độ Ban đêm, Ra khỏi nhà...)
 */
export class MacroCommand implements ICommand {
  private commands: ICommand[] = [];

  constructor(commands?: ICommand[]) {
    if (commands) {
      this.commands = commands;
    }
  }

  addCommand(command: ICommand): void {
    this.commands.push(command);
  }

  removeCommand(command: ICommand): void {
    this.commands = this.commands.filter(cmd => cmd !== command);
  }

  execute(store: AppStore): void {
    console.log(`[MacroCommand] Executing ${this.commands.length} technical commands in sequence...`);
    this.commands.forEach(command => {
      command.execute(store);
    });
  }
}
