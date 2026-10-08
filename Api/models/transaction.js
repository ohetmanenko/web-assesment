const mongoose = require('mongoose');
const { isCalendarDate, MAX_AMOUNT_CENTS } = require('../helpers/transactions');
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amountCents: { type: Number, required: true, min: 1, max: MAX_AMOUNT_CENTS, validate: Number.isSafeInteger },
    category: { type: String, required: true, trim: true, maxlength: 64 },
    date: { type: String, required: true, validate: isCalendarDate },
    description: { type: String, trim: true, maxlength: 500, default: '' }
  },
  { timestamps: true, versionKey: false }
);
schema.index({ user: 1, date: -1, createdAt: -1 });
schema.methods.response = function response() {
  const record = this.toObject();
  delete record.user;
  return record;
};
module.exports = mongoose.models.Transaction || mongoose.model('Transaction', schema);
