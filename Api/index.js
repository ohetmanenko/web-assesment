require('dotenv').config();
const app = require('./app');
const { connect, close } = require('./db/connect');
const start = async () => {
  await connect();
  const port = Number(process.env.PORT || 4000);
  const server = app.listen(port, '127.0.0.1', () => console.info('Expense Diary API: http://127.0.0.1:' + port));
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(async () => {
      await close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};
start().catch(error => {
  console.error('API startup failed: ' + error.message);
  process.exitCode = 1;
});
