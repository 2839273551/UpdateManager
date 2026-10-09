const config = require('../config');
const fs = require('fs');
const path = require('path');

let dbAdapter;

if (config.DB_TYPE === 'mysql') {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    ...config.MYSQL,
    dateStrings: true
  });

  dbAdapter = {
    type: 'mysql',
    pool,
    async get(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows && rows.length > 0 ? rows[0] : null;
    },
    async all(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows || [];
    },
    async run(sql, params = []) {
      const [result] = await pool.query(sql, params);
      return {
        changes: result.affectedRows,
        lastInsertRowid: result.insertId
      };
    },
    async init() {
      // Test connection
      const conn = await pool.getConnection();
      conn.release();
      console.log(`[Database] MySQL 数据库连接成功: ${config.MYSQL.host}:${config.MYSQL.port}/${config.MYSQL.database}`);
    }
  };
} else {
  const Database = require('better-sqlite3');
  if (!fs.existsSync(config.DATA_DIR)) {
    fs.mkdirSync(config.DATA_DIR, { recursive: true });
  }
  const dbPath = path.join(config.DATA_DIR, 'gitdist.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  dbAdapter = {
    type: 'sqlite',
    sqlite,
    async get(sql, params = []) {
      return sqlite.prepare(sql).get(...params) || null;
    },
    async all(sql, params = []) {
      return sqlite.prepare(sql).all(...params);
    },
    async run(sql, params = []) {
      const res = sqlite.prepare(sql).run(...params);
      return {
        changes: res.changes,
        lastInsertRowid: res.lastInsertRowid
      };
    },
    async init() {
      console.log(`[Database] SQLite 数据库加载成功: ${dbPath}`);
    }
  };
}

module.exports = dbAdapter;
