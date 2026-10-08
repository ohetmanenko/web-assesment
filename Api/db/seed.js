require('dotenv').config();
const User = require('../models/user');
const { connect, close } = require('./connect');
const seed = async () => {
  await connect();
  const email = 'test@meblabs.com';
  const existing = await User.findOne({ email });
  if (!existing) await User.create({ email, password: 'testtest', fullname: 'Test User', lang: 'en' });
  console.info(
    existing ? 'Demo user already exists; existing data was preserved.' : 'Demo user created: test@meblabs.com'
  );
};
seed()
  .catch(error => {
    console.error('Seed failed: ' + error.message);
    process.exitCode = 1;
  })
  .finally(close);
