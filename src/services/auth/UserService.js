const bcrypt = require("bcryptjs");
const {
  findUserByEmail,
  createUser,
} = require("../../repositories/auth/UserRepository");
const { generateAccessToken } = require("../../utils/tokenUtil");

// 회원가입
const signupUser = async ({ email, password, nickname, gender }) => {
  // 이메일 중복 체크
  const existingUser = await findUserByEmail(email);
  if (existingUser.length > 0) {
    throw { status: 409, message: "이미 존재하는 이메일" };
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  // DB 등록
  const userId = await createUser(email, hashedPassword, nickname, gender);

  // Access Token 발급
  const accessToken = generateAccessToken({
    user_id: userId,
    email,
    nickname,
    gender,
  });

  return { accessToken };
};

// 로그인
const loginUser = async ({ email, password }) => {
  // 유저 조회
  const users = await findUserByEmail(email);
  if (users.length === 0) {
    throw { status: 404, message: "존재하지 않는 이메일" };
  }

  const user = users[0];

  // 상태값 체크 (비활성 계정 로그인 막기)
  if (user.status !== "ACTIVE") {
    throw { status: 403, message: "비활성 계정입니다." };
  }

  // 비밀번호 비교
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: "비밀번호 불일치" };
  }

  // Access Token 발급
  const accessToken = generateAccessToken({
    user_id: user.user_id,
    email: user.email,
    nickname: user.nickname,
    gender: user.gender,
  });

  return { accessToken };
};

module.exports = {
  signupUser,
  loginUser,
};
