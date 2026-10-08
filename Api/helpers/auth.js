const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/rt');
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
const setAccessToken = (res, user) => {
  const token = jwt.sign({ type: 'access' }, process.env.JWT_SECRET, { subject: user.id, expiresIn: '15m' });
  res.cookie('accessToken', token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
};
const createSession = async (res, user) => {
  const token = jwt.sign({ type: 'refresh' }, process.env.RT_SECRET, {
    subject: user.id,
    jwtid: crypto.randomUUID(),
    expiresIn: '7d'
  });
  await RefreshToken.create({
    user: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 7 * 86400000)
  });
  res.cookie('refreshToken', token, { ...cookieOptions, maxAge: 7 * 86400000 });
  setAccessToken(res, user);
};
const clearTokens = res => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
module.exports = { createSession, setAccessToken, clearTokens, hashToken };
