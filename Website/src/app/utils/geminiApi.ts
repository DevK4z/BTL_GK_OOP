/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatMessage, Room } from '../store';

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function chatWithGemini(
  messages: ChatMessage[],
  apiKey: string,
  rooms: Room[]
): Promise<string> {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  // Chuyển đổi trạng thái phòng thành chuỗi mô tả
  const systemContext = `
Bạn là Trợ lý ảo AI của hệ thống Smart Home Hub (BTL Giữa Kỳ OOP).
Tên của bạn là "SmartHub AI". Bạn phải trả lời ngắn gọn, thân thiện và bằng tiếng Việt.
Bạn có quyền truy cập vào trạng thái hiện tại của các thiết bị trong nhà.

Trạng thái hệ thống hiện tại:
${rooms.map(room => `
- ${room.name}:
${room.devices.length === 0 ? "  (Không có thiết bị)" : room.devices.map(d => {
    let statusStr = d.status ? "Đang BẬT" : "Đang TẮT";
    if (d.type === 'SmartLock') {
        statusStr = (d as any).isLocked ? "Đang KHÓA" : "Đang MỞ KHÓA";
    }
    let extra = "";
    if (d.type === 'SmartLight') extra = `(Sáng: ${(d as any).brightness}%, Màu: ${(d as any).color})`;
    if (d.type === 'SmartAC') extra = `(Nhiệt độ: ${(d as any).temperature}°C)`;
    return `  + ${d.name} [ID: ${d.id}] - ${statusStr} ${extra}`;
}).join('\n')}
`).join('')}

MỤC TIÊU CỦA BẠN:
1. Trả lời các câu hỏi của người dùng về trạng thái các thiết bị.
2. NẾU người dùng yêu cầu bật/tắt thiết bị, điều chỉnh nhiệt độ, mở/khóa cửa, bạn PHẢI phân tích yêu cầu, tìm ID thiết bị tương ứng và TRẢ VỀ MỘT LỆNH JSON ĐẶC BIỆT Ở CUỐI CÂU TRẢ LỜI ĐỂ HỆ THỐNG THỰC THI.

CÚ PHÁP LỆNH JSON (Bắt buộc phải nằm ở cuối dòng, định dạng đúng như sau):
\`\`\`json
{
  "commands": [
    { "action": "turn_on", "deviceId": "D1" },
    { "action": "turn_off", "deviceId": "D2" },
    { "action": "toggle", "deviceId": "D3" }
  ]
}
\`\`\`

Lưu ý quan trọng:
- Đừng bao giờ bịa ra ID thiết bị. Chỉ dùng ID có trong danh sách trên.
- Bạn có thể thực thi nhiều lệnh cùng lúc.
- Luôn nói cho người dùng biết bạn đang thực hiện hành động gì trước khi chèn block JSON.
- Ví dụ: "Dạ, em đã tắt đèn phòng ngủ giúp anh/chị rồi ạ." sau đó chèn block json lệnh tắt đèn.
`;

  // Chuyển đổi lịch sử chat thành format của Gemini
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Gắn System Instruction vào request body
  const requestBody = {
    system_instruction: {
      parts: [{ text: systemContext }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
    }
  };

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "Lỗi khi gọi API Gemini");
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
