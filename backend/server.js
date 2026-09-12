const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const seedAdmin = require("./scripts/seedAdmin");
const seedCandidate = require("./scripts/seedCandidate");
const seedHRData = require("./scripts/seedHRData");
const seedModerator = require("./scripts/seedModerator");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const adminUserRoutes = require("./routes/adminUsers");
const cvRoutes = require("./routes/cv");
const interviewRoutes = require("./routes/interview.routes");
const notificationRoutes = require("./routes/notifications");
const assessmentRoutes = require("./routes/assessments");
const practiceTopicRoutes = require("./routes/practiceTopics");
const roadmapRoutes = require("./routes/roadmap.route");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

// Kết nối DB, chỉ seed Admin và Moderator mặc định nếu chưa có
connectDB().then(async () => {
  await seedAdmin();
  await seedModerator();
  // seedCandidate và seedHRData đã được tắt để tránh sinh mock data
});

// Cấu hình CORS linh hoạt cho cả Localhost và Production (Vercel)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://carreerio.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = 
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) ||
        process.env.NODE_ENV !== "production";
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
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
app.use("/api/assessments", assessmentRoutes);
app.use("/api/practice-topics", practiceTopicRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Careerio API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
