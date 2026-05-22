
import { ChatMessage, Room } from '../store';

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface GeminiFunctionCall {
  name: string;
  args: any;
}

export interface ChatResponse {
  text: string;
  functionCalls?: GeminiFunctionCall[];
}

export async function chatWithGemini(
  messages: ChatMessage[],
  apiKey: string,
  rooms: Room[]
): Promise<ChatResponse> {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

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
1. Trả lời các câu hỏi của người dùng về trạng thái nhà.
2. NẾU người dùng ra lệnh điều khiển thiết bị, BẠN PHẢI GỌI HÀM (Function Calling) TƯƠNG ỨNG thay vì chỉ trả lời suông.
3. Nếu người dùng muốn kích hoạt các "chế độ" (như đi ngủ, ra khỏi nhà), hãy gọi hàm execute_macro.
`;

  const tools = [
    {
      functionDeclarations: [
        {
          name: "execute_macro",
          description: "Kích hoạt một chế độ tự động hóa (Macro) gồm nhiều hành động.",
          parameters: {
            type: "OBJECT",
            properties: {
              macro_name: {
                type: "STRING",
                description: "Tên macro cần chạy. Các giá trị hợp lệ: 'sleep_mode' (Đi ngủ), 'leave_home' (Ra khỏi nhà)."
              }
            },
            required: ["macro_name"]
          }
        },
        {
          name: "toggle_device",
          description: "Bật hoặc tắt một thiết bị thông minh (Đèn, Điều hòa).",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID của thiết bị cần điều khiển (VD: D1, D2)." }
            },
            required: ["device_id"]
          }
        },
        {
          name: "toggle_lock",
          description: "Khóa hoặc mở khóa một cửa thông minh (SmartLock).",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID của khóa cửa (VD: D4)." }
            },
            required: ["device_id"]
          }
        },
        {
          name: "set_temperature",
          description: "Điều chỉnh nhiệt độ cho Điều hòa (SmartAC).",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID của Điều hòa." },
              temperature: { type: "NUMBER", description: "Nhiệt độ (độ C) cần cài đặt." }
            },
            required: ["device_id", "temperature"]
          }
        }
      ]
    }
  ];

  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemContext }]
    },
    contents: contents,
    tools: tools,
    generationConfig: {
      temperature: 0.1,
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

    const parts = data.candidates?.[0]?.content?.parts || [];
    let text = "";
    const functionCalls: GeminiFunctionCall[] = [];

    parts.forEach((part: any) => {
      if (part.text) {
        text += part.text;
      }
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args
        });
      }
    });

    return { text, functionCalls };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export interface AIRecommendation {
  id: string;
  type: "warning" | "suggestion" | "info";
  title: string;
  message: string;
  actionable: boolean;
  targetRoomIndex?: number;
  targetDeviceIndex?: number;
  targetDeviceId?: string; 
  suggestedAction?: "turn_on" | "turn_off";
}

export async function analyzeHomeStateWithAI(
  rooms: Room[],
  totalPower: number,
  apiKey: string
): Promise<AIRecommendation[]> {
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const finalKey = envKey || apiKey;

  if (!finalKey) {
    throw new Error("Không tìm thấy API Key. Vui lòng thêm NEXT_PUBLIC_GEMINI_API_KEY vào .env hoặc nhập ở Floating Chat.");
  }

  const systemContext = `
Bạn là AI chuyên gia quản lý năng lượng và an ninh cho hệ thống Smart Home.
Nhiệm vụ của bạn là phân tích trạng thái các thiết bị dưới đây và đưa ra các đề xuất (recommendations) HỢP LÝ.

Trạng thái hệ thống:
Tổng công suất hiện tại: ${totalPower}W
Danh sách phòng:
${rooms.map((room, rIdx) => `
Phòng ${rIdx} - ${room.name}:
${room.devices.length === 0 ? "  Không có thiết bị" : room.devices.map((d, dIdx) => {
    let statusStr = d.status ? "Đang BẬT" : "Đang TẮT";
    if (d.type === 'SmartLock') {
        statusStr = (d as any).isLocked ? "Đang KHÓA" : "Đang MỞ KHÓA";
    }
    return `  [Thiết bị ${dIdx}] ID: ${d.id} | Tên: ${d.name} | Loại: ${d.type} | Trạng thái: ${statusStr}`;
}).join('\n')}
`).join('')}

BẠN PHẢI TRẢ VỀ DUY NHẤT MỘT MẢNG JSON HỢP LỆ (TUYỆT ĐỐI KHÔNG CÓ TEXT HAY MARKDOWN BAO QUANH).
Định dạng JSON Array:
[
  {
    "id": "chuỗi ngẫu nhiên",
    "type": "warning" hoặc "suggestion" hoặc "info",
    "title": "Tiêu đề ngắn gọn",
    "message": "Thông điệp chi tiết giải thích lý do",
    "actionable": true hoặc false,
    "targetRoomIndex": số nguyên vị trí phòng (nếu actionable = true),
    "targetDeviceIndex": số nguyên vị trí thiết bị trong phòng (nếu actionable = true),
    "targetDeviceId": "ID của thiết bị" (nếu actionable = true),
    "suggestedAction": "turn_on" hoặc "turn_off" (nếu actionable = true)
  }
]

Các quy tắc logic:
1. Nếu thấy SmartAC (Điều hòa) đang bật, hãy đề xuất "turn_off" để tiết kiệm điện.
2. Nếu thấy SmartLock (Khóa) đang "MỞ KHÓA", hãy cảnh báo an ninh và đề xuất "turn_on" (để khóa lại).
3. Nếu thấy SmartLight đang bật, gợi ý tắt bớt nếu không dùng.
4. Trả về tối đa 3 đề xuất.
5. CHỈ TRẢ VỀ MẢNG JSON, KHÔNG CÓ KÝ TỰ NÀO KHÁC BÊN NGOÀI BẮT ĐẦU BẰNG [ VÀ KẾT THÚC BẰNG ]!
  `;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: systemContext }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${finalKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw new Error("Lỗi gọi API Gemini");
    }

    const data = await res.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonArr = JSON.parse(rawText.trim());
    return jsonArr as AIRecommendation[];
  } catch (error) {
    console.error("Lỗi analyzeHomeStateWithAI:", error);
    throw error;
  }
}
