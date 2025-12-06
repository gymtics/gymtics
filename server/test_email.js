const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function sendTestEmail() {
    console.log('Configuring transporter with explicit settings...');
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'sivaram101003@gmail.com',
        subject: 'Test Email (Explicit SMTP)',
        text: 'Testing with explicit SMTP settings.'
    };

    console.log(`Attempting to send email from ${process.env.EMAIL_USER} to ${mailOptions.to}...`);
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendTestEmail();
