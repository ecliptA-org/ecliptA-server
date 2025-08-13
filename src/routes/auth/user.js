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
router.patch("/inactive", auth, UserController.inactive);

// 회원 재가입 엔드포인트
router.patch("/reactive", auth, UserController.reactive);

module.exports = router;
