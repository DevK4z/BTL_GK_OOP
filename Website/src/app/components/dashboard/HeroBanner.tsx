'use client';

import { Zap, Wifi, Shield, Activity, ArrowRight } from 'lucide-react';
import { useSmartHome } from '../../hooks/useSmartHome';
import { useSmartHomeStore } from '../../store';

import { useState, useEffect } from 'react';

export default function HeroBanner() {
  const { setActiveView } = useSmartHomeStore();

  const {
    totalSystemPower,
    activeDeviceCount,
    totalDeviceCount,
    onlineDeviceCount,
  } = useSmartHome();

  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('Chào bạn');
  const [emoji, setEmoji] = useState('👋');

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
    );
    setEmoji(hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙');
  }, []);

  return (
    <div className="hero-banner" id="hero-banner">

      <div className="hero-banner__orb hero-banner__orb--1" />
      <div className="hero-banner__orb hero-banner__orb--2" />
      <div className="hero-banner__orb hero-banner__orb--3" />

      <div className="hero-banner__grid" />

      <div className="hero-banner__content">
        <div className="hero-banner__text">
          <span className="hero-banner__greeting">
            {mounted ? `${emoji} ${greeting}` : '👋 Chào bạn'}
          </span>
          <h1 className="hero-banner__title">
            Smart Home
            <span className="hero-banner__title-accent"> Hub</span>
          </h1>
          <p className="hero-banner__desc">
            Quản lý ngôi nhà thông minh của bạn với giao diện hiện đại, trực quan.
            Kiểm soát mọi thiết bị chỉ với một chạm.
          </p>
          <div className="hero-banner__actions">
            <button
              className="hero-banner__cta"
              id="cta-explore"
              onClick={() => setActiveView('devices')}
            >
              Khám Phá
              <ArrowRight size={16} />
            </button>
            <button
              className="hero-banner__cta hero-banner__cta--outline"
              id="cta-oop"
              onClick={() => setActiveView('oop')}
            >
              Xem OOP Demo
            </button>
          </div>
        </div>

        <div className="hero-banner__stats">
          <div className="hero-stat">
            <div className="hero-stat__icon hero-stat__icon--blue">
              <Zap size={20} />
            </div>
            <div className="hero-stat__info">
              <span className="hero-stat__value">{totalSystemPower.toFixed(0)}<small>W</small></span>
              <span className="hero-stat__label">Điện năng</span>
            </div>
            <div className="hero-stat__spark">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75].map((h, i) => (
                <div key={i} className="hero-stat__spark-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="hero-stat">
            <div className="hero-stat__icon hero-stat__icon--green">
              <Activity size={20} />
            </div>
            <div className="hero-stat__info">
              <span className="hero-stat__value">{activeDeviceCount}<small>/{totalDeviceCount}</small></span>
              <span className="hero-stat__label">Thiết bị hoạt động</span>
            </div>
            <div className="hero-stat__ring">
              <svg viewBox="0 0 36 36" className="hero-stat__ring-svg">
                <path
                  className="hero-stat__ring-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="hero-stat__ring-fill hero-stat__ring-fill--green"
                  strokeDasharray={`${totalDeviceCount > 0 ? (activeDeviceCount / totalDeviceCount) * 100 : 0}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>

          <div className="hero-stat">
            <div className="hero-stat__icon hero-stat__icon--cyan">
              <Wifi size={20} />
            </div>
            <div className="hero-stat__info">
              <span className="hero-stat__value">{onlineDeviceCount}<small>/{totalDeviceCount}</small></span>
              <span className="hero-stat__label">Đang kết nối</span>
            </div>
            <div className="hero-stat__pulse">
              <span className="hero-stat__pulse-dot" />
              <span className="hero-stat__pulse-ring" />
              <span className="hero-stat__pulse-ring hero-stat__pulse-ring--delay" />
            </div>
          </div>

          <div className="hero-stat">
            <div className="hero-stat__icon hero-stat__icon--purple">
              <Shield size={20} />
            </div>
            <div className="hero-stat__info">
              <span className="hero-stat__value hero-stat__value--status">AN TOÀN</span>
              <span className="hero-stat__label">Bảo mật hệ thống</span>
            </div>
            <div className="hero-stat__check">✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
