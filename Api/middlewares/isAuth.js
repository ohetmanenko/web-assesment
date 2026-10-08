const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const { apiError } = require('./errors');
const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return next(apiError(401, 'Please sign in.'));
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.type !== 'access' || !mongoose.isObjectIdOrHexString(payload.sub))
      return next(apiError(401, 'Your session is invalid. Please sign in.'));
    const user = await User.findById(payload.sub);
    if (!user) return next(apiError(401, 'Please sign in.'));
    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return next(apiError(401, 'Your session has expired. Please sign in.'));
    return next(error);
  }
};
module.exports = { isAuth };
