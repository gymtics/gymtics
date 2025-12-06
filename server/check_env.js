const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Checking Environment Variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Present' : 'Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Present' : 'Missing');
