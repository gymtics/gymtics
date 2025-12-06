const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const user = process.env.EMAIL_USER || '';
console.log(`User: '${user}'`);
console.log('Char codes:');
for (let i = 0; i < user.length; i++) {
    process.stdout.write(`${user.charCodeAt(i)} `);
}
console.log('\n');
