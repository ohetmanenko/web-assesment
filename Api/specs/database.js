const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let server;
exports.connect = async () => {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
};
exports.clear = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map(collection => collection.deleteMany({})));
};
exports.close = async () => {
  await mongoose.disconnect();
  if (server) await server.stop();
};
