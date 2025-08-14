const userService = require("../../services/auth/UserService");

// 회원가입
const signup = async (req, res) => {
  const { email, password, nickname, gender } = req.body;

  if (!email || !password || !nickname || !gender) {
    return res.status(400).json({ error: "필수 입력 누락" });
  }

  try {
    const { accessToken, refreshToken } = await userService.signupUser({
      email,
      password,
      nickname,
      gender,
    });

    // HttpOnly 쿠키로 전달
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: true, // HTTPS 환경일 때만
      // secure: false  // 테스트 환경일 때
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.status(201).json({
      result: "success",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "서버 오류" });
  }
};

// 로그인
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "필수 입력 누락" });
  }

  try {
    const { accessToken, refreshToken } = await userService.loginUser({
      email,
      password,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      result: "success",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "서버 오류" });
  }
};

// Refresh Token으로 Access Token 재발급
const tokenRefresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  try {
    const tokens = await userService.refreshToken(token);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (err) {
    res
      .status(err.status || 403)
      .json({ error: err.message || "토큰 재발급 실패" });
  }
};

// 로그아웃 (Refresh Token 삭제)
const logout = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    await userService.logoutUser(user_id);
    res.json({ result: "success", message: "로그아웃이 완료되었습니다." });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
};

// 회원 탈퇴
const inactive = async (req, res) => {
  const { user_id } = req.user;

  try {
    await userService.inactiveAccount(user_id);
    res.json({ result: "success", message: "회원 탈퇴 처리되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "서버 오류" });
  }
};

// 회원 재가입
const reactive = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "필수 입력 누락" });
  }

  try {
    const { accessToken, refreshToken } = await userService.reactiveAccount(
      email,
      password
    );

    res.status(201).json({
      result: "success",
      message: "재가입이 완료되었습니다.",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "서버 오류" });
  }
};

module.exports = {
  signup,
  login,
  tokenRefresh,
  logout,
  inactive,
  reactive,
};
