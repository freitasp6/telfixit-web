// genHash.js
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => {
  console.log(hash);
  process.exit(0);
});
