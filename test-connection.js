const { Client } = require('pg');
// Use the connection string from .env
const connectionString = "postgresql://codelearn@localhost:5432/popub_learn?schema=public";

async function testConnection() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected successfully');
    const res = await client.query('SELECT current_database(), current_user;');
    console.log(res.rows);
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
  }
}

testConnection();