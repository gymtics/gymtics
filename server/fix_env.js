const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Regex to find EMAIL_PASS and remove spaces from its value
    // This handles EMAIL_PASS=xxxx xxxx or EMAIL_PASS="xxxx xxxx"
    envContent = envContent.replace(/EMAIL_PASS=(.*)/, (match, p1) => {
        const cleanPass = p1.replace(/\s/g, '').replace(/"/g, '').replace(/'/g, '');
        console.log(`Fixed password: ${cleanPass}`);
        return `EMAIL_PASS=${cleanPass}`;
    });

    fs.writeFileSync(envPath, envContent);
    console.log('.env file updated successfully.');
} catch (err) {
    console.error('Error updating .env:', err);
}
