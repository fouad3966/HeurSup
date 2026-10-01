const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Connected to Neon DB successfully!");

    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    
    // Execute the schema creation SQL
    await client.query(sql);
    console.log("Schema pushed successfully via pg driver!");

  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();
