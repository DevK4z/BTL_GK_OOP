
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, KeyRound, Sparkles, Paperclip, Smile, Mic, MicOff, Volume2, Trash2 } from 'lucide-react';
import { useSmartHomeStore } from '../../store';
import { chatWithGemini } from '../../utils/geminiApi';
import { 
  CommandFactory, 
  ToggleDeviceCommand, 
  ToggleLockCommand, 
  SetACTemperatureCommand 
} from '../../models/Command';

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new(): ISpeechRecognition };
    webkitSpeechRecognition: { new(): ISpeechRecognition };
  }
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'vi-VN'; 

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + " " + transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput(''); 
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.4;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const { 
    apiKey, 
    setApiKey, 
    chatHistory, 
    addChatMessage, 
    clearChatHistory,
    rooms, 
    toggleDevice,
    toggleLock,
    addLog
  } = useSmartHomeStore();

  const [tempApiKey, setTempApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  const handleFunctionCalls = (functionCalls: any[]) => {
    if (!functionCalls || functionCalls.length === 0) return;

    const store = useSmartHomeStore.getState();

    functionCalls.forEach((fc) => {
      const { name, args } = fc;

      // ══════════ MACRO ══════════
      if (name === 'execute_macro') {
        const macroName = args.macro_name;
        if (macroName === 'sleep_mode') {
          const macro = CommandFactory.createSleepModeMacro();
          macro.execute();
        } else if (macroName === 'leave_home') {
          const macro = CommandFactory.createLeaveHomeMacro();
          macro.execute();
        }
      }
      // ══════════ NAVIGATE ══════════
      else if (name === 'navigate_view') {
        const validViews = ['overview', 'rooms', 'devices', 'power', 'logs', 'oop'];
        if (validViews.includes(args.view)) {
          store.setActiveView(args.view);
          addLog({ message: `AI chuyển đến trang: ${args.view}`, type: 'info', icon: 'compass' });
        }
      }
      // ══════════ ROOM MANAGEMENT ══════════
      else if (name === 'add_room') {
        const newRoomId = store.addRoom(args.room_name, args.icon || 'sofa');
        addLog({ message: `AI đã tạo phòng mới: ${args.room_name}`, type: 'success', icon: 'plus' });
      }
      else if (name === 'remove_room') {
        const room = rooms.find(r => r.id === args.room_id);
        if (room) {
          store.removeRoom(args.room_id);
          addLog({ message: `AI đã xóa phòng: ${room.name}`, type: 'warning', icon: 'trash-2' });
        }
      }
      // ══════════ DEVICE MANAGEMENT ══════════
      else if (name === 'add_device') {
        const deviceType = args.device_type as 'SmartLight' | 'SmartAC' | 'SmartLock';
        const defaults: Record<string, Partial<any>> = {
          SmartLight: { basePower: 60, brightness: 80, color: 'Warm White' },
          SmartAC: { basePower: 1200, temperature: 25 },
          SmartLock: { basePower: 5, isLocked: true, passcode: '0000' },
        };
        const d = defaults[deviceType] || defaults.SmartLight;
        const newDevice: any = {
          type: deviceType,
          id: args.device_id || `D${Date.now()}`,
          name: args.device_name,
          status: false,
          basePower: d.basePower,
          isOnline: true,
          ...d,
        };
        store.addDevice(args.room_id, newDevice);
        addLog({ message: `AI đã thêm thiết bị: ${args.device_name}`, type: 'success', icon: 'plus-circle' });
      }
      else if (name === 'remove_device') {
        const room = rooms.find(r => r.id === args.room_id);
        const device = room?.devices.find(d => d.id === args.device_id);
        if (room && device) {
          store.removeDevice(args.room_id, args.device_id);
          addLog({ message: `AI đã xóa thiết bị: ${device.name}`, type: 'warning', icon: 'trash-2' });
        }
      }
      // ══════════ DEVICE CONTROL ══════════
      else if (name === 'toggle_device' || name === 'toggle_lock' || name === 'set_temperature'
               || name === 'update_light' || name === 'set_device_online') {
        const deviceId = args.device_id;
        const room = rooms.find(r => r.devices.some(d => d.id === deviceId));
        if (!room) return;
        const device = room.devices.find(d => d.id === deviceId);
        if (!device) return;

        let cmd = null;

        if (name === 'toggle_device') {
          cmd = new ToggleDeviceCommand(room.id, deviceId, device.name);
        } else if (name === 'toggle_lock') {
          cmd = new ToggleLockCommand(room.id, deviceId, device.name);
        } else if (name === 'set_temperature') {
          cmd = new SetACTemperatureCommand(room.id, deviceId, device.name, args.temperature);
        } else if (name === 'update_light') {
          store.updateLight(room.id, deviceId, args.brightness, args.color);
          addLog({
            message: `AI đã chỉnh đèn ${device.name}: ${args.brightness}% - ${args.color}`,
            type: 'info',
            icon: 'bot'
          });
        } else if (name === 'set_device_online') {
          store.setOnline(room.id, deviceId, args.online);
          addLog({
            message: `AI đã đặt ${device.name} ${args.online ? 'Online' : 'Offline'}`,
            type: 'info',
            icon: 'bot'
          });
        }

        if (cmd) {
          cmd.execute();
          addLog({
            message: cmd.getDescription(),
            type: 'info',
            icon: 'bot'
          });
        }
      }
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    // Resolve the effective API key: env > store > empty
    const effectiveKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || apiKey || '';

    if (!effectiveKey) {
      // No key available anywhere — prompt user to enter manually
      if (input.trim().length > 20) {
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
          content: 'Vui lòng nhập API Key hợp lệ để sử dụng tính năng này.'
        });
        setInput('');
      }
      return;
    }

    // If store key is empty but env key exists, persist it to store
    if (!apiKey && effectiveKey) {
      setApiKey(effectiveKey);
    }

    const userMessage = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsTyping(true);

    try {

      const currentHistory = useSmartHomeStore.getState().chatHistory;

      const response = await chatWithGemini(currentHistory, apiKey, rooms);

      let displayMessage = response.text;

      if (response.functionCalls && response.functionCalls.length > 0) {
        handleFunctionCalls(response.functionCalls);
        if (!displayMessage) {
           displayMessage = "Đã thực hiện xong yêu cầu của bạn!";
        }
      }

      addChatMessage({ role: 'assistant', content: displayMessage });

      speakText(displayMessage);
    } catch (error: any) {
      let errorMessage = `❌ Lỗi: ${error.message}. Bạn kiểm tra lại API Key hoặc mạng nhé!`;
      
      if (error.message && error.message.includes('Quota exceeded')) {
        errorMessage = `⚠️ API Key của bạn đã vượt quá giới hạn miễn phí của Google (15 requests/min). Vui lòng đợi khoảng 30 giây rồi thử lại nhé!`;
      }

      addChatMessage({ 
        role: 'assistant', 
        content: errorMessage
      });

      if (error.message && error.message.includes('API_KEY_INVALID')) {
        setApiKey('');
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>

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

      <div 
        className={`fixed bottom-24 right-6 w-[360px] h-[520px] bg-[#131a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 pointer-events-none translate-y-8'
        }`}
      >

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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (window.confirm("Bạn có chắc muốn làm mới AI (xóa lịch sử chat và API Key)?")) {
                  clearChatHistory();
                  setApiKey('');
                }
              }} 
              className="text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              title="Làm mới SmartHub AI"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors" title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        {!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY && chatHistory.length === 0 && (
          <div className="p-4 m-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 font-semibold text-blue-400">
              <KeyRound size={16} /> Nhập Gemini API Key
            </div>
            <p className="mb-2 text-xs text-blue-200/80 leading-relaxed">Vui lòng cung cấp khóa API Gemini của bạn để bắt đầu trò chuyện. Khóa này chỉ lưu trữ cục bộ trên trình duyệt của bạn.</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">

          {chatHistory.length === 0 && (apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY) && (
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

              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                msg.role === 'user' ? 'bg-blue-600 text-white hidden' : 'bg-blue-500/20 border border-blue-500/20 text-blue-400'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

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

        <div className="p-3 bg-gradient-to-t from-[#131a2e] to-transparent border-t border-white/5 rounded-b-2xl mt-auto">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 border border-white/10 rounded-2xl px-4 py-2.5 bg-[#1a233a] focus-within:border-blue-500/50 transition-colors"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={(!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) ? "Nhập API Key..." : (isListening ? "Đang nghe..." : "Hỏi AI về hệ thống...")}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-white placeholder:text-gray-500 min-w-0"
              disabled={isTyping}
            />
            <div className="flex items-center gap-1 text-gray-500">
               {isSpeaking && (
                 <button type="button" onClick={() => window.speechSynthesis.cancel()} className="p-1.5 text-green-400 hover:bg-white/5 rounded-lg transition-colors" title="Dừng đọc">
                    <Volume2 size={18} className="animate-pulse" />
                 </button>
               )}
               <button 
                 type="button" 
                 onClick={toggleListening}
                 className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-white/5 hover:text-blue-400'}`}
                 title={isListening ? "Dừng ghi âm" : "Ghi âm giọng nói"}
               >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
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
