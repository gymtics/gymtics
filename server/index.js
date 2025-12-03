const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { sequelize, User, GymLog, WorkoutItem, MealItem, WeightLog, ManualPR, Feedback } = require('./models');

dotenv.config();

const cluster = require('cluster');
const os = require('os');
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
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    const app = express();

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
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.url}`);
        next();
    });

    // Database Connection & Sync
    sequelize.authenticate()
        .then(() => {
            console.log('✅ SQLite Database Connected');
            return sequelize.sync(); // Sync models with DB
        })
        .then(() => console.log('✅ Models Synced'))
        .catch(err => console.error('❌ Database Error:', err));

    // In-memory storage for OTPs (Temporary)
    const otps = {}; // { emailOrPhone: { code, expires } }

    // Email Transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
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
        otps[identifier] = { code, expires: Date.now() + 300000 }; // 5 min expiry

        console.log(`[OTP] Generated for ${identifier}: ${code}`);

        try {
            if (method === 'email') {
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: identifier,
                        subject: 'Your Gym App Verification Code',
                        text: `Your verification code is: ${code}`
                    });
                    console.log(`[Email] Sent to ${identifier}`);
                } else {
                    console.log(`[Email] Mock sent to ${identifier} (Missing credentials)`);
                }
            } else if (method === 'sms') {
                if (twilioClient && process.env.TWILIO_PHONE) {
                    await twilioClient.messages.create({
                        body: `Your Gym App code is: ${code}`,
                        from: process.env.TWILIO_PHONE,
                        to: identifier
                    });
                    console.log(`[SMS] Sent to ${identifier}`);
                } else {
                    console.log(`[SMS] Mock sent to ${identifier} (Missing credentials)`);
                }
            }
            res.json({ success: true, message: 'OTP sent successfully' });
        } catch (error) {
            console.error('Send OTP Error:', error);
            res.status(500).json({ error: 'Failed to send OTP' });
        }
    });

    // API: Verify OTP
    app.post('/api/auth/verify-otp', (req, res) => {
        const { identifier, code } = req.body;
        const record = otps[identifier];
        if (!record) return res.status(400).json({ error: 'OTP not found or expired' });
        if (Date.now() > record.expires) {
            delete otps[identifier];
            return res.status(400).json({ error: 'OTP expired' });
        }
        if (record.code === code) {
            delete otps[identifier];
            res.json({ success: true, message: 'OTP verified' });
        } else {
            res.status(400).json({ error: 'Invalid OTP' });
        }
    });

    // API: Reset Password
    app.post('/api/auth/reset-password', async (req, res) => {
        const { email, otp, newPassword } = req.body;

        // Verify OTP
        const record = otps[email];
        if (!record) return res.status(400).json({ error: 'OTP not found or expired' });
        if (Date.now() > record.expires) {
            delete otps[email];
            return res.status(400).json({ error: 'OTP expired' });
        }
        if (record.code !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Update Password
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) return res.status(400).json({ error: 'User not found' });

            await user.update({ password: newPassword }); // In prod, hash!
            delete otps[email]; // Consume OTP

            console.log(`[Auth] Password reset for: ${email}`);
            res.json({ success: true, message: 'Password reset successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
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
            console.error(err);
            res.status(500).json({ error: 'Server error' });
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

    // Serve Static Frontend (Production)
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../dist')));

        app.use((req, res) => {
            res.sendFile(path.join(__dirname, '../dist', 'index.html'));
        });
    }

    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} started on port ${PORT}`);
    });
}
