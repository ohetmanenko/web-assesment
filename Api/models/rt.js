const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 }
});
module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', schema);
