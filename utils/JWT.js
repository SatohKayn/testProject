require('dotenv').config()
const { sign, verify } = require("jsonwebtoken");

const createTokens = (user) => {
  const accessToken = sign(
    { username: user.username, id: user.id },
    process.env.SECRET_KEY
  );

  return accessToken;
};

const validateToken = (req, res, next) => {
  const accessToken = req.cookies["access-token"];

  if (!accessToken)
    return res.redirect("/login")
  try {
    const validToken = verify(accessToken, process.env.SECRET_KEY);
    if (validToken) {
      req.authenticated = true;
      req.id = validToken.id
      return next();
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

module.exports = { createTokens, validateToken };