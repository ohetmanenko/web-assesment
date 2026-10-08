const crypto = require('node:crypto');
const mongoose = require('mongoose');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { normalizeCategory, isDefaultCategory, isDefaultForType, rememberCategory } = require('../helpers/categories');
const fixtures = require('./demo-transactions.json');

const seedDemo = async (user, referenceDate = new Date()) => {
  const today = new Date(referenceDate.toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const records = fixtures.map(({ key, daysAgo, time, ...fields }) => {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - daysAgo);
    const date = day.toISOString().slice(0, 10);
    const category = normalizeCategory(fields.category);
    if (isDefaultCategory(category) && !isDefaultForType(category, fields.type)) {
      throw new Error('Incompatible demo category: ' + key);
    }
    // Stable IDs make re-runs preserve edits as well as unrelated user records.
    const hash = crypto
      .createHash('sha256')
      .update('daily-ledger-demo-v1:' + user.id + ':' + key)
      .digest('hex');
    const createdAt = new Date(date + 'T' + time + ':00.000Z');
    return {
      ...fields,
      category,
      date,
      user: user._id,
      _id: new mongoose.Types.ObjectId(hash.slice(0, 24)),
      createdAt,
      updatedAt: createdAt
    };
  });
  // Validate every fixture before the first database write.
  await Promise.all(records.map(record => new Transaction(record).validate()));
  let created = 0;
  for (const record of records) {
    const filter = { _id: record._id, user: user._id };
    let result;
    try {
      result = await Transaction.updateOne(
        filter,
        { $setOnInsert: record },
        { upsert: true, runValidators: true, timestamps: false }
      );
    } catch (error) {
      if (error.code !== 11000 || !(await Transaction.exists(filter))) throw error;
    }
    if (result?.upsertedCount) created++;
    await rememberCategory(user._id, record.type, record.category);
  }
  const incomeCents = records
    .filter(record => record.type === 'income')
    .reduce((sum, record) => sum + record.amountCents, 0);
  const expenseCents = records
    .filter(record => record.type === 'expense')
    .reduce((sum, record) => sum + record.amountCents, 0);
  return {
    created,
    preserved: records.length - created,
    fixtureCount: records.length,
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents
  };
};

if (require.main === module) {
  require('dotenv').config();
  const { connect, close } = require('./connect');
  (async () => {
    await connect();
    const user = await User.findOne({ email: 'test@meblabs.com' });
    if (!user) throw new Error('Demo user is missing. Run npm run seed first.');
    const result = await seedDemo(user);
    console.info('Fictional demo data for test@meblabs.com: ' + JSON.stringify(result));
    console.info('Existing records and edits were preserved. Fixture totals exclude unrelated existing records.');
  })()
    .catch(error => {
      console.error('Demo seed failed: ' + error.message);
      process.exitCode = 1;
    })
    .finally(close);
}

module.exports = { seedDemo, fixtures };
