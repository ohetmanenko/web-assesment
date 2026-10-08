const express = require('express');
const { isAuth } = require('../middlewares/isAuth');
const { catalogForUser } = require('../helpers/categories');
const router = express.Router();
router.get('/', isAuth, async (req, res, next) => {
  try {
    return res.json(await catalogForUser(req.user.id));
  } catch (error) {
    return next(error);
  }
});
module.exports = router;
