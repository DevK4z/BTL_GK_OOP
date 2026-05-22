'use client';

import { useState } from 'react';
import { Code2, FileCode, GitBranch, Layers } from 'lucide-react';

const CODE_TABS = [
  {
    id: 'device',
    label: 'Device (Base)',
    code: `class Device {
protected:
    std::string id_;
    std::string name_;
    bool status_;
    double base_power_;
    bool is_online_;
public:
    virtual void operate() = 0;
    virtual double get_power_consumption() = 0;
    virtual std::string get_info() const = 0;

    // Operator overloading
    friend double operator+(
        const Device &a, const Device &b) {
        return a.get_power_const()
             + b.get_power_const();
    }
};`,
  },
  {
    id: 'smartlight',
    label: 'SmartLight',
    code: `class SmartLight : public Device {
private:
    int brightness_;
    std::string color_;
public:
    void operate() override {
        check_connection();
        status_ = !status_;
    }
    double get_power_consumption() override {
        if (!status_) return 0.0;
        return base_power_
             * (brightness_ / 100.0);
    }
};`,
  },
  {
    id: 'smartac',
    label: 'SmartAC',
    code: `class SmartAC : public Device {
private:
    double temperature_;
public:
    void operate() override {
        check_connection();
        status_ = !status_;
    }
    double get_power_consumption() override {
        if (!status_) return 0.0;
        return base_power_
          * (1.0 + abs(temperature_ - 25.0)
             * 0.05);
    }
};`,
  },
  {
    id: 'smartlock',
    label: 'SmartLock',
    code: `class SmartLock : public Device {
private:
    bool is_locked_;
    std::string passcode_;
public:
    void operate() override {
        check_connection();
        is_locked_ = !is_locked_;
    }
    bool unlock(const std::string &code) {
        check_connection();
        if (code == passcode_) {
            is_locked_ = false;
            return true;
        }
        return false;
    }
};`,
  },
  {
    id: 'room',
    label: 'Room & Hub',
    code: `class Room {
    std::string room_name_;
    std::vector<shared_ptr<Device>> devices_;
public:
    void addDevice(shared_ptr<Device> dev);
    double getRoomPower() const;
};

class SmartHomeHub {
    std::string hub_name_;
    std::vector<Room> rooms_;
public:
    void addRoom(const Room &room);
    double getTotalPower() const;
    void saveStateToFile(
        const std::string &filename) const;
};`,
  },
];

const OOP_CONCEPTS = [
  {
    icon: '🧬',
    title: 'Kế thừa (Inheritance)',
    desc: 'SmartLight, SmartAC, SmartLock kế thừa từ lớp cơ sở Device',
    highlight: 'class SmartLight : public Device',
  },
  {
    icon: '🔄',
    title: 'Đa hình (Polymorphism)',
    desc: 'Hàm ảo operate(), get_power_consumption() được override ở lớp con',
    highlight: 'virtual void operate() = 0',
  },
  {
    icon: '📦',
    title: 'Đóng gói (Encapsulation)',
    desc: 'Dữ liệu protected/private, truy cập qua getter/setter',
    highlight: 'protected: string id_',
  },
  {
    icon: '🧱',
    title: 'Trừu tượng (Abstraction)',
    desc: 'Device là abstract class với pure virtual functions',
    highlight: '= 0 (pure virtual)',
  },
  {
    icon: '➕',
    title: 'Nạp chồng toán tử',
    desc: 'operator+ cộng điện năng 2 thiết bị bất kỳ',
    highlight: 'friend double operator+',
  },
  {
    icon: '⚠️',
    title: 'Xử lý ngoại lệ',
    desc: 'ConnectionException khi thiết bị mất kết nối',
    highlight: 'throw ConnectionException',
  },
];

export default function OOPShowcase() {
  const [activeTab, setActiveTab] = useState('device');
  const activeCode = CODE_TABS.find((t) => t.id === activeTab)?.code || '';

  return (
    <div className="oop-showcase" id="oop-showcase">
      <div className="oop-showcase__header">
        <Code2 size={22} />
        <h2 className="oop-showcase__title">OOP Architecture Showcase</h2>
        <span className="oop-showcase__badge">C++ | BTL Giữa Kỳ</span>
      </div>

      {/* Class Diagram */}
      <div className="oop-showcase__diagram">
        <div className="oop-diagram">
          {/* Exception */}
          <div className="oop-diagram__node oop-diagram__node--exception">
            <span className="oop-diagram__node-label">std::exception</span>
          </div>
          <div className="oop-diagram__arrow oop-diagram__arrow--exception">↑</div>
          <div className="oop-diagram__node oop-diagram__node--exception-child">
            <span className="oop-diagram__node-label">ConnectionException</span>
          </div>

          {/* Main Hierarchy */}
          <div className="oop-diagram__main">
            <div className="oop-diagram__node oop-diagram__node--abstract">
              <span className="oop-diagram__node-tag">abstract</span>
              <span className="oop-diagram__node-label">Device</span>
            </div>
            <div className="oop-diagram__branches">
              <div className="oop-diagram__branch">
                <div className="oop-diagram__arrow">↑</div>
                <div className="oop-diagram__node oop-diagram__node--light">
                  <span className="oop-diagram__node-label">SmartLight</span>
                </div>
              </div>
              <div className="oop-diagram__branch">
                <div className="oop-diagram__arrow">↑</div>
                <div className="oop-diagram__node oop-diagram__node--ac">
                  <span className="oop-diagram__node-label">SmartAC</span>
                </div>
              </div>
              <div className="oop-diagram__branch">
                <div className="oop-diagram__arrow">↑</div>
                <div className="oop-diagram__node oop-diagram__node--lock">
                  <span className="oop-diagram__node-label">SmartLock</span>
                </div>
              </div>
            </div>

            {/* Aggregation */}
            <div className="oop-diagram__aggregation">
              <div className="oop-diagram__node oop-diagram__node--room">
                <span className="oop-diagram__node-label">Room</span>
                <span className="oop-diagram__node-sub">vector&lt;Device*&gt;</span>
              </div>
              <div className="oop-diagram__arrow">◇</div>
              <div className="oop-diagram__node oop-diagram__node--hub">
                <span className="oop-diagram__node-label">SmartHomeHub</span>
                <span className="oop-diagram__node-sub">vector&lt;Room&gt;</span>
              </div>
            </div>
          </div>

          {/* Logger */}
          <div className="oop-diagram__utility">
            <div className="oop-diagram__node oop-diagram__node--utility">
              <span className="oop-diagram__node-tag">utility</span>
              <span className="oop-diagram__node-label">Logger</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Tabs + OOP Concepts side by side */}
      <div className="oop-showcase__content">
        {/* Code viewer */}
        <div className="oop-showcase__code">
          <div className="oop-showcase__tabs">
            {CODE_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`oop-showcase__tab ${activeTab === tab.id ? 'oop-showcase__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <FileCode size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="oop-showcase__code-block">
            <pre>
              <code>{activeCode}</code>
            </pre>
          </div>
        </div>

        {/* OOP Concepts */}
        <div className="oop-showcase__concepts">
          <h3 className="oop-showcase__concepts-title">
            <Layers size={16} />
            Các Khái Niệm OOP
          </h3>
          {OOP_CONCEPTS.map((concept, i) => (
            <div key={i} className="oop-concept">
              <span className="oop-concept__icon">{concept.icon}</span>
              <div className="oop-concept__text">
                <strong className="oop-concept__title">{concept.title}</strong>
                <span className="oop-concept__desc">{concept.desc}</span>
                <code className="oop-concept__highlight">{concept.highlight}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
