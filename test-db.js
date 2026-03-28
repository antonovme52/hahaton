const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    user: 'codelearn',
    host: '127.0.0.1',
    database: 'popub_learn',
    password: 'codelearn123',
    port: 5432,
  });

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