const sequelize = require('../config/database');
const User = require('./User');
const GymLog = require('./GymLog');
const WorkoutItem = require('./WorkoutItem');
const MealItem = require('./MealItem');
const WeightLog = require('./WeightLog');
const ManualPR = require('./ManualPR');
const Feedback = require('./Feedback');
const OTP = require('./OTP');

// Associations

// User -> GymLog (One-to-Many)
User.hasMany(GymLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
GymLog.belongsTo(User, { foreignKey: 'userId' });

// GymLog -> WorkoutItem (One-to-Many)
GymLog.hasMany(WorkoutItem, { foreignKey: 'gymLogId', onDelete: 'CASCADE' });
WorkoutItem.belongsTo(GymLog, { foreignKey: 'gymLogId' });

// GymLog -> MealItem (One-to-Many)
GymLog.hasMany(MealItem, { foreignKey: 'gymLogId', onDelete: 'CASCADE' });
MealItem.belongsTo(GymLog, { foreignKey: 'gymLogId' });

// User -> WeightLog (One-to-Many)
User.hasMany(WeightLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
WeightLog.belongsTo(User, { foreignKey: 'userId' });

// User -> ManualPR (One-to-Many)
User.hasMany(ManualPR, { foreignKey: 'userId', onDelete: 'CASCADE' });
// User -> Feedback (One-to-Many)
User.hasMany(Feedback, { foreignKey: 'userId', onDelete: 'CASCADE' });
Feedback.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    GymLog,
    WorkoutItem,
    MealItem,
    WeightLog,
    ManualPR,
    Feedback,
    OTP
};
