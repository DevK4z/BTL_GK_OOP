'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Brain, AlertTriangle, AlertCircle, Play, Check, RefreshCw } from 'lucide-react';
import { useSmartHome } from '../../hooks/useSmartHome';
import { useSmartHomeStore } from '../../store';

interface AIRecommendation {
  type: "warning" | "suggestion";
  title: string;
  message: string;
  actionable: boolean;
  targetDeviceId: string;
  suggestedAction: "turn_on" | "turn_off";
}

export default function AIAdvisorPanel() {
  const { deviceInstances, rooms, toggleDevice } = useSmartHome();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const plainDevices = deviceInstances.map(d => d.toJSON());
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: plainDevices })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.warn("AI API Route không khả dụng (đang chạy tĩnh trên GitHub Pages). Chuyển sang AI Advisor Engine cục bộ:", err);
      
      const localRecommendations: AIRecommendation[] = [];

      // 1. Kiểm tra Điều hòa (SmartAC) đang bật tiêu thụ nhiều điện
      const acOn = deviceInstances.find(d => d.type === 'SmartAC' && d.status);
      if (acOn) {
        localRecommendations.push({
          type: "suggestion",
          title: "Tối ưu hóa Điều Hòa (Local AI)",
          message: `Điều hòa "${acOn.name}" đang bật. Khuyên dùng nhiệt độ 26°C hoặc tắt để tiết kiệm điện.`,
          actionable: true,
          targetDeviceId: acOn.id,
          suggestedAction: "turn_off"
        });
      }

      // 2. Kiểm tra Đèn (SmartLight) đang bật
      const lightOn = deviceInstances.find(d => d.type === 'SmartLight' && d.status);
      if (lightOn) {
        localRecommendations.push({
          type: "warning",
          title: "Thiết bị chưa tắt (Local AI)",
          message: `Đèn "${lightOn.name}" đang bật. Hãy tắt bớt các thiết bị không cần thiết.`,
          actionable: true,
          targetDeviceId: lightOn.id,
          suggestedAction: "turn_off"
        });
      }

      // 3. Kiểm tra Khóa (SmartLock) đang mở khóa
      const unlockedLock = deviceInstances.find(d => {
        if (d.type === 'SmartLock') {
          return (d as any).isLocked === false;
        }
        return false;
      });
      if (unlockedLock) {
        localRecommendations.push({
          type: "warning",
          title: "Bảo mật cửa ra vào (Local AI)",
          message: `Cửa "${unlockedLock.name}" đang MỞ KHÓA. Bạn có muốn khóa cửa lại ngay không?`,
          actionable: true,
          targetDeviceId: unlockedLock.id,
          suggestedAction: "turn_on"
        });
      }

      if (localRecommendations.length === 0) {
        localRecommendations.push({
          type: "suggestion",
          title: "Hệ thống tối ưu (Local AI)",
          message: "Tất cả thiết bị đang hoạt động ở chế độ tiết kiệm năng lượng cực đại.",
          actionable: false,
          targetDeviceId: "",
          suggestedAction: "turn_off"
        });
      }

      setRecommendations(localRecommendations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchInsights();
  }, [deviceInstances.length]); // Gọi lại khi thêm/bớt thiết bị

  const handleExecute = (rec: AIRecommendation) => {
    const deviceId = rec.targetDeviceId;
    if (!deviceId) return;

    // Tìm roomId của thiết bị
    const room = rooms.find(r => r.devices.some(d => d.id === deviceId));
    if (!room) return;

    // Thực thi bật/tắt thiết bị hoặc khóa/mở khóa
    const device = deviceInstances.find(d => d.id === deviceId);
    if (device && device.type === 'SmartLock') {
      // Gọi toggleLock từ store để thay đổi trạng thái khóa thực tế
      useSmartHomeStore.getState().toggleLock(room.id, deviceId);
      useSmartHomeStore.getState().addLog({
        message: `${device.name} đã được ${rec.suggestedAction === 'turn_on' ? 'khóa' : 'mở khóa'} (AI Action)`,
        type: 'success',
        icon: rec.suggestedAction === 'turn_on' ? 'lock' : 'unlock',
      });
    } else {
      toggleDevice(room.id, deviceId);
    }

    // Kích hoạt hiệu ứng thành công tạm thời
    setSuccessId(deviceId);
    setTimeout(() => {
      setSuccessId(null);
      // Refresh lại các khuyến nghị
      fetchInsights();
    }, 1500);
  };

  return (
    <div className="bg-[#131a2e] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full filter blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-400 w-5 h-5 animate-pulse" />
          <h3 className="text-white font-semibold text-base flex items-center gap-1.5">
            Trợ Lý AI Insights
          </h3>
        </div>
        <button 
          onClick={fetchInsights} 
          disabled={loading}
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          title="Làm mới đề xuất"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3 py-2">
          <div className="h-16 bg-white/5 animate-pulse rounded-xl" />
          <div className="h-16 bg-white/5 animate-pulse rounded-xl" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          Không có đề xuất tối ưu nào vào lúc này.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const isWarning = rec.type === 'warning';
            const device = deviceInstances.find(d => d.id === rec.targetDeviceId);
            
            return (
              <div 
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-300 ${
                  isWarning 
                    ? 'bg-rose-500/5 border-rose-500/10 text-rose-200' 
                    : 'bg-blue-500/5 border-blue-500/10 text-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${isWarning ? 'bg-rose-500/10' : 'bg-blue-500/10'}`}>
                    {isWarning ? <AlertTriangle size={15} className="text-rose-400" /> : <Brain size={15} className="text-blue-400" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-white">{rec.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{rec.message}</p>
                  </div>
                </div>

                {/* Nút hành động trực quan */}
                {rec.actionable && rec.targetDeviceId && (
                  <button
                    onClick={() => handleExecute(rec)}
                    disabled={successId === rec.targetDeviceId}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                      successId === rec.targetDeviceId
                        ? 'bg-emerald-600 text-white'
                        : isWarning
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {successId === rec.targetDeviceId ? (
                      <>
                        <Check size={12} />
                        Đã thực thi
                      </>
                    ) : (
                      <>
                        <Play size={10} fill="currentColor" />
                        Thực thi ngay
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
