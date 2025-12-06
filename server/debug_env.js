const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pass = process.env.EMAIL_PASS || '';
console.log('--- Debug Info ---');
console.log(`EMAIL_USER: '${process.env.EMAIL_USER}'`);
console.log(`EMAIL_PASS length: ${pass.length}`);
console.log(`EMAIL_PASS starts with space: ${pass.startsWith(' ')}`);
console.log(`EMAIL_PASS ends with space: ${pass.endsWith(' ')}`);
console.log(`EMAIL_PASS contains spaces: ${pass.includes(' ')}`);
console.log('------------------');
