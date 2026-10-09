const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, local router/ISP DNS servers frequently fail to resolve MongoDB Atlas SRV records,
// triggering `querySrv ETIMEOUT`. Setting public resolvers (Google / Cloudflare) guarantees resolution.
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if running in constrained sandbox
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sylo_dev';

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

// Event monitoring
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Connection established.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Runtime error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Attempting reconnect...');
});

// Clean shutdown helper
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed gracefully.');
};

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };
