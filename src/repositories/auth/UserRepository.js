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

module.exports = {
  findUserByEmail,
  createUser,
};
