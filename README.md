# 🏠 Smart Home Hub - OOP Midterm Project

[![University](https://img.shields.io/badge/University-VJU-blue.svg)](#)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)](#)
[![C++](https://img.shields.io/badge/Core-C%2B%2B-00599C?logo=c%2B%2B)](#)
[![Python](https://img.shields.io/badge/Core-Python-3776AB?logo=python)](#)

Dự án **Smart Home Hub** là Bài tập lớn giữa kỳ (BTL_GK_OOP) môn Lập trình Hướng đối tượng dành cho sinh viên ngành Khoa học Máy tính và Kỹ thuật tại Đại học Việt Nhật (VJU). 

Hệ thống mô phỏng một bộ điều khiển trung tâm cho ngôi nhà thông minh, cho phép người dùng quản lý các phòng, giám sát thiết bị IoT (Đèn, Điều hòa, Khóa thông minh) và tính toán điện năng tiêu thụ. Dự án được thiết kế với phần lõi xử lý mạnh mẽ (áp dụng khắt khe các nguyên lý OOP) kết hợp cùng giao diện người dùng trực quan trên nền tảng Web.

🔗 **[Trải nghiệm trực tiếp giao diện Web tại đây](https://devk4z.github.io/BTL_GK_OOP/)**

---

## ✨ Tính Năng Nổi Bật

### 💻 Phần lõi (Core Engine)
- **Quản lý không gian:** Khởi tạo mạng lưới các phòng (Phòng khách, Phòng ngủ, Gara...).
- **Đa dạng thiết bị:** Hỗ trợ nhiều loại thiết bị đặc thù (SmartLight, SmartAC, SmartLock) với các thông số tùy chỉnh riêng biệt (độ sáng, nhiệt độ, mã PIN).
- **Giám sát năng lượng:** Tự động tính toán tổng điện năng tiêu thụ dựa trên trạng thái (Bật/Tắt) và công suất cấu hình của từng thiết bị.
- **Mô phỏng sự cố:** Giả lập tình trạng mất kết nối mạng của thiết bị IoT và xử lý ngoại lệ an toàn.
- **Backup & Restore:** Lưu trữ toàn bộ trạng thái ngôi nhà ra file và khôi phục (Hydration) khi khởi động lại hệ thống.

### 🌐 Phần giao diện (Web Dashboard)
- Hiển thị tổng quan số lượng thiết bị hoạt động và tổng điện năng tiêu thụ (W).
- Giao diện thao tác hiện đại, phản hồi trạng thái thiết bị theo thời gian thực.
- Tích hợp hệ thống Nhật ký (Logs) để theo dõi các hoạt động bật/tắt thiết bị.

---

## 🧠 Các Nguyên Lý OOP Đã Áp Dụng

Dự án là minh chứng cho việc ánh xạ tư duy Lập trình Hướng đối tượng vào thực tiễn kỹ thuật phần mềm:

1. **Tính Trừu tượng (Abstraction):** Xây dựng abstract base class `Device` với các phương thức thuần ảo (`virtual operate() = 0`, `get_power_consumption()`), tạo ra một giao diện chung để hệ thống điều khiển mọi thiết bị mà không cần biết chi tiết triển khai bên trong.
2. **Tính Kế thừa (Inheritance):** Các lớp `SmartLight`, `SmartAC`, `SmartLock` đều kế thừa từ lớp cơ sở `Device`, giúp tái sử dụng mã nguồn cho các thuộc tính chung (ID, Name, Base Power) và mở rộng thêm các thuộc tính riêng biệt.
3. **Tính Đa hình (Polymorphism):** Hệ thống có thể gọi hàm `operate()` trên một con trỏ kiểu `Device*`, và chương trình sẽ tự động định tuyến (dynamic dispatch) đến đúng phương thức của lớp con tương ứng lúc runtime.
4. **Tính Đóng gói (Encapsulation):** Bảo vệ các thuộc tính nhạy cảm như trạng thái (`status`), mức nhiệt (`temperature`), mã PIN (`passcode`) bằng các access modifiers (`private`/`protected`) và chỉ cho phép thao tác qua các getter/setter an toàn.
5. **Nạp chồng toán tử (Operator Overloading):** Sử dụng `friend double operator+` để cho phép cộng trực tiếp điện năng của hai thiết bị một cách tự nhiên và ngắn gọn trong code.
6. **Xử lý Ngoại lệ (Exception Handling):** Xây dựng custom exception `ConnectionException` để bắt và xử lý an toàn các trường hợp thao tác lên thiết bị đang bị giả lập mất kết nối mạng.

---

## 🛠 Công Nghệ Sử Dụng

- **Core Logic:** C++ (Sử dụng `std::shared_ptr` để quản lý bộ nhớ an toàn) / Python.
- **Frontend UI:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS, Lucide Icons.
- **Deployment:** GitHub Pages.

---

## 🚀 Hướng Dẫn Cài Đặt Và Chạy Thử nghiệm

### 1. Chạy Core Engine (C++ Version)
Yêu cầu: Trình biên dịch C++ (GCC/Clang) hỗ trợ chuẩn C++11 trở lên.
```bash
# Clone repository
git clone [https://github.com/DevK4z/BTL_GK_OOP.git](https://github.com/DevK4z/BTL_GK_OOP.git)
cd BTL_GK_OOP

# Biên dịch mã nguồn
g++ main.cpp -o smarthome

# Chạy ứng dụng console
./smarthome

```

### 2. Chạy Core Engine (Python Version)

Yêu cầu: Đã cài đặt Python 3.x.

```bash
# Khởi chạy script
python main.py

```

### 3. Khởi chạy Giao diện Frontend (Next.js)

Yêu cầu: Node.js (v18+) và npm/yarn/pnpm.

```bash
# Cài đặt các gói phụ thuộc
npm install

# Chạy server ở chế độ phát triển (Development)
npm run dev

```

Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 👤 Tác Giả

**Trần Hoàng Khánh (DevK4z)** - Sinh viên ngành Khoa học Máy tính và Kỹ thuật.

* Đại học Việt Nhật (VJU).
* GitHub: [@DevK4z](https://www.google.com/search?q=https://github.com/DevK4z)

*Báo cáo được thực hiện nhằm mục đích hoàn thành Bài tập lớn Giữa kỳ. Cảm ơn giảng viên và các bạn đã dành thời gian đánh giá dự án này!*

```

### Lưu ý nhỏ:
Bạn có thể điều chỉnh lại đường dẫn file `main.cpp` hoặc `main.py` ở mục Hướng dẫn cài đặt cho khớp đúng với tên file thực tế bạn lưu trong thư mục dự án GitHub nhé!

```
