const pool = require("../../config/db");

// 이메일로 유저 조회
const findUserByEmail = async (email) => {
  const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [
    email,
  ]);
  return rows;
};

// 유저 생성
const createUser = async (email, hashedPassword, nickname, gender) => {
  const [result] = await pool.query(
    "INSERT INTO user (email, password, nickname, gender, status) VALUES (?, ?, ?, ?, ?)",
    [email, hashedPassword, nickname, gender, "ACTIVE"]
  );
  return result.insertId;
};

// refresh token 저장
const saveRefreshToken = async (userId, refreshToken) => {
  await pool.query("UPDATE user SET refresh_token = ? WHERE user_id = ?", [
    refreshToken,
    userId,
  ]);
};

// refresh token으로 유저 조회
const findUserByRefreshToken = async (refreshToken) => {
  const [rows] = await pool.query(
    "SELECT * FROM user WHERE refresh_token = ?",
    [refreshToken]
  );
  return rows;
};

// refresh token 삭제
const deleteRefreshToken = async (userId) => {
  await pool.query("UPDATE user SET refresh_token = NULL WHERE user_id = ?", [
    userId,
  ]);
};

// INACTIVE로 변경
const setInactive = async (userId) => {
  const [result] = await pool.query(
    "UPDATE user SET status = ? WHERE user_id = ?",
    ["INACTIVE", userId]
  );
  return result;
};

// REACTIVE로 변경
const setReactive = async (userId) => {
  const [result] = await pool.query(
    "UPDATE user SET status = ? WHERE user_id = ?",
    ["ACTIVE", userId]
  );
  return result;
};

module.exports = {
  findUserByEmail,
  createUser,
  saveRefreshToken,
  findUserByRefreshToken,
  deleteRefreshToken,
  setInactive,
  setReactive,
};
