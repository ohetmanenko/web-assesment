const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, check, refresh, logout } = require('../controllers/auth');
const { isAuth } = require('../middlewares/isAuth');
const router = express.Router();
if (process.env.NODE_ENV !== 'test') {
  router.use(
    '/login',
    rateLimit({
      windowMs: 60000,
      limit: 20,
      message: { error: 429, message: 'Too many login attempts. Try again in a minute.', data: {} }
    })
  );
}
router.post('/login', login);
router.get('/check', isAuth, check);
router.post('/rt', refresh);
router.post('/logout', logout);
module.exports = router;
