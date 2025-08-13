const jwt = require("jsonwebtoken");

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "your_jwt_secret_key", {
    expiresIn: "1h", // access token의 유효 기간을 1시간으로 잡습니다.
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || "your_jwt_refresh_secret_key",
    {
      expiresIn: "7d", // refresh token의 유효 기간을 7일(일주일)로 잡습니다.
    }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
