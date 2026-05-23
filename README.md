# Bài Tập Lớn Giữa Kỳ - Object Oriented Programming (OOP)
## Đề Tài: Quản Lý Hệ Thống Nhà Thông Minh (Smart Home Hub)

Dự án này là bài tập lớn giữa kỳ môn học Lập trình Hướng đối tượng (OOP). Mục tiêu của dự án là áp dụng các nguyên lý cơ bản của OOP (Đóng gói, Kế thừa, Đa hình, Trừu tượng) vào việc xây dựng một hệ thống giả lập quản lý các thiết bị điện trong nhà thông minh.

Dự án không chỉ bao gồm các phiên bản chạy trên giao diện dòng lệnh (CLI) bằng **C++** và **Python**, mà còn phát triển mở rộng thêm giao diện quản lý trên nền web (**Web Dashboard**) với **Next.js** và **Backend Python**.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
BTL_GK_OOP/
│
├── main.cpp                 # Phiên bản CLI viết bằng C++
├── main.py                  # Phiên bản CLI viết bằng Python
├── home_data.txt            # File lưu trữ dữ liệu lịch sử và trạng thái
│
├── Website/                 # Giao diện Web Dashboard (Frontend)
│   ├── src/                 # Source code Next.js (React, TypeScript)
│   ├── package.json         # File quản lý thư viện Node.js
│   └── ...
│
└── Backend/                 # Backend Server cung cấp API
    ├── main.py              # File chạy server chính
    ├── models.py            # Khai báo các mô hình dữ liệu
    ├── database.py          # Kết nối Database
    ├── requirements.txt     # Thư viện Python cần thiết
    └── ...
```

---

## 🎯 Các Nguyên Lý OOP Được Áp Dụng

Dự án mô phỏng các thiết bị thông minh thông qua các lớp (classes) với cấu trúc phân cấp:
1. **Abstraction (Tính trừu tượng)**: Lớp trừu tượng (Abstract Class) `Device` chứa các phương thức ảo tinh khiết (pure virtual) như `operate()`, `get_power_consumption()` bắt buộc các lớp con phải triển khai.
2. **Inheritance (Tính kế thừa)**: Các lớp thiết bị cụ thể như `SmartLight`, `SmartAC`, `SmartLock` đều kế thừa từ lớp cha `Device`.
3. **Polymorphism (Tính đa hình)**: Tính năng điều khiển thiết bị (`operate()`) có hành vi khác nhau tùy theo loại thiết bị (đèn thì bật/tắt, cửa thì mở khóa/đóng, điều hòa thì thay đổi nhiệt độ).
4. **Encapsulation (Tính đóng gói)**: Trạng thái của thiết bị (độ sáng, mật khẩu, trạng thái bật/tắt) được che giấu trong các thuộc tính `private`/`protected` và chỉ có thể truy cập qua các hàm `getter`, `setter`.
5. **Overloading (Nạp chồng toán tử)**: Nạp chồng toán tử `+` để cộng tổng điện năng tiêu thụ của 2 thiết bị.

---

## 🌟 Chức Năng Của Hệ Thống

* **Quản lý phòng:** Thêm phòng mới vào Hub trung tâm.
* **Quản lý thiết bị:** Thêm các thiết bị (SmartLight, SmartAC, SmartLock) vào từng phòng.
* **Điều khiển thiết bị:** Bật/Tắt, đổi màu sắc đèn, đổi nhiệt độ điều hòa, mở khóa cửa bằng mật khẩu.
* **Theo dõi điện năng tiêu thụ:** Tính toán điện năng theo thời gian thực dựa trên trạng thái bật/tắt và thông số của từng thiết bị.
* **Giả lập lỗi kết nối (Exception Handling):** Bắt lỗi (`ConnectionException`) khi một thiết bị mất kết nối mạng.
* **Lưu log & trạng thái:** Ghi log hoạt động và xuất trạng thái toàn bộ ngôi nhà ra file `home_data.txt`.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Phiên Bản C++ (CLI)
Yêu cầu: Đã cài đặt trình biên dịch C++ (ví dụ: g++, MinGW hoặc clang).
```bash
# Biên dịch
g++ main.cpp -o SmartHome

# Chạy ứng dụng
./SmartHome
```

### 2. Phiên Bản Python (CLI)
Yêu cầu: Đã cài đặt Python 3.x.
```bash
# Chạy trực tiếp script
python main.py
```

### 3. Giao diện Web (Dashboard)
Yêu cầu: Node.js (v18+) và npm/yarn/pnpm.
```bash
cd Website
npm install      # Hoặc yarn install
npm run dev      # Khởi động server frontend ở cổng 3000
```
Truy cập `http://localhost:3000` trên trình duyệt.

### 4. Chạy Backend API (Python)
Yêu cầu: Python 3.x và pip.
```bash
cd Backend
pip install -r requirements.txt
python main.py   # Tùy thuộc vào thiết lập (có thể là uvicorn main:app --reload)
```

---

## 🤝 Thành Viên Nhóm (Ví dụ)
- **Họ và Tên 1** - MSSV: ...
- **Họ và Tên 2** - MSSV: ...

*Chúc các bạn có trải nghiệm lập trình OOP tuyệt vời với dự án này!* 🚀
