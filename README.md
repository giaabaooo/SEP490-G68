# 🚀 Careerio - Nền tảng Tuyển dụng & Đánh giá Năng lực Thực chiến Tích hợp AI

> **Đồ án Tốt nghiệp Kỹ sư Kỹ thuật Phần mềm (SEP490) - Nhóm G68**  
> *AI-Powered Recruitment & Intelligent Skill Assessment Platform*

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg?logo=vite)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg?logo=mongodb)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-orange.svg?logo=google)](https://ai.google.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-TTS_Audio-black.svg?logo=openai)](https://platform.openai.com/)
[![PayOS](https://img.shields.io/badge/PayOS-Payment_Gateway-blueviolet.svg)](https://payos.vn/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 Mục lục

- [1. Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
- [2. Tính năng nổi bật](#2-tính-năng-nổi-bật)
- [3. Kiến trúc & Công nghệ sử dụng](#3-kiến-trúc--công-nghệ-sử-dụng)
- [4. Cấu trúc thư mục dự án](#4-cấu-trúc-thư-mục-dự-án)
- [5. Tài khoản dùng thử (Seeded Test Accounts)](#5-tài-khoản-dùng-thử-seeded-test-accounts)
- [6. Hướng dẫn cài đặt & Khởi chạy](#6-hướng-dẫn-cài-đặt--khởi-chạy)
- [7. Biến môi trường (.env)](#7-biến-môi-trường-env)
- [8. Danh mục RESTful API Endpoints](#8-danh-mục-restful-api-endpoints)
- [9. Quy chuẩn làm việc & Đóng góp](#9-quy-chuẩn-làm-việc--đóng-góp)

---

## 1. Giới thiệu tổng quan

**Careerio** là nền tảng tuyển dụng thế hệ mới tích hợp Trí tuệ nhân tạo (AI), kết nối liền mạch giữa **Ứng viên (Candidate)**, **Nhà tuyển dụng (Business/HR)**, **Chuyên gia đánh giá (Moderator/SME)** và **Quản trị viên (Admin)**.

Khác với các cổng tuyển dụng truyền thống, Careerio giải quyết bài toán cốt lõi:
- **Nhà tuyển dụng**: Tự động hóa đánh giá và sàng lọc hồ sơ ứng viên theo tiêu chí trọng số bằng AI (ATS AI Screening), tạo bài test đánh giá năng lực thực chiến phù hợp với từng vị trí.
- **Ứng viên**: Được hỗ trợ công cụ trích xuất CV thông minh từ PDF (AI CV Parser), luyện phỏng vấn giọng nói tương tác trực tiếp với AI (Mock AI Interview with TTS), làm bài kiểm tra kỹ năng và nhận **Lộ trình phát triển sự nghiệp cá nhân hóa (AI Career Roadmap)** với các khóa học miễn phí chuẩn mực.

---

## 2. Tính năng nổi bật

### 👨‍🎓 Phân hệ Ứng viên (Candidate)
- **Tìm kiếm & Ứng tuyển việc làm**: Lọc công việc theo địa điểm, mức lương, kỹ năng; xem chi tiết JD.
- **Live CV Match Preview**: Tải lên CV dạng PDF để xem trước điểm số tương thích (0 - 100), phân tích điểm mạnh, điểm yếu và lời khuyên tối ưu CV trước khi nộp.
- **CV Builder & AI Parser**: Tải file PDF CV hiện có để AI tự động bóc tách thành dữ liệu có cấu trúc, chỉnh sửa trên giao diện mẫu chuyên nghiệp và xuất file PDF hoàn chỉnh.
- **AI Mock Interview (Phỏng vấn thử với AI)**:
  - Phỏng vấn đa lượt tương tác trực tiếp với AI, có phát âm giọng nói tự nhiên (OpenAI TTS).
  - Đánh giá khắt khe sau buổi phỏng vấn: Tổng điểm, nhận xét tổng quan, ưu điểm, khuyết điểm và gợi ý cải thiện.
- **Skill Assessments & Practice Tests**:
  - Làm bài trắc nghiệm năng lực chuyên môn theo yêu cầu của công việc hoặc luyện tập tự do trong ngân hàng bài test.
  - Phân tích chi tiết kết quả: Điểm số, thời gian làm bài, danh sách kỹ năng còn yếu.
- **AI Career Roadmap**:
  - Dựa trên kết quả bài test và mục tiêu nghề nghiệp, AI sinh lộ trình học tập theo từng tuần/tháng.
  - Đề xuất các khóa học thực tế miễn phí từ các nền tảng uy tín (Coursera, edX, F8, HubSpot...).
- **Gói dịch vụ Pro (Subscription)**: Nâng cấp gói Candidate Pro thanh toán tự động qua cổng PayOS để mở rộng giới hạn tính năng AI.

### 🏢 Phân hệ Nhà tuyển dụng (Business / HR)
- **Đăng tin tuyển dụng linh hoạt**: Thiết lập mô tả công việc (JD), yêu cầu, mức lương, và **bộ tiêu chí đánh giá trọng số** (Weight Criteria) cho AI chấm điểm.
- **Yêu cầu chuyên gia ra đề (Moderator Request)**: Gán và mời Moderator thiết kế bài kiểm tra chuyên môn riêng biệt cho vị trí tuyển dụng.
- **Quản lý ứng viên (ATS Pipeline)**:
  - Theo dõi ứng viên theo từng trạng thái: `Applied` ➔ `Testing` ➔ `Interviewing` ➔ `Offered` ➔ `Rejected`.
  - Xem điểm số AI Match Score, lý do tiến cử (`reasonToHire`), điểm hạn chế (`reasonToReject`) và điểm chi tiết từng tiêu chí.
- **Gửi thông báo & Email tự động**: Gửi thư mời phỏng vấn, thông báo đậu/trượt trực tiếp đến email của ứng viên qua Nodemailer.
- **Dashboard & Token Credit**: Thống kê số lượng hồ sơ, trạng thái tuyển dụng và nạp Token Credit doanh nghiệp qua PayOS.

### 🧑‍🏫 Phân hệ Chuyên gia Đánh giá (Moderator / SME)
- **Quản lý yêu cầu từ Doanh nghiệp**: Tiếp nhận danh sách các Job cần xây dựng bài đánh giá năng lực.
- **Test Builder thông minh**:
  - Soạn thảo câu hỏi trắc nghiệm thủ công hoặc dùng AI sinh bộ câu hỏi sát với JD công việc.
  - Thiết lập thời gian làm bài, điểm qua môn (Passing score), mức độ câu hỏi (Easy/Medium/Hard).
- **Ngân hàng đề thi (Test Bank)**: Quản lý và tái sử dụng các bộ đề thi đã biên soạn.

### 🛡️ Phân hệ Quản trị viên (Admin)
- **Quản lý người dùng**: Xem danh sách, tìm kiếm, lọc theo vai trò, khóa/mở khóa tài khoản (`active`/`banned`).
- **Phân quyền & Cấp quyền**: Chuyển đổi role, bổ nhiệm Moderator hoặc phân quyền HR.
- **Cấp phát Subscription & Token**: Chủ động cấp gói Pro hoặc cộng Token AI cho tài khoản.
- **Quản lý chủ đề luyện tập (Practice Topics Bank)**: Quản trị các chủ đề và câu hỏi ôn tập chung cho toàn hệ sinh thái.
- **Quản lý giao dịch (Payment Management)**: Thống kê và theo dõi trạng thái toàn bộ giao dịch thanh toán PayOS.

---

## 3. Kiến trúc & Công nghệ sử dụng

### 💻 Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM v7 (Hỗ trợ cấu trúc Layout lồng ghép và Auth Guard)
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **PDF Generation**: `html2pdf.js`
- **Xác thực mạng xã hội**: `@react-oauth/google`
- **Thông báo**: `react-toastify`

### ⚙️ Backend
- **Runtime**: Node.js v20+ / Express.js 5.x
- **Cơ sở dữ liệu**: MongoDB Atlas qua ODM Mongoose 8.x
- **Bảo mật & Xác thực**: JSON Web Token (JWT), Bcrypt.js, CORS
- **Gửi Email**: Nodemailer (Gửi mã OTP, thư thông báo kết quả tuyển dụng)
- **Xử lý tệp & PDF**: Multer, `pdf2json`, `pdf-parse`

### 🤖 AI Core Engine & Thanh toán
- **Google Generative AI**: Gemini API (Tích hợp Smart Fallback luân chuyển tự động giữa: `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`).
- **OpenAI API**: Audio Speech TTS (`tts-1`) phục vụ AI Mock Interview.
- **PayOS**: Cổng thanh toán trực tuyến VietQR chuẩn hóa Open API ngân hàng.

---

## 4. Cấu trúc thư mục dự án

```text
SEP490-G68/
├── backend/
│   ├── config/              # Cấu hình kết nối MongoDB (db.js)
│   ├── controllers/         # Xử lý nghiệp vụ (Auth, Job, CV, AI, Assessment, Payment, ...)
│   ├── middleware/          # Xác thực token (auth.js, authOptional.js, authorize.js)
│   ├── models/              # Mongoose Schemas (User, Job, Application, Assessment, ...)
│   ├── routes/              # Định nghĩa API routes
│   ├── scripts/             # Scripts tự động seed dữ liệu mẫu (Admin, HR, Candidate, Moderator)
│   ├── services/            # Tầng tích hợp AI Service (Gemini & OpenAI TTS)
│   ├── utils/               # Tiện ích gửi email, tính toán hạn mức, upload
│   ├── uploads/             # Thư mục lưu trữ tạm file CV và ảnh đại diện
│   ├── .env.example         # File mẫu cấu hình biến môi trường Backend
│   ├── package.json         # Danh sách thư viện và scripts Backend
│   ├── seedPractice.js      # Script seed ngân hàng câu hỏi luyện tập
│   └── server.js            # Điểm khởi chạy chính của Backend server
│
├── frontend/
│   ├── public/              # Tệp tài nguyên tĩnh
│   ├── src/
│   │   ├── components/      # UI components dùng chung và Layout
│   │   │   ├── layout/      # MainLayout (có Navbar/Footer), PublicLayout
│   │   │   └── AuthGuard.jsx# Bảo vệ route theo trạng thái đăng nhập & phân quyền
│   │   ├── pages/           # Giao diện các chức năng
│   │   │   ├── Admin/       # Quản lý người dùng, giao dịch PayOS
│   │   │   ├── Auth/        # Đăng nhập, đăng ký, OTP, quên mật khẩu, nhận lời mời
│   │   │   ├── Bussiness/   # Dashboard HR, đăng tuyển, quản lý ứng viên, ATS CV List
│   │   │   ├── Candidate/   # Quản lý CV, AI Interview, Test năng lực, Roadmap, Tìm việc
│   │   │   ├── Home/        # Trang chủ Landing Page
│   │   │   ├── Jobs/        # Danh sách & chi tiết việc làm
│   │   │   ├── Moderator/   # Test Builder, Test Bank, yêu cầu kiểm định
│   │   │   ├── Profile/     # Hồ sơ cá nhân và công ty
│   │   │   └── Upgrade/     # Bảng giá gói Pro/Token & xác nhận thanh toán PayOS
│   │   ├── utils/           # Helper tiện ích frontend
│   │   ├── App.jsx          # Cấu hình Router tổng của toàn bộ ứng dụng
│   │   ├── main.jsx         # Điểm gắn kết React DOM & Google OAuth Provider
│   │   └── index.css        # Cấu hình CSS Reset & Tailwind
│   ├── .env.example         # File mẫu cấu hình biến môi trường Frontend
│   ├── package.json         # Danh sách thư viện và scripts Frontend
│   └── vite.config.js       # Cấu hình Vite bundler
│
├── README.md                # Tài liệu hướng dẫn toàn diện dự án
└── .gitignore               # Cấu hình loại trừ file git
```

---

## 5. Tài khoản dùng thử (Seeded Test Accounts)

Hệ thống đã tích hợp sẵn cơ chế **Auto-seeding** khi Backend kết nối Database thành công. Bạn có thể sử dụng trực tiếp các tài khoản kiểm thử sau:

| Vai trò (Role) | Email | Mật khẩu mặc định | Mục đích kiểm thử |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin123@gmail.com` | `123456` | Quản trị người dùng, gán role, duyệt quyền, quản lý giao dịch |
| **Moderator (SME)** | `moderator@gmail.com` | `123456` | Nhận yêu cầu tạo đề, xây dựng bài test bằng AI/thủ công |
| **Business / HR** | `hr@test.com` | `123456` | Đăng tin tuyển dụng, xem ATS CV List, mời Moderator |
| **Candidate** | `candidate@test.com` | `123456` | Ứng tuyển, xem Live CV Match, AI Mock Interview, làm bài test |

---

## 6. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- [Node.js](https://nodejs.org/) phiên bản **20.x trở lên** (Khuyến nghị LTS hoặc v24.x).
- Trình quản lý gói `npm` (v10+ hoặc v11+).
- Một cụm cơ sở dữ liệu **MongoDB Atlas** (hoặc MongoDB Community Server local).

---

### Bước 1: Clone mã nguồn
```bash
git clone https://github.com/giaabaooo/SEP490-G68.git
cd SEP490-G68
```

---

### Bước 2: Cài đặt và cấu hình Backend

1. Mở Terminal thứ nhất và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
   > ⚠️ Mở file `backend/.env` và cập nhật các thông số thực tế (xem chi tiết ở [Mục 7](#7-biến-môi-trường-env)).

4. Khởi chạy Backend Server ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   > Khi khởi động thành công, console sẽ hiển thị:
   > ```text
   > Server running on port 5000
   > MongoDB Connected
   > =======> 🎉 Đã khởi tạo tài khoản Admin thành công !
   > =======> ✅ Đã khởi tạo sẵn tài khoản Moderator: moderator@gmail.com
   > =======> 🎉 Đã khởi tạo tài khoản Candidate test thành công !
   > =======> 🎉 Đã khởi tạo tài khoản HR test thành công !
   > ```

5. *(Tùy chọn)* Khởi tạo bộ câu hỏi luyện tập có sẵn:
   ```bash
   node seedPractice.js
   ```

---

### Bước 3: Cài đặt và cấu hình Frontend

1. Mở Terminal thứ hai và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
4. Khởi chạy Frontend Vite Dev Server:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt và truy cập:
   ```text
   http://localhost:5173
   ```

---

## 7. Biến môi trường (.env)

### Backend (`backend/.env`)
| Tên biến | Mô tả | Giá trị mẫu |
| :--- | :--- | :--- |
| `PORT` | Cổng mạng Backend lắng nghe | `5000` |
| `NODE_ENV` | Chế độ chạy | `development` / `production` |
| `MONGO_URI` | Chuỗi kết nối MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/careerio` |
| `JWT_SECRET` | Khóa bí mật ký xác thực JWT | `your_super_secret_jwt_key` |
| `CLIENT_URL` | URL của Frontend (CORS & Link thư mời) | `http://localhost:5173` |
| `EMAIL_USER` | Tài khoản Gmail gửi OTP / thông báo | `your-email@gmail.com` |
| `EMAIL_PASS` | Mật khẩu ứng dụng Gmail (App Password) | `xxxx xxxx xxxx xxxx` |
| `GOOGLE_CLIENT_ID` | Client ID cho Google OAuth2 Login | `xxxx.apps.googleusercontent.com` |
| `GEMINI_API_KEY` | API Key Google Gemini (Smart Fallback) | `AIzaSy...` |
| `OPENAI_API_KEY` | API Key OpenAI (Dùng cho Text-To-Speech) | `sk-proj-...` |
| `PAYOS_CLIENT_ID` | Client ID từ cổng PayOS | `fed8fcd9-xxxx...` |
| `PAYOS_API_KEY` | API Key từ cổng PayOS | `79255c09-xxxx...` |
| `PAYOS_CHECKSUM_KEY`| Checksum Key từ cổng PayOS | `ff824e14-xxxx...` |

### Frontend (`frontend/.env`)
| Tên biến | Mô tả | Giá trị mặc định |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Địa chỉ gốc của Backend API | `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID Google OAuth tương ứng | `xxxx.apps.googleusercontent.com` |

---

## 8. Danh mục RESTful API Endpoints

Hệ thống Backend cung cấp hơn 40+ RESTful APIs theo tiền tố `/api`:

| Phân hệ | Phương thức | Endpoint | Mô tả chức năng |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Đăng ký tài khoản (Gửi OTP qua email) |
| | `POST` | `/api/auth/verify-otp` | Xác thực OTP đăng ký |
| | `POST` | `/api/auth/login` | Đăng nhập bằng Email & Mật khẩu |
| | `POST` | `/api/auth/google-login` | Đăng nhập qua Google OAuth |
| | `POST` | `/api/auth/forgot-password` | Quên mật khẩu & gửi OTP |
| | `POST` | `/api/auth/reset-password` | Đặt lại mật khẩu mới với OTP |
| | `GET` | `/api/auth/me` | Lấy thông tin tài khoản hiện tại |
| | `POST` | `/api/auth/accept-invite` | Kích hoạt tài khoản Moderator qua thư mời |
| **Profile** | `GET` | `/api/profile` | Lấy thông tin chi tiết hồ sơ người dùng |
| | `PUT` | `/api/profile` | Cập nhật thông tin cá nhân / thông tin công ty |
| | `POST` | `/api/profile/avatar` | Tải lên ảnh đại diện đại diện mới |
| **Jobs** | `GET` | `/api/jobs` | Danh sách tin tuyển dụng (Tìm kiếm, phân trang) |
| | `GET` | `/api/jobs/:id` | Xem chi tiết tin tuyển dụng |
| | `POST` | `/api/jobs` | Đăng tin tuyển dụng mới (HR) |
| | `PUT` | `/api/jobs/:id` | Cập nhật nội dung tin tuyển dụng |
| | `GET` | `/api/jobs/moderator-requests`| Lấy danh sách tin tuyển dụng cần tạo test |
| **Applications** | `POST` | `/api/applications` | Nộp hồ sơ ứng tuyển kèm file CV PDF |
| | `POST` | `/api/applications/preview-match` | Chấm điểm Live CV Match với JD trước khi nộp |
| | `GET` | `/api/applications` | Danh sách ứng viên theo Job (ATS Pipeline) |
| | `GET` | `/api/applications/:id` | Xem chi tiết hồ sơ ứng viên và kết quả chấm AI |
| | `PUT` | `/api/applications/:id/status` | Cập nhật trạng thái ứng viên (Offer, Reject, ...) |
| | `POST` | `/api/applications/:id/notify` | Gửi email thông báo trực tiếp cho ứng viên |
| **CV Builder** | `POST` | `/api/cv/parse-pdf` | AI tự động trích xuất thông tin từ file PDF CV |
| | `POST` | `/api/cv/save` | Lưu mẫu CV vào danh sách cá nhân |
| | `GET` | `/api/cv/my-cvs` | Lấy danh sách các bản CV đã lưu |
| **AI Interview** | `POST` | `/api/interview/mock-interview` | AI hỏi đáp phỏng vấn đa lượt + tạo âm thanh TTS |
| | `POST` | `/api/interview/evaluate-interview` | Đánh giá tổng thể buổi phỏng vấn (Điểm, ưu/nhược) |
| | `GET` | `/api/interview/history` | Xem lại lịch sử các buổi phỏng vấn thử |
| **Assessments** | `POST` | `/api/assessments/generate-ai` | AI tự động sinh câu hỏi trắc nghiệm theo JD |
| | `POST` | `/api/assessments/create` | Tạo bài test đánh giá năng lực (Moderator) |
| | `GET` | `/api/assessments/:id/take` | Lấy đề thi cho ứng viên làm bài |
| | `POST` | `/api/assessments/:id/submit` | Nộp bài thi và nhận điểm số đánh giá |
| **Roadmap** | `GET` | `/api/roadmaps/:sourceId` | Lấy lộ trình học tập đã lưu |
| | `POST` | `/api/roadmaps/generate` | AI tạo lộ trình phát triển dựa trên điểm yếu bài test |
| **Payment** | `POST` | `/api/payment/create-payment-link` | Tạo link thanh toán VietQR qua PayOS |
| | `POST` | `/api/payment/webhook` | Webhook tự động kích hoạt gói/token khi thanh toán |
| | `GET` | `/api/payment/check-status` | Kiểm tra trạng thái giao dịch thanh toán |
| | `GET` | `/api/payment/my-usage` | Kiểm tra hạn mức sử dụng tính năng AI hiện tại |
| **Admin Users** | `GET` | `/api/admin/users` | Danh sách toàn bộ tài khoản người dùng |
| | `PATCH`| `/api/admin/users/:id/status` | Khóa hoặc kích hoạt lại tài khoản |
| | `PATCH`| `/api/admin/users/:id/role` | Phân quyền vai trò người dùng |
| | `PATCH`| `/api/admin/users/:id/subscription`| Cấp gói Pro hoặc cộng Token AI thủ công |

---

## 9. Quy chuẩn làm việc & Đóng góp

### Quản lý mã nguồn với Git
1. **Tuyệt đối không push trực tiếp lên nhánh `main`**.
2. Luôn tạo nhánh riêng cho từng tính năng:
   - Tính năng mới: `feature/<ten-tinh-nang>` (Ví dụ: `feature/ai-interview-feedback`)
   - Sửa lỗi: `fix/<ten-loi>` (Ví dụ: `fix/cv-parse-encoding`)
3. Tạo **Pull Request (PR)**, kiểm tra xung đột mã nguồn và chờ Review trước khi Merge vào `main`.

### Tiêu chuẩn giao diện & Thông báo
- **Thông báo**: Không sử dụng `alert()` hay `confirm()` nguyên bản của trình duyệt. Tất cả các thông báo thành công, cảnh báo, lỗi đều phải sử dụng **`react-toastify`**.
- **Responsive**: Đảm bảo hiển thị chuẩn trên màn hình máy tính bàn, laptop và thiết bị di động.
- **Tối ưu hóa hiệu năng**: Hạn chế sử dụng hiệu ứng làm mờ (`backdrop-blur`) quá mức trên diện tích lớn để đảm bảo tốc độ khung hình mượt mà.

---

## 👥 Thành viên nhóm phát triển (Group G68 - SEP490)

*Dự án được xây dựng và hoàn thiện bởi tập thể thành viên Nhóm G68 - Học kỳ SEP490.*

---
*© 2026 Careerio - All rights reserved.*