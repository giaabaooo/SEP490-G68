require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
// Import hàm seedAdmin (Điều chỉnh đường dẫn theo cấu trúc thư mục của bạn)
const seedAdmin = require("./scripts/seedAdmin"); 
const seedCandidate = require("./scripts/seedCandidate");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const jobRoutes = require("./routes/jobs");

const app = express();

// Kết nối DB, sau đó chạy Seed Admin và Seed Candidate
connectDB().then(async () => {
  await seedAdmin();
  await seedCandidate();
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