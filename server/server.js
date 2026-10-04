require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { initOverdueNotifier } = require('./cron/overdueNotifier');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    initOverdueNotifier();
    app.listen(PORT, () => {
      console.log(`[Sylo Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error(`[Sylo Server] Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
