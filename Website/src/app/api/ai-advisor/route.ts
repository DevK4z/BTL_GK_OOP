import { NextResponse } from 'next/server';

interface AIRecommendation {
  type: "warning" | "suggestion";
  title: string;
  message: string;
  actionable: boolean;
  targetDeviceId: string;
  suggestedAction: "turn_on" | "turn_off";
}

export async function POST(req: Request) {
  try {
    const { devices } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {

      const mockRecommendations: AIRecommendation[] = [];

      const highPowerOn = devices.find((d: any) => d.type === 'SmartAC' && d.status);
      if (highPowerOn) {
        mockRecommendations.push({
          type: "suggestion",
          title: "Tối ưu hóa điện năng",
          message: `Điều hòa "${highPowerOn.name}" đang bật và tiêu thụ nhiều điện. Hãy tắt nếu phòng đã đủ mát.`,
          actionable: true,
          targetDeviceId: highPowerOn.id,
          suggestedAction: "turn_off"
        });
      }

      const lightOnEmpty = devices.find((d: any) => d.type === 'SmartLight' && d.status);
      if (lightOnEmpty) {
        mockRecommendations.push({
          type: "warning",
          title: "Thiết bị chưa tắt",
          message: `Đèn "${lightOnEmpty.name}" đang bật công suất cao. Bạn có muốn tắt để tiết kiệm năng lượng?`,
          actionable: true,
          targetDeviceId: lightOnEmpty.id,
          suggestedAction: "turn_off"
        });
      }

      const unlockedLock = devices.find((d: any) => d.type === 'SmartLock' && d.isLocked === false);
      if (unlockedLock) {
        mockRecommendations.push({
          type: "warning",
          title: "Cảnh báo bảo mật",
          message: `Thiết bị "${unlockedLock.name}" đang ở trạng thái MỞ KHÓA. Hãy khóa cửa để đảm bảo an toàn.`,
          actionable: true,
          targetDeviceId: unlockedLock.id,
          suggestedAction: "turn_on" 
        });
      }

      if (mockRecommendations.length === 0) {
        mockRecommendations.push({
          type: "suggestion",
          title: "Hệ thống tối ưu",
          message: "Tất cả thiết bị đang hoạt động ở chế độ tiết kiệm điện năng cực đại.",
          actionable: false,
          targetDeviceId: "",
          suggestedAction: "turn_off"
        });
      }

      return NextResponse.json({ recommendations: mockRecommendations });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Bạn là trợ lý AI thông minh giám sát năng lượng và bảo mật của Smart Home Hub.
Dưới đây là trạng thái hiện tại của các thiết bị dưới dạng JSON:
${JSON.stringify(devices, null, 2)}

Hãy phân tích và đưa ra danh sách đề xuất/cảnh báo tối ưu năng lượng và bảo mật.
Yêu cầu bắt buộc: Trả về một mảng JSON (JSON Array) duy nhất, không kèm markdown, không có text bao bọc bên ngoài. Mỗi phần tử trong mảng phải có cấu trúc chính xác như sau:
{
  "type": "warning" hoặc "suggestion",
  "title": "Tiêu đề ngắn gọn",
  "message": "Nội dung thông điệp chi tiết",
  "actionable": true hoặc false (chọn true nếu hành động này có thể thực thi ngay bằng cách bật/tắt thiết bị mục tiêu),
  "targetDeviceId": "ID của thiết bị mục tiêu (ví dụ: D1)",
  "suggestedAction": "turn_on" hoặc "turn_off"
}
Chú ý: Nếu không có cảnh báo nào đặc biệt, hãy trả về ít nhất 1 suggestion về tối ưu hóa hệ thống.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

    const recommendations = JSON.parse(text);
    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("AI Advisor Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
