const app = require('./app');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

// data base field
const mongoose = require('mongoose');

const db = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(db).then((c) => {
  console.log('hello from db');
});

//
const port = 3000;
const server = app.listen(port, () => {
  console.log('start listning...');
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection ! 💣 Shutting Down...');
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
