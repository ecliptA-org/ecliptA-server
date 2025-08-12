const bcrypt = require("bcryptjs");
const {
  findUserByEmail,
  createUser,
  saveRefreshToken,
  findUserByRefreshToken,
  deleteRefreshToken,
} = require("../../repositories/auth/UserRepository");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/tokenUtil");

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

  const accessToken = generateAccessToken({
    user_id: userId,
    email,
    nickname,
    gender,
  });
  const refreshToken = generateRefreshToken({ user_id: userId });

  await saveRefreshToken(userId, refreshToken);

  return { accessToken, refreshToken };
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

  const accessToken = generateAccessToken({
    user_id: user.user_id,
    email: user.email,
    nickname: user.nickname,
    gender: user.gender,
  });
  const refreshToken = generateRefreshToken({ user_id: user.user_id });

  await saveRefreshToken(user.user_id, refreshToken);

  return { accessToken, refreshToken };
};

// Refresh Token으로 새로운 Access Token 재발급
const refreshToken = async (token) => {
  if (!token) {
    throw { status: 401, message: "Refresh Token이 없습니다." };
  }

  const users = await findUserByRefreshToken(token);
  if (users.length === 0) {
    throw { status: 403, message: "유효하지 않은 Refresh Token" };
  }

  const user = users[0];

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "your_jwt_refresh_secret_key"
    );

    // 재발급 대상이 맞는지 재검증
    if (decoded.user_id !== user.user_id) {
      throw new Error();
    }

    const newAccessToken = generateAccessToken({
      user_id: user.user_id,
      email: user.email,
      nickname: user.nickname,
      gender: user.gender,
    });
    const newRefreshToken = generateRefreshToken({ user_id: user.user_id });

    await saveRefreshToken(user.user_id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    throw { status: 403, message: "Refresh Token이 유효하지 않음" };
  }
};

// 로그아웃 시 Refresh Token 삭제
const logoutUser = async (userId) => {
  await deleteRefreshToken(userId);
};

module.exports = {
  signupUser,
  loginUser,
  refreshToken,
  logoutUser,
};
