const jwt = require("jsonwebtoken");

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "your_jwt_secret_key", {
    expiresIn: "1h",
  });
};

module.exports = {
  generateAccessToken,
};
