const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { sequelize, User, GymLog, WorkoutItem, MealItem, WeightLog, ManualPR, Feedback, OTP } = require('./models');

dotenv.config();

const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');

// Logger Configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({ format: winston.format.simple() }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

const PORT = process.env.PORT || 5001;
// Cluster support removed for SQLite compatibility on Render
// const cluster = require('cluster');
// const os = require('os');

const app = express();

// Enable trust proxy for Render (required for rate limiting behind load balancer)
app.set('trust proxy', 1);

// Request Logging (Moved to top)
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logging


// Database Connection & Sync
sequelize.authenticate()
    .then(() => {
        console.log('✅ SQLite Database Connected');
        return sequelize.sync({ alter: true }); // Sync models with DB (Alter to update schema)
    })
    .then(() => console.log('✅ Models Synced'))
    .catch(err => console.error('❌ Database Error:', err));

// In-memory storage for OTPs REMOVED
// const otps = {}; // { emailOrPhone: { code, expires } }

// Email Transporter
// Email Transporter
// Email Transporter
// Email Transporter
// Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    },
    // Force IPv4
    family: 4,
    // General timeouts
    connectionTimeout: 10000,
    socketTimeout: 10000,
    debug: true,
    logger: true
});

// Verify Email Configuration on Startup
const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

if (emailUser && emailPass) {
    console.log(`[Email] Configured with user: ${emailUser}`);
    // Verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.error('[Email] Connection verification failed:', error);
        } else {
            console.log('[Email] Server is ready to take our messages');
        }
    });
} else {
    console.warn('[Email] Missing SMTP/EMAIL credentials. Emails will NOT be sent.');
}

// Twilio Client
const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_TOKEN
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    : null;

// Helper: Generate 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// API: Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { method, identifier, type } = req.body;
        if (!identifier) return res.status(400).json({ error: 'Identifier required' });

        // Optional: Check user existence based on type
        if (type === 'register') {
            const existing = await User.findOne({ where: { email: identifier } });
            if (existing) return res.status(400).json({ error: 'User already exists' });
        } else if (type === 'reset') {
            const existing = await User.findOne({ where: { email: identifier } });
            if (!existing) return res.status(400).json({ error: 'User not found' });
        }

        const code = generateOTP();
        const expires = new Date(Date.now() + 300000); // 5 min expiry

        // Store OTP in Database
        try {
            // Remove any existing OTP for this identifier
            await OTP.destroy({ where: { identifier } });
            // Create new OTP
            await OTP.create({ identifier, code, expires });
        } catch (dbErr) {
            console.error('Database Error (OTP Save):', dbErr);
            return res.status(500).json({ error: 'Failed to generate OTP' });
        }

        console.log(`[OTP] Generated for ${identifier}: ${code}. Method: ${method}`);

        if (method === 'email') {
            console.log('[Email] Attempting to send email...');
            const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
            const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

            if (emailUser && emailPass) {
                try {
                    console.log(`[Email] Using credentials: ${emailUser}`);
                    const info = await transporter.sendMail({
                        from: process.env.EMAIL_FROM || emailUser,
                        to: identifier,
                        subject: 'Your Gym App Verification Code',
                        text: `Your verification code is: ${code}`
                    });
                    console.log(`[Email] Sent to ${identifier}. MessageID: ${info.messageId}`);
                } catch (emailErr) {
                    console.error('[Email] Failed to send to:', identifier);
                    console.error('[Email] Error details:', emailErr);
                    // Continue even if email fails, so user can maybe see OTP in logs or try again
                }
            } else {
                console.warn(`[Email] Mock sent to ${identifier} (Missing credentials)`);
                console.error('Missing SMTP_USER/EMAIL_USER or SMTP_PASS/EMAIL_PASS env vars');
            }
        } else if (method === 'sms') {
            if (twilioClient && process.env.TWILIO_PHONE) {
                try {
                    await twilioClient.messages.create({
                        body: `Your Gym App code is: ${code}`,
                        from: process.env.TWILIO_PHONE,
                        to: identifier
                    });
                    console.log(`[SMS] Sent to ${identifier}`);
                } catch (smsErr) {
                    console.error('[SMS] Failed to send:', smsErr);
                }
            } else {
                console.log(`[SMS] Mock sent to ${identifier} (Missing credentials)`);
            }
        }
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP Error:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to send OTP: ' + error.message });
    }
});

// API: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    const { identifier, code } = req.body;

    try {
        const record = await OTP.findOne({ where: { identifier } });

        if (!record) return res.status(400).json({ error: 'OTP not found or expired' });

        if (new Date() > new Date(record.expires)) {
            await OTP.destroy({ where: { identifier } });
            return res.status(400).json({ error: 'OTP expired' });
        }

        if (record.code === code) {
            await OTP.destroy({ where: { identifier } });
            res.json({ success: true, message: 'OTP verified' });
        } else {
            res.status(400).json({ error: 'Invalid OTP' });
        }
    } catch (err) {
        console.error('Verify OTP Error:', err);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// API: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // Verify OTP
        const record = await OTP.findOne({ where: { identifier: email } });
        if (!record) return res.status(400).json({ error: 'OTP not found or expired' });

        if (new Date() > new Date(record.expires)) {
            await OTP.destroy({ where: { identifier: email } });
            return res.status(400).json({ error: 'OTP expired' });
        }

        if (record.code !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Consume OTP
        await OTP.destroy({ where: { identifier: email } });

        // Update Password
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        await user.update({ password: newPassword }); // In prod, hash!

        console.log(`[Auth] Password reset for: ${email}`);
        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('[Auth] Reset Password Error:', err.message);
        console.error(err.stack);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// API: Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, phone, password } = req.body;
    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const newUser = await User.create({ username, email, password, avatar: null }); // In prod, hash password!
        console.log(`[Auth] Registered user: ${username} (${email})`);
        res.json({ success: true, user: { ...newUser.toJSON(), password: undefined } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// API: Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username: email }]
            }
        });

        if (user && user.password === password) { // In prod, compare hash!
            console.log(`[Auth] Logged in: ${user.username}`);
            res.json({ success: true, user: { ...user.toJSON(), password: undefined } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login Error:', err.message, err.stack);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// API: Update Avatar
app.post('/api/auth/update-avatar', async (req, res) => {
    const { userId, avatar } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ avatar });
        res.json({ success: true, user: { ...user.toJSON(), password: undefined } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

// --- DATA APIs ---

// Get History (Gym Logs)
app.get('/api/data/history/:userId', async (req, res) => {
    try {
        const logs = await GymLog.findAll({
            where: { userId: req.params.userId },
            include: [WorkoutItem, MealItem]
        });

        // Convert to object keyed by date for frontend
        const history = {};
        logs.forEach(log => {
            const logJson = log.toJSON();
            history[log.date] = {
                ...logJson,
                workouts: logJson.WorkoutItems || [],
                meals: logJson.MealItems || []
            };
        });
        res.json({ success: true, history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Save/Update Gym Log (Workout/Meal)
app.post('/api/data/log', async (req, res) => {
    const { userId, date, gymVisited, workouts, meals } = req.body;
    try {
        let log = await GymLog.findOne({ where: { userId, date } });

        if (!log) {
            log = await GymLog.create({ userId, date, gymVisited });
        } else {
            await log.update({ gymVisited });
        }

        // Sync Workouts (Delete old, create new - simple approach)
        await WorkoutItem.destroy({ where: { gymLogId: log.id } });
        if (workouts && workouts.length > 0) {
            const workoutItems = workouts.map(w => ({
                gymLogId: log.id,
                frontendId: w.id,
                text: w.text,
                weight: w.weight,
                sets: w.sets,
                reps: w.reps,
                category: w.category,
                completed: w.completed
            }));
            await WorkoutItem.bulkCreate(workoutItems);
        }

        // Sync Meals
        await MealItem.destroy({ where: { gymLogId: log.id } });
        if (meals && meals.length > 0) {
            const mealItems = meals.map(m => ({
                gymLogId: log.id,
                frontendId: m.id,
                type: m.type,
                text: m.text,
                completed: m.completed
            }));
            await MealItem.bulkCreate(mealItems);
        }

        // Fetch updated log
        const updatedLog = await GymLog.findOne({
            where: { id: log.id },
            include: [WorkoutItem, MealItem]
        });

        res.json({ success: true, log: updatedLog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save log' });
    }
});

// Get Weight Logs
app.get('/api/data/weight/:userId', async (req, res) => {
    try {
        const logs = await WeightLog.findAll({
            where: { userId: req.params.userId },
            order: [['date', 'ASC']]
        });
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch weight logs' });
    }
});

// Save Weight Log
app.post('/api/data/weight', async (req, res) => {
    const { userId, date, weight } = req.body;
    try {
        const newLog = await WeightLog.create({ userId, date, weight });
        res.json({ success: true, log: newLog });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save weight' });
    }
});

// Get Manual PRs
app.get('/api/data/prs/:userId', async (req, res) => {
    try {
        const prs = await ManualPR.findAll({ where: { userId: req.params.userId } });
        const prMap = {};
        prs.forEach(pr => {
            prMap[pr.exercise] = { weight: pr.weight, reps: pr.reps };
        });
        res.json({ success: true, prs: prMap });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch PRs' });
    }
});

// Save Manual PR
app.post('/api/data/prs', async (req, res) => {
    const { userId, exercise, weight, reps } = req.body;
    try {
        let pr = await ManualPR.findOne({ where: { userId, exercise } });
        if (pr) {
            await pr.update({ weight, reps });
        } else {
            pr = await ManualPR.create({ userId, exercise, weight, reps });
        }
        res.json({ success: true, pr });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save PR' });
    }
});

// Save Feedback
app.post('/api/feedback', async (req, res) => {
    const { userId, type, message, rating } = req.body;
    try {
        const feedback = await Feedback.create({ userId, type, message, rating });
        console.log(`[Feedback] New ${type} from User ${userId}`);
        res.json({ success: true, feedback });
    } catch (err) {
        console.error('Feedback Error:', err);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

// Get All Feedback (Admin)
app.get('/api/feedback', async (req, res) => {
    try {
        const feedback = await Feedback.findAll({
            include: [{ model: User, attributes: ['username', 'email'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, feedback });
    } catch (err) {
        console.error('Fetch Feedback Error:', err);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Serve Static Frontend (Production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.use((req, res) => {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
}

// Sync Database and Start Server
sequelize.sync({ alter: true }).then(() => {
    console.log('✅ Database Connected & Synced');
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}).catch(err => {
    console.error('❌ Database Connection Error:', err);
});
