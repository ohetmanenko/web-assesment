const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const { apiError } = require('../middlewares/errors');
exports.validateId = (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return next(apiError(400, 'Invalid transaction ID.'));
  return next();
};
exports.list = async (req, res, next) => {
  try {
    const records = await Transaction.find({ user: req.user.id }).sort({ date: -1, createdAt: -1, _id: -1 });
    return res.json(records.map(record => record.response()));
  } catch (error) {
    return next(error);
  }
};
exports.read = async (req, res, next) => {
  try {
    const record = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
    if (!record) return next(apiError(404, 'Transaction not found.'));
    return res.json(record.response());
  } catch (error) {
    return next(error);
  }
};
exports.create = async (req, res, next) => {
  try {
    const record = await Transaction.create({ ...req.body, user: req.user.id });
    return res.status(201).json(record.response());
  } catch (error) {
    return next(error);
  }
};
exports.update = async (req, res, next) => {
  try {
    const record = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!record) return next(apiError(404, 'Transaction not found.'));
    return res.json(record.response());
  } catch (error) {
    return next(error);
  }
};
exports.remove = async (req, res, next) => {
  try {
    const record = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!record) return next(apiError(404, 'Transaction not found.'));
    return res.json({ message: 'Transaction deleted.' });
  } catch (error) {
    return next(error);
  }
};
