require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
// Import hàm seedAdmin (Điều chỉnh đường dẫn theo cấu trúc thư mục của bạn)
const seedAdmin = require("./scripts/seedAdmin"); 

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");

const app = express();

// Kết nối DB, sau đó chạy Seed Admin
connectDB().then(() => {
  seedAdmin();
});

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

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