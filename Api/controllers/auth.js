const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const RefreshToken = require('../models/rt');
const { createSession, setAccessToken, clearTokens, hashToken } = require('../helpers/auth');
const { apiError } = require('../middlewares/errors');
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (
      typeof email !== 'string' ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      !password ||
      password.length > 128
    )
      return next(apiError(400, 'A valid email and password are required.'));
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password)))
      return next(apiError(401, 'Email or password is incorrect.', 301));
    await createSession(res, user);
    return res.json(user.response());
  } catch (error) {
    return next(error);
  }
};
exports.check = (req, res) => res.json(req.user.response());
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return next(apiError(401, 'Please sign in again.', 308));
    const payload = jwt.verify(token, process.env.RT_SECRET, { algorithms: ['HS256'] });
    if (payload.type !== 'refresh' || !mongoose.isObjectIdOrHexString(payload.sub))
      return next(apiError(401, 'Please sign in again.', 308));
    const session = await RefreshToken.findOne({
      tokenHash: hashToken(token),
      user: payload.sub,
      expiresAt: { $gt: new Date() }
    });
    const user = session && (await User.findById(payload.sub));
    if (!user) return next(apiError(401, 'Please sign in again.', 308));
    setAccessToken(res, user);
    return res.json(user.response());
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return next(apiError(401, 'Please sign in again.', 308));
    return next(error);
  }
};
exports.logout = async (req, res, next) => {
  try {
    if (req.cookies.refreshToken) await RefreshToken.deleteOne({ tokenHash: hashToken(req.cookies.refreshToken) });
    clearTokens(res);
    return res.json({ message: 'Signed out.' });
  } catch (error) {
    return next(error);
  }
};
