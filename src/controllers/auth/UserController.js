const { signupUser, loginUser } = require("../../services/auth/UserService");

// 회원가입
const signup = async (req, res) => {
  const { email, password, nickname, gender } = req.body;

  if (!email || !password || !nickname || !gender) {
    return res.status(400).json({ error: "필수 입력 누락" });
  }

  try {
    const { accessToken } = await signupUser({
      email,
      password,
      nickname,
      gender,
    });
    res.status(201).json({ result: "success", token: accessToken });
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
    const { accessToken } = await loginUser({ email, password });
    res.status(200).json({ result: "success", token: accessToken });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "서버 오류" });
  }
};

module.exports = {
  signup,
  login,
};
