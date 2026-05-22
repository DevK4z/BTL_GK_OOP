'use client';

import { useState } from 'react';
import { Code2, FileCode, GitBranch, Layers, ArrowRight } from 'lucide-react';

const COMPARISON_TABS = [
  {
    id: 'abstract',
    label: 'Abstract Class & Polymorphism',
    desc: 'Lớp trừu tượng và Đa hình trong việc tính toán điện năng của thiết bị.',
    cpp: `// C++: Lớp trừu tượng và Đa hình
class Device {
protected:
    std::string id_;
    std::string name_;
    bool status_;
    double base_power_;
public:
    // Phương thức thuần ảo (pure virtual function)
    virtual double get_power_consumption() = 0; 
};

class SmartLight : public Device {
private:
    int brightness_;
public:
    // Nạp chồng (Override) phương thức lớp cha
    double get_power_consumption() override {
        if (!status_) return 0.0;
        return base_power_ * (brightness_ / 100.0);
    }
};`,
    ts: `// TypeScript: Lớp trừu tượng và Đa hình
export abstract class SmartDevice {
  protected _status: boolean;
  protected _basePower: number;

  // Phương thức trừu tượng (abstract method)
  abstract getPowerConsumption(): number;
}

export class SmartLight extends SmartDevice {
  private _brightness: number;

  // Nạp chồng (Override) tương tự C++
  getPowerConsumption(): number {
    if (!this._status) return 0;
    return this._basePower * (this._brightness / 100);
  }
}`
  },
  {
    id: 'pointers',
    label: 'std::shared_ptr vs References',
    desc: 'Quản lý danh sách thiết bị đa hình trong phòng/nhà.',
    cpp: `// C++: Dùng smart pointer quản lý đa hình tránh rò rỉ bộ nhớ
class Room {
private:
    std::string room_name_;
    // Quản lý đa hình qua con trỏ thông minh (shared_ptr)
    std::vector<std::shared_ptr<Device>> devices_;
public:
    double getRoomPower() const {
        double total = 0.0;
        for (const auto &dev : devices_) {
            // Liên kết động (Late Binding) gọi hàm thực tế của lớp con
            total += dev->get_power_consumption(); 
        }
        return total;
    }
};`,
    ts: `// TypeScript: Quản lý con trỏ tham chiếu tự động (Garbage Collection)
export interface RoomData {
  id: string;
  name: string;
  devices: DeviceData[]; // Raw JSON từ LocalStorage/DB
}

// Hydration trong custom Hook useSmartHome.ts
const deviceInstances = rooms.map(room => {
  return room.devices.map(deviceData => {
    // Khôi phục đối tượng thực tế có prototype để gọi hàm đa hình
    return DeviceFactory.fromJSON(deviceData);
  });
});`
  },
  {
    id: 'operator',
    label: 'Operator+ Overloading',
    desc: 'Nạp chồng toán tử cộng công suất tiêu thụ của 2 thiết bị.',
    cpp: `// C++: Nạp chồng toán tử +
class Device {
public:
    // Cho phép cộng trực tiếp: deviceA + deviceB
    friend double operator+(const Device &a, const Device &b) {
        return a.get_power_const() + b.get_power_const();
    }
protected:
    virtual double get_power_const() const = 0;
};

// Sử dụng:
double total = *light + *ac;`,
    ts: `// TypeScript: Không hỗ trợ Operator Overloading nguyên bản
export abstract class SmartDevice {
  abstract getPowerConsumption(): number;

  // Mô phỏng nạp chồng toán tử bằng Static Method
  static combinePower(a: SmartDevice, b: SmartDevice): number {
    return a.getPowerConsumption() + b.getPowerConsumption();
  }
}

// Sử dụng:
const total = SmartDevice.combinePower(light, ac);`
  }
];

const OOP_CONCEPTS = [
  {
    icon: '🧬',
    title: 'Kế thừa (Inheritance)',
    desc: 'Lớp con kế thừa thuộc tính và phương thức từ base class.',
    cppCode: 'class SmartLight : public Device',
    tsCode: 'class SmartLight extends SmartDevice'
  },
  {
    icon: '🔄',
    title: 'Đa hình (Polymorphism)',
    desc: 'Gọi cùng một phương thức nhưng hoạt động khác nhau tùy đối tượng.',
    cppCode: 'virtual double get_power_consumption() = 0',
    tsCode: 'abstract getPowerConsumption(): number'
  },
  {
    icon: '📦',
    title: 'Đóng gói (Encapsulation)',
    desc: 'Bảo vệ dữ liệu bằng phạm vi truy cập private/protected.',
    cppCode: 'protected: std::string id_;',
    tsCode: 'private readonly _id: string;'
  },
  {
    icon: '🧱',
    title: 'Trừu tượng (Abstraction)',
    desc: 'Ẩn đi chi tiết cài đặt phức tạp, chỉ hiển thị giao diện cần thiết.',
    cppCode: 'class Device { ... = 0; };',
    tsCode: 'export abstract class SmartDevice'
  }
];

export default function OOPShowcase() {
  const [activeTab, setActiveTab] = useState('abstract');
  const activeComparison = COMPARISON_TABS.find((t) => t.id === activeTab) || COMPARISON_TABS[0];

  return (
    <div className="bg-[#131a2e] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden" id="oop-showcase">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <Code2 size={24} className="text-blue-400" />
          <div>
            <h2 className="text-white font-bold text-lg">OOP Architecture & Bridge Pattern</h2>
            <p className="text-xs text-gray-400">So sánh kiến trúc OOP giữa C++ Core và TypeScript Frontend</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
            C++ Engine
          </span>
          <ArrowRight size={12} className="text-gray-400" />
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
            TypeScript UI
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {COMPARISON_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl select-none cursor-pointer transition-all border ${
              activeTab === tab.id
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#0f1525] border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-400 bg-white/5 px-3 py-2.5 rounded-xl mb-4 border border-white/5 leading-relaxed">
        {activeComparison.desc}
      </div>

      {/* Code Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* C++ Code */}
        <div className="rounded-xl overflow-hidden border border-white/5 bg-[#0f1525]">
          <div className="bg-white/5 px-4 py-2 text-xs font-bold text-blue-400 border-b border-white/5">
            C++ Core Logic
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto text-gray-300 leading-relaxed max-h-[350px]">
            <code>{activeComparison.cpp}</code>
          </pre>
        </div>

        {/* TS Code */}
        <div className="rounded-xl overflow-hidden border border-white/5 bg-[#0f1525]">
          <div className="bg-white/5 px-4 py-2 text-xs font-bold text-amber-400 border-b border-white/5">
            TypeScript Frontend (Hydrated Model)
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto text-gray-300 leading-relaxed max-h-[350px]">
            <code>{activeComparison.ts}</code>
          </pre>
        </div>
      </div>

      {/* 4 OOP Pillars Details */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Layers size={16} className="text-blue-400" />
          Ánh Xạ 4 Tính Chất OOP Cốt Lõi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OOP_CONCEPTS.map((concept, idx) => (
            <div key={idx} className="p-3.5 bg-[#0f1525] border border-white/5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{concept.icon}</span>
                  <span className="text-white font-semibold text-xs">{concept.title}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{concept.desc}</p>
              </div>
              <div className="space-y-1.5 border-t border-white/5 pt-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-blue-400 font-semibold font-mono">C++</span>
                  <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded font-mono">{concept.cppCode}</code>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-400 font-semibold font-mono">TS</span>
                  <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded font-mono">{concept.tsCode}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
