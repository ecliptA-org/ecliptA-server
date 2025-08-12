const express = require("express");
const auth = require("../../middlewares/auth");
const UserController = require("../../controllers/auth/UserController");

// 정리되면 추후 삭제
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");

const router = express.Router();

// 회원가입 엔드포인트
router.post("/signup", UserController.signup);

// 로그인 엔드포인트
router.post("/login", auth, UserController.login);

// refresh token으로 access token 재발급 엔드포인트
router.post("/token/refresh", UserController.tokenRefresh);

// 로그아웃 엔드포인트
router.post("/logout", auth, UserController.logout);

// 회원탈퇴 엔드포인트
router.patch("/inactive", auth, async (req, res) => {
  // req.user는 토큰에서 추출된 사용자 정보
  const { user_id } = req.user;

  try {
    const [result] = await pool.query(
      "UPDATE user SET status = ? WHERE user_id = ?",
      ["INACTIVE", user_id]
    );
    console.log("user_id:", user_id, "affectedRows:", result.affectedRows);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "해당하는 계정이 없습니다." });
    }
    res.json({ result: "success" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 회원 재가입 엔드포인트
router.patch("/active", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "필수 입력 누락" });
  }
  try {
    // 이메일로 사용자 조회
    const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "존재하지 않는 이메일" });

    const user = rows[0];

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "비밀번호 불일치" });

    // 이미 ACTIVE라면 리턴
    if (user.status === "ACTIVE") {
      return res.status(400).json({ error: "이미 활성 상태입니다." });
    }

    // 사용자 상태를 ACTIVE로 변경
    const { user_id, nickname, gender } = user;
    const [result] = await pool.query(
      "UPDATE user SET status = ? WHERE user_id = ?",
      ["ACTIVE", user_id]
    );
    console.log("user_id:", user_id, "affectedRows:", result.affectedRows);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "해당하는 계정이 없습니다." });
    }

    // JWT 토큰 발급
    const token = jwt.sign(
      { user_id, email, nickname, gender },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ result: "success", token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
