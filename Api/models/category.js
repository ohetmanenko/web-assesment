const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    name: { type: String, required: true, trim: true, maxlength: 64 }
  },
  { timestamps: true, versionKey: false }
);
schema.index({ user: 1, type: 1, name: 1 }, { unique: true });
module.exports = mongoose.models.Category || mongoose.model('Category', schema);
