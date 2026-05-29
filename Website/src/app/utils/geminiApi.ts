
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
  // Ưu tiên biến môi trường (.env) trước, sau đó mới dùng key trong localStorage
  const finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || apiKey || '';
  if (!finalApiKey) {
    throw new Error("API Key is missing");
  }

  const systemContext = `
Bạn là Trợ lý ảo AI của hệ thống Smart Home Hub (BTL Giữa Kỳ OOP).
Tên của bạn là "SmartHub AI". Bạn phải trả lời ngắn gọn, thân thiện và bằng tiếng Việt.
Bạn có TOÀN QUYỀN truy cập và điều khiển hệ thống Smart Home qua Function Calling.

═══════════════ TRẠNG THÁI HỆ THỐNG ═══════════════
Danh sách phòng (Room ID — Tên phòng — Icon):
${rooms.map(room => {
    const deviceLines = room.devices.length === 0
      ? "  (Trống — chưa có thiết bị)"
      : room.devices.map(d => {
          let statusStr = d.status ? "✅ BẬT" : "⬜ TẮT";
          let details = "";
          if (d.type === 'SmartLight') {
            details = "| Sáng: " + (d as any).brightness + "% | Màu: " + (d as any).color;
          }
          if (d.type === 'SmartAC') {
            details = "| Nhiệt độ: " + (d as any).temperature + "°C";
          }
          if (d.type === 'SmartLock') {
            statusStr = (d as any).isLocked ? "🔒 KHÓA" : "🔓 MỞ";
            details = "";
          }
          const onlineStr = d.isOnline ? "🟢 Online" : "🔴 Offline";
          return "  [" + d.id + "] " + d.name + " — " + d.type + " — " + statusStr + " " + details + " — " + onlineStr;
        }).join('\n');
    return "\n📍 [" + room.id + "] " + room.name + " (icon: " + room.icon + ")\n" + deviceLines;
  }).join('')}

═══════════════ NĂNG LỰC CỦA BẠN ═══════════════
Bạn có thể thực hiện TẤT CẢ các thao tác sau qua Function Calling:

🔌 ĐIỀU KHIỂN THIẾT BỊ:
  • toggle_device — Bật/tắt đèn hoặc điều hòa
  • toggle_lock — Khóa/mở khóa cửa SmartLock
  • set_temperature — Chỉnh nhiệt độ điều hòa (16-30°C)
  • update_light — Chỉnh độ sáng (0-100%) và màu đèn
  • set_device_online — Đặt trạng thái online/offline

🏠 QUẢN LÝ PHÒNG:
  • add_room — Tạo phòng mới (icon: sofa, cooking-pot, bed-double, warehouse)
  • remove_room — Xóa phòng (và toàn bộ thiết bị bên trong)

📱 QUẢN LÝ THIẾT BỊ:
  • add_device — Thêm thiết bị mới vào phòng
  • remove_device — Xóa thiết bị khỏi phòng

🚀 CHẾ ĐỘ TỰ ĐỘNG (Macro):
  • execute_macro — Kích hoạt chế độ tự động:
    - "sleep_mode": Tắt đèn, khóa cửa, đặt điều hòa 26°C
    - "leave_home": Tắt tất cả đèn + điều hòa, khóa hết cửa

🧭 ĐIỀU HƯỚNG GIAO DIỆN:
  • navigate_view — Chuyển đổi trang hiển thị:
    - "overview": Tổng quan hệ thống
    - "rooms": Quản lý phòng
    - "devices": Quản lý thiết bị
    - "power": Phân tích điện năng
    - "logs": Nhật ký hệ thống
    - "oop": Kiến trúc OOP

═══════════════ QUY TẮC ═══════════════
1. NẾU người dùng ra lệnh, BẮT BUỘC gọi hàm Function Calling tương ứng.
2. Khi tạo thiết bị mới, tự sinh ID theo format "D" + số (VD: D12, D13...).
3. Khi thêm phòng, chọn icon phù hợp nhất với tên phòng.
4. Trả lời ngắn gọn, dùng emoji để sinh động.
5. Nếu yêu cầu không rõ ràng, hỏi lại.
`;

  const tools = [
    {
      functionDeclarations: [
        {
          name: "execute_macro",
          description: "Kích hoạt một chế độ tự động hóa (Macro) gồm nhiều hành động đồng thời.",
          parameters: {
            type: "OBJECT",
            properties: {
              macro_name: {
                type: "STRING",
                description: "Tên macro: 'sleep_mode' (Đi ngủ) hoặc 'leave_home' (Ra khỏi nhà)."
              }
            },
            required: ["macro_name"]
          }
        },
        {
          name: "toggle_device",
          description: "Bật hoặc tắt một thiết bị thông minh (SmartLight, SmartAC). Không dùng cho SmartLock.",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID thiết bị (VD: D1, D3)." }
            },
            required: ["device_id"]
          }
        },
        {
          name: "toggle_lock",
          description: "Khóa hoặc mở khóa một SmartLock (cửa thông minh).",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID khóa cửa (VD: D4, D9)." }
            },
            required: ["device_id"]
          }
        },
        {
          name: "set_temperature",
          description: "Điều chỉnh nhiệt độ cho Điều hòa (SmartAC). Phạm vi: 16-30°C.",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID của Điều hòa." },
              temperature: { type: "NUMBER", description: "Nhiệt độ mong muốn (°C), từ 16 đến 30." }
            },
            required: ["device_id", "temperature"]
          }
        },
        {
          name: "update_light",
          description: "Chỉnh độ sáng và/hoặc màu sắc cho SmartLight (đèn thông minh).",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID đèn cần chỉnh (VD: D1, D2)." },
              brightness: { type: "NUMBER", description: "Độ sáng mong muốn (0-100%)." },
              color: { type: "STRING", description: "Màu sắc: 'Warm White', 'Cool White', 'Daylight', 'Sunset', 'Ocean Blue', 'Forest Green', 'Rose Pink', 'Party Mode'." }
            },
            required: ["device_id", "brightness", "color"]
          }
        },
        {
          name: "set_device_online",
          description: "Đặt trạng thái kết nối online/offline cho một thiết bị.",
          parameters: {
            type: "OBJECT",
            properties: {
              device_id: { type: "STRING", description: "ID thiết bị." },
              online: { type: "BOOLEAN", description: "true = online, false = offline." }
            },
            required: ["device_id", "online"]
          }
        },
        {
          name: "add_room",
          description: "Tạo một phòng mới trong hệ thống Smart Home.",
          parameters: {
            type: "OBJECT",
            properties: {
              room_name: { type: "STRING", description: "Tên phòng (VD: 'Phòng Làm Việc', 'Sân Thượng')." },
              icon: { type: "STRING", description: "Icon cho phòng: 'sofa' (phòng khách), 'cooking-pot' (bếp), 'bed-double' (phòng ngủ), 'warehouse' (gara/kho)." }
            },
            required: ["room_name", "icon"]
          }
        },
        {
          name: "remove_room",
          description: "Xóa một phòng và toàn bộ thiết bị bên trong khỏi hệ thống. Cần xác nhận trước khi xóa.",
          parameters: {
            type: "OBJECT",
            properties: {
              room_id: { type: "STRING", description: "ID phòng cần xóa (VD: room-1, room-2)." }
            },
            required: ["room_id"]
          }
        },
        {
          name: "add_device",
          description: "Thêm một thiết bị mới vào một phòng cụ thể.",
          parameters: {
            type: "OBJECT",
            properties: {
              room_id: { type: "STRING", description: "ID phòng muốn thêm thiết bị (VD: room-1)." },
              device_type: { type: "STRING", description: "Loại thiết bị: 'SmartLight', 'SmartAC', hoặc 'SmartLock'." },
              device_name: { type: "STRING", description: "Tên hiển thị cho thiết bị (VD: 'Đèn trần', 'Điều hòa phòng ngủ')." },
              device_id: { type: "STRING", description: "ID duy nhất cho thiết bị mới (VD: D12, D13). Phải khác tất cả ID hiện có." }
            },
            required: ["room_id", "device_type", "device_name", "device_id"]
          }
        },
        {
          name: "remove_device",
          description: "Xóa một thiết bị khỏi một phòng.",
          parameters: {
            type: "OBJECT",
            properties: {
              room_id: { type: "STRING", description: "ID phòng chứa thiết bị." },
              device_id: { type: "STRING", description: "ID thiết bị cần xóa." }
            },
            required: ["room_id", "device_id"]
          }
        },
        {
          name: "navigate_view",
          description: "Chuyển đổi trang hiển thị trên giao diện dashboard.",
          parameters: {
            type: "OBJECT",
            properties: {
              view: { type: "STRING", description: "Tên trang: 'overview' (Tổng quan), 'rooms' (Quản lý phòng), 'devices' (Thiết bị), 'power' (Phân tích điện năng), 'logs' (Nhật ký), 'oop' (Kiến trúc OOP)." }
            },
            required: ["view"]
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
    const res = await fetch(`${GEMINI_API_URL}?key=${finalApiKey}`, {
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
  // Ưu tiên biến môi trường (.env) trước, sau đó mới dùng key trong localStorage
  const finalKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || apiKey || '';
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
