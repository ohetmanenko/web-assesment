const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const schema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    fullname: { type: String, required: true, trim: true },
    lang: { type: String, default: 'en' }
  },
  { timestamps: true }
);
schema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});
schema.methods.response = function response() {
  return { _id: this.id, email: this.email, fullname: this.fullname, lang: this.lang };
};
module.exports = mongoose.models.User || mongoose.model('User', schema);
