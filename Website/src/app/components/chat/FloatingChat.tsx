/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, KeyRound, Sparkles, Paperclip, Smile } from 'lucide-react';
import { useSmartHomeStore } from '../../store';
import { chatWithGemini } from '../../utils/geminiApi';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Trạng thái từ Zustand store
  const { 
    apiKey, 
    setApiKey, 
    chatHistory, 
    addChatMessage, 
    rooms, 
    toggleDevice,
    toggleLock,
    addLog
  } = useSmartHomeStore();

  const [tempApiKey, setTempApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  // Xử lý lệnh JSON được Gemini trả về
  const executeCommands = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.commands)) {
        data.commands.forEach((cmd: any) => {
          const { action, deviceId } = cmd;
          if (!deviceId) return;

          // Tìm roomId
          const room = rooms.find(r => r.devices.some(d => d.id === deviceId));
          if (!room) return;
          
          const device = room.devices.find(d => d.id === deviceId);
          if (!device) return;

          if (device.type === 'SmartLock') {
            // Đối với khóa thì toggleLock
            if (action === 'turn_on' || action === 'turn_off' || action === 'toggle') {
               // SmartLock dùng hàm toggleLock riêng biệt
               toggleLock(room.id, deviceId);
               addLog({
                  message: `AI đã ${action === 'turn_on' ? 'khóa' : 'mở'} ${device.name}`,
                  type: 'info',
                  icon: 'bot'
               });
            }
          } else {
             // Với đèn hoặc điều hòa
             toggleDevice(room.id, deviceId);
             addLog({
                message: `AI đã bật/tắt ${device.name}`,
                type: 'info',
                icon: 'bot'
             });
          }
        });
      }
    } catch (e) {
      console.error("Lỗi khi parse lệnh từ AI:", e);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    if (!apiKey) {
      // Nếu chưa có API key thì lưu API key
      if (input.trim().startsWith('AIza')) {
        setApiKey(input.trim());
        addChatMessage({
          role: 'assistant',
          content: 'Đã lưu API Key thành công! Xin chào 👋 Tôi có thể giúp gì cho bạn hôm nay?'
        });
        setInput('');
      } else {
        addChatMessage({
          role: 'user',
          content: input
        });
        addChatMessage({
          role: 'assistant',
          content: 'Vui lòng nhập API Key hợp lệ (bắt đầu bằng AIza...) để sử dụng tính năng này.'
        });
        setInput('');
      }
      return;
    }

    const userMessage = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsTyping(true);

    try {
      // Lấy toàn bộ lịch sử (bao gồm tin nhắn user vừa thêm)
      const currentHistory = useSmartHomeStore.getState().chatHistory;
      
      const responseText = await chatWithGemini(currentHistory, apiKey, rooms);
      
      // Kiểm tra và tách chuỗi JSON lệnh (nếu có)
      let displayMessage = responseText;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        // Có lệnh JSON -> Thực thi lệnh
        executeCommands(jsonMatch[1]);
        // Cắt bỏ phần JSON khỏi nội dung hiển thị cho người dùng
        displayMessage = responseText.replace(/```json\n[\s\S]*?\n```/, '').trim();
      }

      addChatMessage({ role: 'assistant', content: displayMessage });
    } catch (error: any) {
      addChatMessage({ 
        role: 'assistant', 
        content: `❌ Lỗi: ${error.message}. Bạn kiểm tra lại API Key hoặc mạng nhé!` 
      });
      // Tùy chọn: Xóa API key nếu bị lỗi xác thực
      if (error.message.includes('API_KEY_INVALID')) {
        setApiKey('');
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Nút bấm Floating */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-105 ${
            isOpen ? 'bg-rose-500 hover:bg-rose-600 rotate-90' : 'bg-[#3744e8] hover:bg-blue-600'
          }`}
        >
          {isOpen ? <X size={26} /> : <MessageSquare size={26} fill="currentColor" />}
        </button>
      </div>

      {/* Cửa sổ Chat */}
      <div 
        className={`fixed bottom-24 right-6 w-[360px] h-[520px] bg-[#131a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 pointer-events-none translate-y-8'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1a233a] to-[#131a2e] border-b border-white/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 text-blue-400 p-2 rounded-xl border border-blue-500/20">
               <Bot size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-white">SmartHub AI</h3>
              <p className="text-[11px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Luôn sẵn sàng
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Thông báo nhập API Key (Nếu chưa có) */}
        {!apiKey && chatHistory.length === 0 && (
          <div className="p-4 m-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 font-semibold text-blue-400">
              <KeyRound size={16} /> Nhập Gemini API Key
            </div>
            <p className="mb-2 text-xs text-blue-200/80 leading-relaxed">Vui lòng cung cấp khóa API Gemini của bạn để bắt đầu trò chuyện. Khóa này chỉ lưu trữ cục bộ trên trình duyệt của bạn.</p>
          </div>
        )}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {/* Tin nhắn chào mừng mặc định */}
          {chatHistory.length === 0 && apiKey && (
             <div className="flex items-start gap-2 max-w-[85%]">
               <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                 <Bot size={16} />
               </div>
               <div className="p-3 bg-[#1a233a] text-gray-200 rounded-2xl rounded-tl-sm shadow-sm text-sm border border-white/5 leading-relaxed">
                 Xin chào 👋<br/>Tôi là SmartHub AI. Tôi có thể giúp gì cho bạn hôm nay?
               </div>
             </div>
          )}

          {chatHistory.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-2 max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                msg.role === 'user' ? 'bg-blue-600 text-white hidden' : 'bg-blue-500/20 border border-blue-500/20 text-blue-400'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              {/* Message Bubble */}
              <div className={`p-3 text-[14px] shadow-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-[#1a233a] text-gray-200 rounded-2xl rounded-tl-sm border border-white/5'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                 <Bot size={16} />
               </div>
              <div className="p-3.5 bg-[#1a233a] rounded-2xl rounded-tl-sm shadow-sm border border-white/5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-gradient-to-t from-[#131a2e] to-transparent border-t border-white/5 rounded-b-2xl mt-auto">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 border border-white/10 rounded-2xl px-4 py-2.5 bg-[#1a233a] focus-within:border-blue-500/50 transition-colors"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!apiKey ? "Nhập API Key bắt đầu bằng AIza..." : "Hỏi AI về hệ thống..."}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-white placeholder:text-gray-500 min-w-0"
              disabled={isTyping}
            />
            <div className="flex items-center gap-1 text-gray-500">
               <button type="button" className="p-1.5 hover:bg-white/5 rounded-lg hover:text-blue-400 transition-colors">
                  <Smile size={18} />
               </button>
               <button 
                 type="submit" 
                 disabled={!input.trim() || isTyping}
                 className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-1"
                >
                  <Send size={16} />
               </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
