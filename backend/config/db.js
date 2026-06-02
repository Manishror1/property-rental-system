// config/db.js
// Design Pattern: SINGLETON PATTERN
// Ek hi database connection puri application me use hoti hai

const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.connection = null;
    Database.instance = this;
  }

  async connect() {
    if (this.connection) {
      logger.info('DB: Reusing existing connection (Singleton)');
      return this.connection;
    }
    try {
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