// const dns = require("dns");
// dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
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
const seedModerator = require("./scripts/seedModerator");
const assessmentRoutes = require("./routes/assessments");
const practiceTopicRoutes = require("./routes/practiceTopics");
const roadmapRoutes = require("./routes/roadmap.route");
const paymentRoutes = require("./routes/payment.routes");
const app = express();

// Kết nối DB, sau đó chạy Seed Admin, Candidate và HR Data
connectDB().then(async () => {
  await seedAdmin();
  await seedModerator();
  await seedCandidate();
  await seedHRData();
});

// Cấu hình CORS linh hoạt cho cả Localhost và Production (Vercel)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://carreerio.vercel.app"
  
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
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