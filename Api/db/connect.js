const mongoose = require('mongoose');
const connect = async () => {
  if (!process.env.JWT_SECRET || !process.env.RT_SECRET) throw new Error('JWT_SECRET and RT_SECRET are required.');
  if (process.env.JWT_SECRET === process.env.RT_SECRET) throw new Error('JWT_SECRET and RT_SECRET must be different.');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_diary', {
    serverSelectionTimeoutMS: 5000
  });
};
const close = () => mongoose.disconnect();
module.exports = { connect, close };
