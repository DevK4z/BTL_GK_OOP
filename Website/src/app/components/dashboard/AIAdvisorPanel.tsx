'use client';

import { useState } from 'react';
import { Bot, Zap, Check, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { useSmartHomeStore } from '../../store';
import { GoogleGenAI, Type, Schema } from '@google/genai';

interface AISuggestion {
  type: 'warning' | 'suggestion';
  title: string;
  message: string;
  actionable: boolean;
  targetDeviceId?: string;
  roomId?: string;
  suggestedAction?: 'turn_on' | 'turn_off';
}

export default function AIAdvisorPanel() {
  const { rooms, toggleDevice } = useSmartHomeStore();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tính lại tổng công suất (phương pháp đơn giản để gửi cho API)
  const totalPower = rooms.reduce((total, room) => {
    return total + room.devices.reduce((rTotal, dev) => rTotal + (dev.status ? dev.basePower : 0), 0);
  }, 0);

  const fetchAIInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Vì GitHub Pages không hỗ trợ API Routes, chúng ta gọi Gemini API trực tiếp từ Client
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        setSuggestions([
          {
            type: "warning",
            title: "Chưa cấu hình AI",
            message: "Bạn cần cung cấp NEXT_PUBLIC_GEMINI_API_KEY trong file .env.local để nhận đề xuất từ AI trên GitHub Pages.",
            actionable: false,
          }
        ]);
        throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const responseSchema: Schema = {
        type: Type.ARRAY,
        description: "Danh sách các đề xuất hoặc cảnh báo về trạng thái thiết bị trong nhà",
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "warning hoặc suggestion" },
            title: { type: Type.STRING, description: "Tiêu đề" },
            message: { type: Type.STRING, description: "Chi tiết lời khuyên" },
            actionable: { type: Type.BOOLEAN, description: "True nếu người dùng có thể thực hiện" },
            targetDeviceId: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            roomId: { type: Type.STRING }
          },
          required: ["type", "title", "message", "actionable"],
        },
      };

      const prompt = `Bạn là một AI phân tích dữ liệu nhà thông minh (Smart Home Advisor).
Dưới đây là trạng thái hiện tại của ngôi nhà:
Tổng công suất tiêu thụ: ${totalPower}W.
Cấu trúc phòng và thiết bị:
${JSON.stringify(rooms, null, 2)}

Nhiệm vụ của bạn:
1. Tìm các thiết bị đang bật mà có vẻ không hợp lý (ví dụ: đèn bật quá nhiều ở phòng ngủ, điều hòa bật quá lạnh < 22 độ).
2. Đưa ra cảnh báo nếu tổng công suất có vẻ cao so với cấu hình (vd > 3000W).
3. Gợi ý tắt các thiết bị không cần thiết.
4. Trả về đúng định dạng JSON Array. Trả về tối đa 3-4 đề xuất quan trọng nhất.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2,
        }
      });
      
      const data = JSON.parse(response.text || '[]');
      setSuggestions(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (suggestion: AISuggestion) => {
    if (suggestion.roomId && suggestion.targetDeviceId) {
      // Execute the toggle device
      toggleDevice(suggestion.roomId, suggestion.targetDeviceId);
      // Remove the suggestion after it's executed
      setSuggestions(suggestions.filter(s => s !== suggestion));
    }
  };

  return (
    <div className="activity-feed mt-6" id="ai-advisor">
      <div className="flex items-center justify-between mb-4">
        <h3 className="activity-feed__title m-0 flex items-center gap-2 text-indigo-400">
          <Bot size={18} />
          AI Smart Advisor
        </h3>
        <button
          onClick={fetchAIInsights}
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
          ) : (
            <Zap size={14} />
          )}
          {isLoading ? 'Đang phân tích...' : 'Phân tích'}
        </button>
      </div>

      <div className="space-y-3">
        {suggestions.length === 0 && !isLoading && !error && (
          <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-slate-400 text-sm">
            Bấm "Phân tích" để nhận đề xuất tối ưu từ Gemini AI.
          </div>
        )}

        {error && suggestions.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <XCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border transition-all animate-in fade-in slide-in-from-right-4 ${
              suggestion.type === 'warning' 
                ? 'bg-orange-500/10 border-orange-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                {suggestion.type === 'warning' ? (
                  <AlertTriangle size={16} className="text-orange-400" />
                ) : (
                  <AlertCircle size={16} className="text-emerald-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className={`text-sm font-semibold ${
                  suggestion.type === 'warning' ? 'text-orange-400' : 'text-emerald-400'
                }`}>
                  {suggestion.title}
                </h4>
                <p className="text-sm text-slate-300">
                  {suggestion.message}
                </p>
                
                {suggestion.actionable && (
                  <button
                    onClick={() => handleAction(suggestion)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    <Check size={14} className="text-emerald-400" />
                    Thực thi ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
