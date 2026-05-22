'use client';

import { Code2, ArrowRight, Lightbulb, Zap, Combine } from 'lucide-react';

export default function OOPDemoView() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-4">
          <Code2 size={36} className="text-blue-400" />
          OOP Demo: C++ vs TypeScript
        </h1>
        <p className="text-slate-300 text-lg leading-relaxed">
          Phần này giải thích cách tư duy Lập trình Hướng đối tượng (OOP) từ mã nguồn gốc C++
          được chuyển đổi và áp dụng vào dự án Web (TypeScript) như thế nào.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Tính Trừu tượng và Kế thừa */}
        <section className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center gap-2">
            <Lightbulb className="text-yellow-400" size={20} />
            <h2 className="text-xl font-semibold text-white m-0">1. Tính Trừu tượng (Abstraction) & Kế thừa (Inheritance)</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">C++ Core (Original)</h3>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-blue-300 border border-slate-800">
                <pre>{`class Device {
protected:
    std::string id_;
    std::string name_;
    bool status_;
    double base_power_;
public:
    virtual void operate() = 0;
    virtual double get_power_consumption() = 0;
};

class SmartLight : public Device {
    int brightness_;
public:
    double get_power_consumption() override {
        if (!status_) return 0.0;
        return base_power_ * (brightness_ / 100.0);
    }
};`}</pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">TypeScript (Next.js)</h3>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-emerald-300 border border-slate-800">
                <pre>{`export abstract class SmartDevice {
  protected _id: string;
  protected _status: boolean;
  protected _basePower: number;

  abstract getPowerConsumption(): number;
}

export class SmartLight extends SmartDevice {
  private _brightness: number;

  getPowerConsumption(): number {
    if (!this.status) return 0.0;
    return this.basePower * (this._brightness / 100.0);
  }
}`}</pre>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-800/30 border-t border-slate-700/50 text-slate-300 text-sm leading-relaxed">
            <strong className="text-white">Giải thích:</strong> Lớp <code className="text-pink-400 bg-pink-400/10 px-1 rounded">Device</code> trong C++ được trừu tượng hóa bằng từ khóa <code className="text-pink-400 bg-pink-400/10 px-1 rounded">virtual ... = 0</code>. Trong TypeScript, chúng ta sử dụng <code className="text-pink-400 bg-pink-400/10 px-1 rounded">abstract class</code> và <code className="text-pink-400 bg-pink-400/10 px-1 rounded">abstract</code> method để đạt được mục đích tương tự. Các lớp con bắt buộc phải cài đặt lại (override) phương thức tính toán điện năng theo công thức đặc thù của mình.
          </div>
        </section>

        {/* Tính Đa hình */}
        <section className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center gap-2">
            <Zap className="text-purple-400" size={20} />
            <h2 className="text-xl font-semibold text-white m-0">2. Tính Đa hình (Polymorphism) & Quản lý bộ nhớ</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">C++ std::shared_ptr</h3>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-blue-300 border border-slate-800">
                <pre>{`class Room {
    std::vector<std::shared_ptr<Device>> devices_;

public:
    double getRoomPower() const {
        double total = 0.0;
        // Đa hình: gọi đúng hàm của lớp con
        for (const auto &dev : devices_) {
            total += dev->get_power_consumption();
        }
        return total;
    }
};`}</pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">TypeScript Late Binding</h3>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-emerald-300 border border-slate-800">
                <pre>{`// Trong useSmartHome hook
const totalSystemPower = useMemo(() => {
  // devices[] chứa các instance của SmartLight, SmartAC...
  return deviceInstances.reduce(
    (total, device: SmartDevice) => 
      total + device.getPowerConsumption(), 0
  );
}, [deviceInstances]);`}</pre>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-800/30 border-t border-slate-700/50 text-slate-300 text-sm leading-relaxed">
            <strong className="text-white">Giải thích:</strong> C++ sử dụng <code className="text-pink-400 bg-pink-400/10 px-1 rounded">std::shared_ptr&lt;Device&gt;</code> để chứa các lớp con trong cùng một mảng (vector) và tự động giải phóng bộ nhớ (Smart Pointer). TypeScript là ngôn ngữ có Garbage Collector (GC) nên không cần quản lý bộ nhớ thủ công. Cả hai ngôn ngữ đều thực hiện <strong>Late Binding</strong>: Mặc dù duyệt qua mảng kiểu Base, hàm <code className="text-pink-400 bg-pink-400/10 px-1 rounded">get_power_consumption()</code> được gọi là của đối tượng thực sự (Đèn, Điều hòa, Khóa).
          </div>
        </section>

        {/* Nạp chồng toán tử */}
        <section className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center gap-2">
            <Combine className="text-orange-400" size={20} />
            <h2 className="text-xl font-semibold text-white m-0">3. Nạp chồng toán tử (Operator Overloading)</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">C++ Operator Overloading</h3>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-blue-300 border border-slate-800">
                <pre>{`class Device {
    // ...
    friend double operator+(const Device &a, const Device &b) {
        return a.get_power_const() + b.get_power_const();
    }
};

// Sử dụng
double sum = dev1 + dev2;`}</pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">TypeScript Static Method</h3>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm font-mono text-emerald-300 border border-slate-800">
                <pre>{`export abstract class SmartDevice {
  // ...
  // TS không hỗ trợ nạp chồng toán tử (+), 
  // dùng static method làm phương án thay thế
  static combinePower(a: SmartDevice, b: SmartDevice) {
    return a.getPowerConsumption() + b.getPowerConsumption();
  }
}

// Sử dụng
const sum = SmartDevice.combinePower(dev1, dev2);`}</pre>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-800/30 border-t border-slate-700/50 text-slate-300 text-sm leading-relaxed">
            <strong className="text-white">Giải thích:</strong> C++ cho phép định nghĩa lại ý nghĩa của toán tử <code className="text-pink-400 bg-pink-400/10 px-1 rounded">+</code> thông qua <code className="text-pink-400 bg-pink-400/10 px-1 rounded">operator+</code>, giúp code ngắn gọn (<code className="text-pink-400 bg-pink-400/10 px-1 rounded">dev1 + dev2</code>). Tuy nhiên, <strong>TypeScript/JavaScript không hỗ trợ Operator Overloading</strong>. Để mô phỏng tính năng này đúng theo triết lý OOP, chúng ta sử dụng <code className="text-pink-400 bg-pink-400/10 px-1 rounded">static method</code> trên class Base.
          </div>
        </section>
      </div>
    </div>
  );
}
