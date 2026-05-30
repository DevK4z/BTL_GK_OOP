# 🏠 Smart Home Hub - 3D Digital Twin & AI Assistant

[![University](https://img.shields.io/badge/University-VJU-blue.svg?style=for-the-badge&logo=institution)](https://vju.ac.vn/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js_14-black?style=for-the-badge&logo=next.js)](#)
[![3D Engine](https://img.shields.io/badge/WebGL-Three.js-white?style=for-the-badge&logo=three.js)](#)
[![Core](https://img.shields.io/badge/Core-C%2B%2B-00599C?style=for-the-badge&logo=c%2B%2B)](#)

> **Smart Home Hub** là đồ án Bài tập lớn Giữa kỳ môn Lập trình Hướng đối tượng (OOP). Vượt ra khỏi khuôn khổ một bài tập console truyền thống, hệ thống được nâng cấp thành một nền tảng IoT toàn diện: kết hợp lõi xử lý C++ vững chắc, giao diện Bản vẽ kỹ thuật 3D (Isometric Orthographic) thời gian thực và Trợ lý ảo AI có khả năng điều khiển thiết bị bằng giọng nói.

🔗 **[Trải nghiệm Live Demo tại đây](https://devk4z.github.io/BTL_GK_OOP/)**

---

## 🌟 Tinh Hoa Công Nghệ & Tính Năng

Dự án được thiết kế theo kiến trúc phân tầng, kết hợp giữa mô phỏng phần cứng và giao diện web hiện đại:

### 1. 🧊 Bản Sao Kỹ Thuật Số 3D (Digital Twin Blueprint)
- **Góc nhìn Isometric Orthographic:** Tái hiện không gian nhà thông minh dưới dạng bản vẽ kỹ thuật chuẩn xác, loại bỏ các chi tiết thừa để tập trung vào luồng công năng.
- **Tương tác Thời gian thực (Raycasting):** Click trực tiếp vào các khối 3D (Đèn, Điều hòa, Khóa) để thao tác bật/tắt. 
- **Nhãn Đo Lường Động (HTML Overlay):** Hiển thị các thông số kỹ thuật sắc nét ngay trên không gian 3D (VD: `[Mức chiếu sáng: 80%]`, `[Nhiệt độ: 24°C]`, `[Trạng thái: ONLINE]`).

### 2. 🤖 Trợ Lý Ảo AI & Voice Control (Gemini API)
- **Giao tiếp bằng Giọng nói:** Tích hợp Web Speech API cho phép người dùng ra lệnh bằng giọng nói (Voice-to-Text).
- **Function Calling:** AI không chỉ chat mà còn có quyền "gọi hàm" để trực tiếp can thiệp vào state của thiết bị (VD: "Giảm nhiệt độ phòng ngủ xuống 22 độ" -> AI tự động kích hoạt hàm cập nhật UI 3D).
- **Macro Routine (Command Pattern):** Hỗ trợ thực thi chuỗi hành động tự động (Ví dụ: Chế độ đi ngủ = Tắt toàn bộ đèn + Khóa cửa chính).

### 3. ⚙️ Lõi Lập Trình Hướng Đối Tượng (C++ Core)
- Áp dụng triệt để 4 trụ cột OOP (Trừu tượng, Đóng gói, Kế thừa, Đa hình) cho hệ thống thiết bị (`Device`, `SmartLight`, `SmartAC`, `SmartLock`).
- Quản lý không gian qua cấu trúc `Hub -> Room -> Devices`.
- Nạp chồng toán tử (`operator+`) để tính tổng điện năng tiêu thụ nhanh chóng.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend & Giao diện:** Next.js (App Router), React, Tailwind CSS.
- **Đồ họa WebGL:** `@react-three/fiber`, `@react-three/drei`, `three.js`.
- **Tích hợp AI:** Vercel AI SDK, Google Gemini API.
- **Backend & OOP Core:** Ngôn ngữ C++, Python (dùng cho phiên bản console gốc).
- **Deployment:** GitHub Pages / Vercel.

---

## 🚀 Hướng Dẫn Cài Đặt (Local Development)

### 1. Khởi chạy Giao diện Web 3D (Next.js)
Yêu cầu: Node.js (v18 trở lên).

```bash
# Clone repository
git clone https://github.com/DevK4z/BTL_GK_OOP.git
cd BTL_GK_OOP

# Cài đặt thư viện phụ thuộc
npm install

# Tạo file .env.local và thêm GEMINI_API_KEY (để test Chatbot)
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# Khởi chạy server development
npm run dev
Truy cập: http://localhost:3000
```
2. Khởi chạy Core Engine (Phiên bản C++ Console)
Yêu cầu: Trình biên dịch C++ (GCC/Clang).

```bash
# Di chuyển vào thư mục chứa mã nguồn C++ (nếu có)
g++ main.cpp -o smarthome_engine
./smarthome_engine
```

📐 Kiến Trúc Phần Mềm (Design Patterns)
Polymorphism (Đa hình): Giao diện web và lõi C++ đều xử lý các thiết bị thông qua interface chung. Một mảng duy nhất chứa nhiều loại thiết bị khác nhau nhưng tự động chạy đúng logic khi gọi hàm operate().

Command Pattern: Gói gọn các yêu cầu điều khiển (Bật/Tắt, Đổi thông số) thành các đối tượng độc lập, cho phép AI Chatbot dễ dàng thực thi hàng loạt (Routine automation).

Nhóm: tourist - Dự án nhóm OOP

Sinh viên ngành Khoa học Máy tính và Kỹ thuật - Đại học Việt Nhật (VJU).

GitHub: @DevK4z
