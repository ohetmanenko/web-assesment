const Category = require('../models/category');
const Transaction = require('../models/transaction');

const DEFAULT_CATEGORIES = {
  expense: ['Food & drinks', 'Transport', 'Shopping', 'Home', 'Health', 'Entertainment', 'Other'],
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other']
};
const defaults = [...new Set(Object.values(DEFAULT_CATEGORIES).flat())];
const normalizeCategory = value => {
  const cleaned = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  const preset = defaults.find(name => name.toLowerCase() === cleaned.toLowerCase());
  return preset || cleaned.toLowerCase().replace(/(^|[\s\-_])\p{L}/gu, match => match.toUpperCase());
};
const isDefaultCategory = name => defaults.includes(name);
const isDefaultForType = (name, type) => DEFAULT_CATEGORIES[type].includes(name);

const catalogForUser = async user => {
  const [categories, existing] = await Promise.all([
    Category.find({ user }).select('type name -_id').lean(),
    Transaction.find({ user }).select('type category -_id').lean()
  ]);
  const custom = { expense: new Set(), income: new Set() };
  // Include custom values from older diary records without requiring a migration.
  for (const item of [...categories, ...existing]) {
    const name = normalizeCategory(item.name || item.category);
    if (!isDefaultCategory(name)) custom[item.type].add(name);
  }
  return {
    defaults: DEFAULT_CATEGORIES,
    custom: Object.fromEntries(
      Object.entries(custom).map(([type, names]) => [type, [...names].sort((a, b) => a.localeCompare(b))])
    )
  };
};
const categoryAvailable = async (user, type, name) => {
  if (isDefaultCategory(name)) return isDefaultForType(name, type);
  const catalog = await catalogForUser(user);
  return catalog.custom[type].includes(name);
};
const rememberCategory = async (user, type, name) => {
  if (isDefaultCategory(name)) return;
  const filter = { user, type, name };
  try {
    await Category.updateOne(filter, { $setOnInsert: filter }, { upsert: true, runValidators: true });
  } catch (error) {
    // Concurrent submissions may try to create the same unique category.
    if (error.code !== 11000 || !(await Category.exists(filter))) throw error;
  }
};
module.exports = {
  normalizeCategory,
  isDefaultCategory,
  isDefaultForType,
  catalogForUser,
  categoryAvailable,
  rememberCategory
};
