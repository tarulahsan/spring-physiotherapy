import initSqlJs from 'sql.js-httpvfs';
import { createDbWorker } from "sql.js-httpvfs";

const workerUrl = new URL(
  "sql.js-httpvfs/dist/sqlite.worker.js",
  import.meta.url
);
const wasmUrl = new URL("sql.js-httpvfs/dist/sql-wasm.wasm", import.meta.url);

const DB_URL = '/database.db';

// Database worker configuration
const workerConfig = {
  from: "inline",
  config: {
    serverMode: "full",
    url: DB_URL,
    requestChunkSize: 4096,
  },
};

class Database {
  static instance = null;
  
  static async getInstance() {
    if (!Database.instance) {
      const worker = await createDbWorker(
        [workerConfig],
        workerUrl.toString(),
        wasmUrl.toString()
      );
      Database.instance = new Database(worker);
      await Database.instance.init();
    }
    return Database.instance;
  }

  constructor(worker) {
    this.worker = worker;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Create tables if they don't exist
    await this.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'VIEWER' NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        patient_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        gender TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS therapies (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        type TEXT NOT NULL,
        date DATETIME NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
      );
    `);

    // Create default admin user if not exists
    const adminExists = await this.get(
      "SELECT * FROM users WHERE email = ?",
      ["musadumc@gmail.com"]
    );

    if (!adminExists) {
      const hashedPassword = await this.hashPassword("Musa@234");
      await this.exec(
        `INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)`,
        [this.generateId(), "musadumc@gmail.com", hashedPassword, "ADMIN"]
      );
    }

    this.initialized = true;
  }

  async exec(sql, params = []) {
    return await this.worker.db.exec(sql, params);
  }

  async get(sql, params = []) {
    const result = await this.exec(sql, params);
    return result[0]?.values[0];
  }

  async all(sql, params = []) {
    const result = await this.exec(sql, params);
    return result[0]?.values || [];
  }

  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async verifyPassword(password, hash) {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }
}

export default Database;
