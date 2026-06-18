require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes =
  require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();

connectDB();

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

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