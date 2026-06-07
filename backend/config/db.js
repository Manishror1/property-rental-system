// config/db.js
// Design Pattern: SINGLETON PATTERN
// Ensures only one DB connection instance throughout the app
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Singleton Database Connection
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.connection = null;
    Database.instance = this;
  }

  // Connect to MongoDB
  async connect() {
    if (this.connection) {
      logger.info('DB: Reusing existing connection (Singleton)');
      return this.connection;
    }
    try {
      // Use new URL parser and unified topology for modern MongoDB driver
      const conn = await mongoose.connect(process.env.MONGO_URI);
      this.connection = conn;
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      logger.error(`DB Connection Error: ${error.message}`);
      process.exit(1);
    }
  }
}

module.exports = new Database();