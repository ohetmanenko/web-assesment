// Optional development fallback while Docker Desktop is unavailable.
// This is a real MongoDB process. Its custom data path survives restarts.
const fs = require('node:fs');
const path = require('node:path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dbPath = path.resolve(__dirname, '../../.local/mongodb-data');
fs.mkdirSync(dbPath, { recursive: true });
let server;
async function stop() {
  if (server) await server.stop({ doCleanup: false });
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
MongoMemoryServer.create({
  binary: { version: '8.2.6' },
  instance: { port: 27017, ip: '127.0.0.1', dbPath, storageEngine: 'wiredTiger' },
  spawn: { windowsHide: true }
})
  .then(instance => {
    server = instance;
    console.log('Local development MongoDB: mongodb://127.0.0.1:27017/expense_diary');
    console.log('Persistent data: .local/mongodb-data; stop with Ctrl+C.');
  })
  .catch(error => {
    console.error('Could not start local MongoDB:', error.message);
    process.exitCode = 1;
  });
