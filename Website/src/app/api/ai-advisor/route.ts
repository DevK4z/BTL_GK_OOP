import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY',
});

// Định nghĩa schema cho đầu ra JSON từ Gemini
const responseSchema: Schema = {
  type: Type.ARRAY,
  description: "Danh sách các đề xuất hoặc cảnh báo về trạng thái thiết bị trong nhà",
  items: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        description: "Loại thông báo: warning (cảnh báo) hoặc suggestion (đề xuất tối ưu)",
      },
      title: {
        type: Type.STRING,
        description: "Tiêu đề ngắn gọn của thông báo",
      },
      message: {
        type: Type.STRING,
        description: "Chi tiết lời khuyên, lý do tại sao đưa ra đề xuất này",
      },
      actionable: {
        type: Type.BOOLEAN,
        description: "True nếu người dùng có thể thực hiện một hành động tức thì để xử lý (vd: tắt đèn, giảm nhiệt độ). False nếu chỉ là thông báo chung.",
      },
      targetDeviceId: {
        type: Type.STRING,
        description: "ID của thiết bị cần điều chỉnh, nếu có",
      },
      suggestedAction: {
        type: Type.STRING,
        description: "Loại hành động nếu actionable=true (turn_on hoặc turn_off)",
      },
      roomId: {
        type: Type.STRING,
        description: "ID của phòng chứa thiết bị",
      }
    },
    required: ["type", "title", "message", "actionable"],
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rooms, totalPower } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: "Missing GEMINI_API_KEY environment variable. Vui lòng thiết lập biến môi trường.",
        suggestions: [
          {
            type: "warning",
            title: "Chưa cấu hình AI",
            message: "Bạn cần cung cấp GEMINI_API_KEY trong file .env.local để nhận đề xuất từ AI.",
            actionable: false,
          }
        ]
      }, { status: 400 });
    }

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
        temperature: 0.2, // Low temperature for consistent JSON output
      }
    });

    const suggestions = JSON.parse(response.text || '[]');

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("AI Advisor Error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi gọi AI API." },
      { status: 500 }
    );
  }
}
