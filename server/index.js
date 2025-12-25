const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { sequelize, User, GymLog, WorkoutItem, MealItem, WeightLog, ManualPR, Feedback, OTP, GlobalMessage } = require('./models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logging


// Database Connection & Sync
// Database connection is handled at startup below

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
    tls: {
        rejectUnauthorized: false // Help with some strict firewall/proxy issues
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
const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const emailPort = process.env.SMTP_PORT || '465';

if (emailUser && emailPass) {
    console.log(`[Email] Configured with user: ${emailUser}`);
    console.log(`[Email] Transport Host: ${emailHost}`);
    console.log(`[Email] Transport Port: ${emailPort}`);

    // Verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.error('[Email] Connection verification failed:', error);
            console.error('[Email] Error Code:', error.code);
            console.error('[Email] Error Response:', error.response);
        } else {
            console.log('[Email] Server is ready to take our messages');
        }
    });
} else {
    console.warn('[Email] SMTP credentials missing. Email features will be disabled.');
    console.warn(`[Email] User present: ${!!emailUser}, Pass present: ${!!emailPass}`);
    console.warn('To fix this on Render: Go to Environment > Add Environment Variable > EMAIL_USER, EMAIL_PASS');
}

// Debug Email Route
// Debug Email Route
app.get('/api/debug/email', async (req, res) => {
    try {
        const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

        const debugInfo = {
            userConfigured: !!emailUser,
            passConfigured: !!emailPass,
            userLength: emailUser ? emailUser.length : 0,
            passLength: emailPass ? emailPass.length : 0,
            host: process.env.SMTP_HOST || 'default(smtp.gmail.com)',
            port: process.env.SMTP_PORT || 'default(465)'
        };

        if (!emailUser) return res.status(400).json({ error: 'No email credentials (User missing)', debugInfo });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || emailUser,
            to: 'gymtics0@gmail.com',
            subject: 'Test Email from Gymtics (Debug)',
            text: `This is a test email to verify SMTP configuration.\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`
        });
        res.json({ success: true, message: 'Test email sent', debugInfo });
    } catch (err) {
        console.error('Test Email Failed:', err);
        res.status(500).json({ error: err.message, stack: err.stack, code: err.code, response: err.response });
    }
});

// Debug Database Route
app.get('/api/debug/db', async (req, res) => {
    try {
        console.log('[Debug DB] Checking database connection...');
        await sequelize.authenticate();
        console.log('[Debug DB] Connection authenticated.');

        const messageCount = await GlobalMessage.count();
        console.log(`[Debug DB] GlobalMessage count: ${messageCount}`);

        const lastMessage = await GlobalMessage.findOne({
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            status: 'connected',
            messageCount,
            lastMessage: lastMessage ? lastMessage.toJSON() : 'No messages'
        });
    } catch (err) {
        console.error('[Debug DB] Error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            stack: err.stack
        });
    }
});

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

// API: Promote to Admin (Secret Route)
app.post('/api/auth/promote-admin', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ role: 'admin' });
        res.json({ success: true, message: 'User promoted to admin' });
    } catch (err) {
        console.error('Promotion Error:', err);
        res.status(500).json({ error: 'Failed to promote user' });
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
    console.log(`[Avatar Update] Request for User ${userId}`);
    console.log(`[Avatar Update] Payload size: ${JSON.stringify(req.body).length} bytes`);

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            console.error(`[Avatar Update] User ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[Avatar Update] Updating avatar for ${user.username}...`);
        await user.update({ avatar });
        console.log(`[Avatar Update] Success!`);

        res.json({ success: true, user: { ...user.toJSON(), password: undefined } });
    } catch (err) {
        console.error('[Avatar Update] Error:', err);
        res.status(500).json({ error: 'Failed to update avatar: ' + err.message });
    }
});

// API: Chatbot
app.post('/api/chat', async (req, res) => {
    const { message, userId, history } = req.body;
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            console.error('[Chatbot] ❌ Error: Missing GEMINI_API_KEY or GOOGLE_API_KEY in environment variables.');
            return res.json({
                success: true, // Return success to show the fallback message nicely in the UI
                reply: "I'm currently undergoing maintenance (Missing Configuration). Please contact the administrator."
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest", // Confirmed working with this API key
            systemInstruction: `You are Gymtics AI, an elite fitness coach and nutritionist with 20+ years of experience.
            
            **Your Mission:** Help users achieve their fitness goals through science-backed, personalized, and motivating advice.

            **Guidelines:**
            1.  **Be Direct & Actionable:** Avoid fluff. Give clear steps.
            2.  **Format for Readability:** 
                *   Use **Bold** for key concepts.
                *   Use bullet points or numbered lists for plans.
            3.  **Diet Plans:** Always specify Macros (Protein, Carbs, Fats) estimates if asked for a plan.
            4.  **Workouts:** Specify Sets, Reps, and Rest times.
            5.  **Safety First:** If a user mentions pain or injury, advise a professional check-up.
            6.  **Tone:** Professional, Encouraging, but No-Nonsense (like a real coach).
            
            **Context:** You are chatting with a user of the Gymtics app. Keep answers relevant to gym/fitness.`
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        console.log(`[Chatbot] Success: ${text.substring(0, 50)}...`);
        res.json({ success: true, reply: text });
    } catch (err) {
        console.error(`[Chatbot] ❌ API Error:`, err.message);

        let reply = "Sorry, I encountered an error. Please try again.";

        // Handle Rate Limiting (429)
        if (err.message.includes('429') || err.status === 429) {
            reply = "I'm receiving too many requests right now(Quota Exceeded). Please try again in a minute.";
            return res.json({ success: true, reply });
        }

        // Handle 404 (Model not found)
        if (err.message.includes('404') || err.status === 404) {
            reply = `Configuration Error: Model not found. (${err.message})`;
            return res.json({ success: true, reply });
        }

        // Return actual error for debugging (if not 500)
        // ideally we would return success: true with the error message so the user sees it in chat
        reply = `Error: ${err.message}`;
        return res.json({ success: true, reply });
    }
});

// --- DATA APIs ---

// Get History (Gym Logs)
app.get('/api/data/history/:userId', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const dateString = sixMonthsAgo.toISOString().split('T')[0];

        const logs = await GymLog.findAll({
            where: {
                userId: req.params.userId,
                date: { [Op.gte]: dateString }
            },
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
                quantity: m.quantity, // Add missing field
                unit: m.unit,         // Add missing field
                calories: m.calories, // Add missing field
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

// Delete Manual PR
app.delete('/api/data/prs', async (req, res) => {
    const { userId, exercise } = req.body;
    try {
        const deleted = await ManualPR.destroy({ where: { userId, exercise } });
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'PR not found' });
        }
    } catch (err) {
        console.error("Delete PR Error:", err);
        res.status(500).json({ error: 'Failed to delete PR' });
    }
});

// Save Feedback
app.post('/api/feedback', async (req, res) => {
    const { userId, type, message, rating } = req.body;
    try {
        // 1. Save to DB (Backup)
        const feedback = await Feedback.create({ userId, type, message, rating });
        console.log(`[Feedback] New ${type} from User ${userId}`);

        // 2. Send Email Notification
        const user = await User.findByPk(userId);
        const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

        let emailSent = false;
        if (emailUser && emailPass) {
            try {
                // Ensure from address is valid
                const fromAddress = process.env.EMAIL_FROM || emailUser;
                // Use ADMIN_EMAIL if set, otherwise fallback to known admin or sender
                const toAddress = process.env.ADMIN_EMAIL || 'gymtics0@gmail.com';

                console.log(`[Feedback] Attempting to send email from ${fromAddress} to ${toAddress}`);

                await transporter.sendMail({
                    from: fromAddress,
                    to: toAddress, // Target email
                    subject: `New Feedback: ${type.toUpperCase()} from ${user ? user.username : 'Unknown'}`,
                    text: `
New Feedback Received!

Type: ${type}
User: ${user ? user.username : 'Unknown'} (${user ? user.email : 'No Email'})
Rating: ${rating}/5

Message:
${message}
                    `
                });
                console.log(`[Feedback] Email notification sent to ${toAddress}`);
                emailSent = true;
            } catch (emailErr) {
                console.error('[Feedback] Failed to send email:', emailErr);
                console.error('[Feedback] Error Code:', emailErr.code);
                console.error('[Feedback] Error Command:', emailErr.command);
                // Don't fail the request if email fails, just log it
            }
        } else {
            console.warn('[Feedback] Email skipped: SMTP_USER/EMAIL_USER or SMTP_PASS/EMAIL_PASS not set.');
        }

        res.json({ success: true, feedback, emailSent });

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

// Get Leaderboard Data
app.get('/api/leaderboard', async (req, res) => {
    console.log('[Leaderboard] Request received');
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'avatar'],
            include: [{
                model: GymLog,
                attributes: ['date', 'gymVisited'],
                include: [{
                    model: MealItem,
                    attributes: ['id', 'completed']
                }, {
                    model: WorkoutItem,
                    attributes: ['id', 'completed']
                }]
            }]
        });

        const leaderboard = users.map(user => {
            const logs = user.GymLogs || [];

            // Gym Score: Count unique days visited
            const gymScore = logs.filter(log => log.gymVisited).length;

            // Diet Score: Count unique days with at least 3 completed meals
            const dietScore = logs.filter(log => {
                if (!log.MealItems) return false;
                const completedMeals = log.MealItems.filter(m => m.completed).length;
                return completedMeals >= 3;
            }).length;

            // Workout Score: Count unique days with at least 4 completed exercises
            const workoutScore = logs.filter(log => {
                if (!log.WorkoutItems) return false;
                const completedWorkouts = log.WorkoutItems.filter(w => w.completed).length;
                return completedWorkouts >= 4;
            }).length;

            return {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                gymScore,
                dietScore,
                workoutScore,
                totalScore: gymScore + dietScore + workoutScore
            };
        });

        // Sort by Total Score DESC
        // Sort by Total Score DESC
        leaderboard.sort((a, b) => b.totalScore - a.totalScore); // Descending

        // User Rank Logic
        let userRank = null;
        const currentUserId = req.query.userId ? parseInt(req.query.userId) : null;

        if (currentUserId) {
            const rankIndex = leaderboard.findIndex(u => u.id === currentUserId);
            if (rankIndex !== -1) {
                userRank = { ...leaderboard[rankIndex], rank: rankIndex + 1 };
            }
        }

        res.json({
            success: true,
            leaderboard: leaderboard.slice(0, 100), // Top 100
            userRank
        });
    } catch (err) {
        console.error('Leaderboard Error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
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

const http = require('http'); // [NEW]
const { Server } = require('socket.io'); // [NEW]

// ... (imports)

// Create HTTP Server [NEW]
const server = http.createServer(app);

// Initialize Socket.io [NEW]
const io = new Server(server, {
    maxHttpBufferSize: 1e7, // 10MB
    cors: {
        origin: "*", // Allow all origins for now (adjust for prod)
        methods: ["GET", "POST"]
    }
});

// Socket.io Logic [NEW]
io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Join Global Chat
    socket.on('join_global', async () => {
        socket.join('global_chat');
        console.log(`[Socket] ${socket.id} joined global chat`);

        // Send last 50 messages history
        try {
            const history = await GlobalMessage.findAll({
                limit: 50,
                order: [['createdAt', 'ASC']]
            });
            socket.emit('receive_history', history);
        } catch (err) {
            console.error('[Socket] Failed to fetch history:', err);
        }
    });

    // Handle New Message
    socket.on('send_message', async (data, callback) => {
        console.log(`[Socket] Received message from ${data.username} (${data.userId})`);

        try {
            // Validate
            if (!data.userId || !data.text) {
                throw new Error('Missing user ID or text');
            }

            // Save to DB
            const newMessage = await GlobalMessage.create({
                userId: data.userId,
                username: data.username,
                avatar: data.avatar,
                text: data.text
            });

            const plainMessage = newMessage.get({ plain: true });

            // Broadcast to everyone in 'global_chat' (including sender)
            io.to('global_chat').emit('receive_message', plainMessage);

            // Acknowledge success to sender
            if (callback) callback({ status: 'ok', message: plainMessage });

        } catch (err) {
            console.error('[Socket] Message failure:', err);

            // Acknowledge failure
            if (callback) callback({ status: 'error', error: err.message });

            socket.emit('message_error', {
                error: 'Failed to send message',
                details: err.message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
    });
});


// Sync Database and Start Server [MODIFIED]
sequelize.sync({ alter: true }).then(() => {
    console.log('✅ Database Connected & Synced');
    // server.listen instead of app.listen
    server.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}).catch(err => {
    console.error('❌ Database Connection Error:', err);
});
