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
// const deleteRefreshToken = async (userId) => {
//   await pool.query("UPDATE user SET refresh_token = NULL WHERE user_id = ?", [
//     userId,
//   ]);
// };

// INACTIVE로 변경
const setInactive = async (userId) => {
  const [result] = await pool.query(
    "UPDATE user SET status = ?, inactive_date = NOW() WHERE user_id = ?", // 탈퇴한 시간: 지금으로 설정
    ["INACTIVE", userId]
  );
  return result;
};

// REACTIVE로 변경
const setReactive = async (userId) => {
  const [result] = await pool.query(
    `UPDATE user
     SET status = 'ACTIVE',
         inactive_date = NULL
     WHERE user_id = ?`, // 재가입 시 탈퇴했던 날짜 삭제해야 돼
    [userId]
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
