const express = require("express");
const pool = require("./src/config/db.js");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3333;

// 미들웨어
app.use(cors());
app.use(express.json());

////////////////////////////// 테스트 //////////////////////////////

// Health check 엔드포인트
app.get("/", (req, res) => {
  res.send("서버 작동 중");
});

// DB 연결 테스트 (개발 환경에서만)
if (process.env.NODE_ENV !== "production") {
  app.get("/api/dbtest", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT 1 AS result");
      res.json({ db: "ok", result: rows });
    } catch (err) {
      res.status(500).json({ db: "error", message: err.message });
    }
  });
}

////////////////////////////// 회원 //////////////////////////////
const userRouter = require("./src/routes/auth/user.js");
app.use("/api/user", userRouter);

////////////////////////////// 아이템 //////////////////////////////
const itemRouter = require("./src/routes/item.js");
app.use("/api/items", itemRouter);

////////////////////////////// 공간 //////////////////////////////
const userSpaceRouter = require("./src/routes/userSpace.js");
app.use("/api/user-space", userSpaceRouter);

////////////////////////////// 공간 마커(지도) //////////////////////////////
const mapRouter = require("./src/routes/map.js");
app.use("/api/map", mapRouter);

////////////////////////////// 서버 실행 //////////////////////////////
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
