const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
// Import hàm seedAdmin (Điều chỉnh đường dẫn theo cấu trúc thư mục của bạn)
const seedAdmin = require("./scripts/seedAdmin");
const seedCandidate = require("./scripts/seedCandidate");
const seedHRData = require("./scripts/seedHRData");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const adminUserRoutes = require("./routes/adminUsers");
const cvRoutes = require("./routes/cv");
const interviewRoutes = require("./routes/interview.routes");
const notificationRoutes = require("./routes/notifications");

const app = express();

// Kết nối DB, sau đó chạy Seed Admin, Candidate và HR Data
connectDB().then(async () => {
  await seedAdmin();
  await seedCandidate();
  await seedHRData();
});

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/cv", cvRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/", (req, res) => {
  res.send("Careerio API Running");
});

app.listen(
  process.env.PORT || 5000,
  () => {
    console.log(
      `Server running on port ${process.env.PORT}`
    );
  }
);