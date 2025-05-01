// init.js — script de setup cross-platform
const fs = require('fs');
const path = require('path');

// 1) pastas
['data','public'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// 2) ficheiros iniciais
const files = [
  'data/wos.json',
  'data/equipas.json',
  'data/users.json',
  'index.js',
  'public/login.html',
  'public/index.html',
  'public/auth.js',
  'public/app.js',
  'public/users.html',
  'public/mobile.html'
];

files.forEach(f => {
  const dir = path.dirname(f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, '');
});

console.log('✅ Estrutura de pastas e ficheiros criada:');
files.forEach(f => console.log('   •', f));
