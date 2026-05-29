'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSmartHomeStore } from '../../store';
import { ToggleDeviceCommand, SetDeviceValueCommand, MacroCommand, ICommand } from '../../models/Command';

// Thư viện Web Speech API
const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export default function SmartChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Lấy store và history
  const chatHistory = useSmartHomeStore((state) => state.chatHistory);
  const addChatMessage = useSmartHomeStore((state) => state.addChatMessage);
  const rooms = useSmartHomeStore((state) => state.rooms);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Khởi tạo Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'vi-VN';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [rooms]); // dependency on rooms so handleSendMessage gets latest context? No, handleSendMessage reads from store or we pass it directly.

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  // Text-to-Speech Technical Voice
  const speakTechnical = (text: string) => {
    if ('speechSynthesis' in window) {
      // Hủy các giọng đọc cũ
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.pitch = 0.8; // Giọng hơi trầm, giống máy móc kỹ thuật
      utterance.rate = 1.1; // Tốc độ hơi nhanh
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const executeFunctionCalls = (functionCalls: any[]) => {
    const macro = new MacroCommand();

    functionCalls.forEach((call) => {
      const { name, args } = call;
      console.log(`[Chatbot] Cần thực thi lệnh kỹ thuật:`, name, args);

      if (name === 'toggleDevice') {
        macro.addCommand(new ToggleDeviceCommand(args.roomId, args.deviceId, args.state));
      } else if (name === 'setDeviceValue') {
        macro.addCommand(new SetDeviceValueCommand(args.roomId, args.deviceId, args.type, args.value));
      } else if (name === 'executeRoutine') {
        // Build-in routine
        if (args.routineName === 'night_mode') {
          // Tắt hết đèn khách, gara, hạ AC ngủ
          macro.addCommand(new ToggleDeviceCommand('room-1', 'D1', false));
          macro.addCommand(new ToggleDeviceCommand('room-1', 'D2', false));
          macro.addCommand(new ToggleDeviceCommand('room-4', 'D10', false));
          macro.addCommand(new ToggleDeviceCommand('room-3', 'D8', true));
          macro.addCommand(new SetDeviceValueCommand('room-3', 'D8', 'SmartAC', 26));
          macro.addCommand(new ToggleDeviceCommand('room-3', 'D9', true)); // Khóa cửa ngủ
        }
      }
    });

    // Thực thi chuỗi lệnh lên Store hiện tại
    macro.execute(useSmartHomeStore.getState());
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    addChatMessage({ role: 'user', content: text });
    setInputText('');
    setIsLoading(true);

    try {
      // Chuẩn bị payload lấy từ store để AI có context
      const currentRooms = useSmartHomeStore.getState().rooms;
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: text }],
          homeState: currentRooms // Gửi bản sao của Blueprint
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Xử lý Function Calls (Command Pattern)
      if (data.functionCalls && data.functionCalls.length > 0) {
        executeFunctionCalls(data.functionCalls);
        
        // Nếu AI không trả về text mà chỉ gọi hàm, tạo phản hồi kỹ thuật tự động
        if (!data.text) {
          data.text = "Technical Blueprint has been synchronized. System updated successfully.";
        }
      }

      if (data.text) {
        addChatMessage({ role: 'assistant', content: data.text });
        speakTechnical(data.text);
      }

    } catch (err: any) {
      console.error(err);
      addChatMessage({ role: 'assistant', content: `[ERROR] Connection refused: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        fontFamily: '"SF Mono", "Courier New", monospace',
      }}
    >
      {/* Widget Cửa sổ Chat */}
      {isOpen && (
        <div
          style={{
            width: '350px',
            height: '450px',
            background: '#0b1120',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ background: '#0ea5e9', color: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>TERMINAL: SCHEMATICS HUB</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>
              &times;
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chatHistory.length === 0 && (
              <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                System ready. Awaiting technical commands.
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.role === 'user' ? 'GUEST_USER' : 'SYSTEM_AI'} [{msg.timestamp}]
                </div>
                <div style={{
                  background: msg.role === 'user' ? '#1e293b' : 'transparent',
                  color: msg.role === 'user' ? '#e0f2fe' : '#38bdf8',
                  border: msg.role === 'assistant' ? '1px solid #0ea5e9' : 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ color: '#38bdf8', fontSize: '12px' }}>Processing schema...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ borderTop: '1px solid #1e293b', padding: '10px', display: 'flex', gap: '8px', background: '#0f172a' }}>
            <button
              onClick={toggleListen}
              style={{
                background: isListening ? '#ef4444' : '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              title="Voice Control"
            >
              🎤
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(inputText); }}
              placeholder={isListening ? "Listening..." : "Enter command..."}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #3b82f6',
                color: '#e0f2fe',
                padding: '8px',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '12px'
              }}
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              style={{
                background: '#0ea5e9',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              SEND
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: '#0b1120',
            color: '#38bdf8',
            border: '2px solid #0ea5e9',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Open Technical Chatbot"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        </button>
      )}
    </div>
  );
}
