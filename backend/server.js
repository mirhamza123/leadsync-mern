require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const leadRoutes = require("./routes/leads");
const keywordRoutes = require("./routes/keywords");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "LeadSync API running" });
});

app.use("/api/leads", leadRoutes);
app.use("/api/keywords", keywordRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
