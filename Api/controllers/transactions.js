const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const { apiError } = require('../middlewares/errors');
const {
  normalizeCategory,
  isDefaultCategory,
  isDefaultForType,
  categoryAvailable,
  rememberCategory
} = require('../helpers/categories');

const categoryData = async (body, user, previous) => {
  const { customCategoryName, ...data } = body;
  const type = data.type || previous?.type;
  const category = normalizeCategory(customCategoryName || data.category || previous?.category);
  if (category.length > 64) throw apiError(400, 'Category must contain at most 64 characters.', 400, 'category');
  if (isDefaultCategory(category) && !isDefaultForType(category, type))
    throw apiError(400, 'Choose a category for the selected transaction type.', 400, 'category');
  if (previous && type !== previous.type && category === normalizeCategory(previous.category) && !customCategoryName) {
    if (!(await categoryAvailable(user, type, category)))
      throw apiError(400, 'Choose a category again when changing transaction type.', 400, 'category');
  }
  return { ...data, type, category };
};
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
    const data = await categoryData(req.body, req.user.id);
    await rememberCategory(req.user.id, data.type, data.category);
    const record = await Transaction.create({ ...data, user: req.user.id });
    return res.status(201).json(record.response());
  } catch (error) {
    return next(error);
  }
};
exports.update = async (req, res, next) => {
  try {
    const previous = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
    if (!previous) return next(apiError(404, 'Transaction not found.'));
    const data = await categoryData(req.body, req.user.id, previous);
    await rememberCategory(req.user.id, data.type, data.category);
    // Category validation depends on this pair; do not overwrite a concurrent reclassification.
    const record = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, type: previous.type, category: previous.category },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!record) {
      const exists = await Transaction.exists({ _id: req.params.id, user: req.user.id });
      return next(
        exists
          ? apiError(409, 'Transaction changed. Reload it and try again.')
          : apiError(404, 'Transaction not found.')
      );
    }
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
