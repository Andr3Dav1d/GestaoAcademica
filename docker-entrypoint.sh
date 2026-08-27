#!/bin/sh
set -e

echo "[entrypoint] Aplicando migrations do Drizzle..."

node << 'EOF'
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    const migrationsDir = path.join(__dirname, 'drizzle')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log('[entrypoint] Aplicando:', file)
      await client.query(sql)
    }
    console.log('[entrypoint] Migrations concluídas.')
  } catch (err) {
    console.error('[entrypoint] Erro nas migrations:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
EOF

exec "$@"
