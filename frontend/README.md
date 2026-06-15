# 🚀 Careerio - Nền tảng Hỗ trợ Kết nối Tuyển dụng Thực chiến

Dự án Frontend được xây dựng bằng **React + Vite**. Tài liệu này hướng dẫn cách cài đặt môi trường, quy chuẩn cấu trúc thư mục và cách sử dụng Layout để cả nhóm làm việc hiệu quả, tránh conflict code.

---

## 🛠️ Hướng dẫn cài đặt và khởi chạy

Yêu cầu hệ thống: Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 18+).

1. **Clone dự án về máy:**
   ```bash
   git clone <link-repo-github-cua-ban>
   chia 2 terminal
   SEP490-G68/frontend
   SEP490-G68/backend


2. Cài đặt thư viện (Dependencies):

Bash
npm install


3. Chạy server ở chế độ Development:

Bash
npm run dev

## Cấu trúc thư mục dự án

frontend/src/
├── components/          # Chứa các UI Components dùng chung
│   └── layout/          # Layout bọc ngoài các trang
│       ├── MainLayout.jsx    # Layout CÓ Navbar và Footer (dùng cho trang Home, Profile...)
│       ├── PublicLayout.jsx  # Layout KHÔNG CÓ Navbar (dùng cho Login, Register)
│       ├── Navbar.jsx        # Thanh điều hướng trên cùng
│       └── Footer.jsx        # Chân trang
├── pages/               # Chứa code của từng trang cụ thể
│   ├── Auth/                 # Khu vực của chức năng Đăng nhập/Đăng ký
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Home/                 # Khu vực của trang chủ
│   │   └── Home.jsx
│   └── ComingSoon/           # Trang giữ chỗ cho các chức năng chưa làm
│       └── ComingSoon.jsx
├── App.jsx              # Cấu hình Router tổng của cả App
├── index.css            # CSS Reset chung (hạn chế sửa file này)
└── main.jsx             # File khởi chạy gốc của Vite

🧩 Hướng dẫn sử dụng Layout & Route
Dự án hiện tại sử dụng react-router-dom để điều hướng. Khi một thành viên nhận task làm trang mới (ví dụ: Trang Profile), vui lòng làm theo các bước sau:

Bước 1: Tạo thư mục cho trang mới
Tạo thư mục src/pages/Profile/ và code file Profile.jsx trong đó. Mọi CSS nên nhúng trực tiếp vào bằng thẻ <style> hoặc dùng thư viện tương đương, không tạo file .css rác. (Đặc biệt: Không sử dụng hiệu ứng blur để tối ưu hiệu suất).

Bước 2: Cấu hình Route trong App.jsx
Xác định trang này cần Layout nào?

Nếu là trang bình thường (cần thanh menu trên cùng): Bỏ vào trong <Route element={<MainLayout />}>.

Nếu là trang landing/xác thực (không cần menu): Bỏ vào trong <Route element={<PublicLayout />}>.
// File src/App.jsx

// 1. Khai báo import
import Profile from './pages/Profile/Profile';
import ComingSoon from './pages/ComingSoon/ComingSoon';

// 2. Nhúng vào Router tương ứng
<Route element={<MainLayout />}>
  <Route path="/home" element={<Home />} />
  <Route path="/profile" element={<Profile />} /> {/* Trang bạn vừa làm */}
  
  {/* Nếu link trên Navbar chưa có người code, gắn tạm trang ComingSoon vào */}
  <Route path="/employer-ats" element={<ComingSoon />} />
</Route>

🔔 Quy chuẩn chung khi Code
Thông báo hệ thống: Không dùng alert() mặc định của trình duyệt hay modal tự chế. Toàn bộ thông báo thành công/thất bại phải dùng react-toastify.

Quản lý Git: * Không code đè trực tiếp lên nhánh main hoặc giao-dien.

Hãy tự tạo nhánh riêng (tên của mình).

Code xong tạo Pull Request để review trước khi merge.