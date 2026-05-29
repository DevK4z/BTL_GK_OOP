'use client';

import {
  LayoutDashboard,
  Home,
  Cpu,
  BarChart3,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Zap,
  Code2,
  Box,
} from 'lucide-react';
import { useSmartHomeStore } from '../../store';

const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng Quan', icon: LayoutDashboard },
  { id: 'rooms', label: 'Phòng', icon: Home },
  { id: 'devices', label: 'Thiết Bị', icon: Cpu },
  { id: 'power', label: 'Điện Năng', icon: BarChart3 },
  { id: 'logs', label: 'Nhật Ký', icon: ScrollText },
  { id: 'oop', label: 'OOP Demo', icon: Code2 },
  { id: '3d', label: 'Mô Hình 3D', icon: Box },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, activeView, setActiveView } =
    useSmartHomeStore();

  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}
      id="main-sidebar"
    >

      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <Zap size={22} />
        </div>
        {!sidebarCollapsed && (
          <span className="sidebar__logo-text">SmartHub</span>
        )}
      </div>

      {!sidebarCollapsed && (
        <div className="sidebar__status">
          <span className="sidebar__status-dot" />
          <span className="sidebar__status-label">Hệ thống hoạt động</span>
        </div>
      )}

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        className="sidebar__toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        id="btn-toggle-sidebar"
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
