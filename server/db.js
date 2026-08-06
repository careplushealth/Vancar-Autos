const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

function formatSql(text, params) {
  if (!params || !params.length) return text;
  return text.replace(/\$(\d+)/g, (_, i) => {
    const val = params[parseInt(i, 10) - 1];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) {
      if (val.length === 0) return 'NULL';
      return val.map(v => typeof v === 'number' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'").join(',');
    }
    return "'" + String(val).replace(/'/g, "''") + "'";
  });
}

module.exports = {
  query: (text, params) => {
    if (params && params.length > 0) {
      return pool.query(formatSql(text, params));
    }
    return pool.query(text);
  },
  pool
};
