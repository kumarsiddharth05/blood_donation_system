// Run this ONCE to generate correct bcrypt hashes for seed.sql
// Usage: node generate-hashes.js
const bcrypt = require('./server/node_modules/bcryptjs');

async function main() {
  const passwords = [
    { label: 'admin123',     value: 'admin123' },
    { label: 'donor123',     value: 'donor123' },
    { label: 'recipient123', value: 'recipient123' },
  ];

  for (const p of passwords) {
    const hash = await bcrypt.hash(p.value, 10);
    console.log(`${p.label}: ${hash}`);
  }
}

main();
