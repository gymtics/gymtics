export const exerciseLibrary = [
    // Chest
    { name: 'Bench Press', category: 'Chest' },
    { name: 'Incline Bench Press', category: 'Chest' },
    { name: 'Dumbbell Press', category: 'Chest' },
    { name: 'Incline Dumbbell Press', category: 'Chest' },
    { name: 'Chest Fly', category: 'Chest' },
    { name: 'Push Ups', category: 'Chest' },
    { name: 'Cable Crossover', category: 'Chest' },
    { name: 'Dips', category: 'Chest' },

    // Back (Lats)
    { name: 'Pull Ups', category: 'Lat' },
    { name: 'Lat Pulldown', category: 'Lat' },
    { name: 'Barbell Row', category: 'Lat' },
    { name: 'Dumbbell Row', category: 'Lat' },
    { name: 'Seated Cable Row', category: 'Lat' },
    { name: 'Face Pulls', category: 'Lat' },
    { name: 'Deadlift', category: 'Lat' },
    { name: 'T-Bar Row', category: 'Lat' },

    // Legs
    { name: 'Squat', category: 'Leg Day' },
    { name: 'Leg Press', category: 'Leg Day' },
    { name: 'Lunges', category: 'Leg Day' },
    { name: 'Leg Extension', category: 'Leg Day' },
    { name: 'Leg Curl', category: 'Leg Day' },
    { name: 'Calf Raises', category: 'Leg Day' },
    { name: 'Romanian Deadlift', category: 'Leg Day' },
    { name: 'Bulgarian Split Squat', category: 'Leg Day' },

    // Shoulders
    { name: 'Overhead Press', category: 'Shoulder' },
    { name: 'Dumbbell Shoulder Press', category: 'Shoulder' },
    { name: 'Lateral Raises', category: 'Shoulder' },
    { name: 'Front Raises', category: 'Shoulder' },
    { name: 'Arnold Press', category: 'Shoulder' },
    { name: 'Shrugs', category: 'Shoulder' },

    // Biceps
    { name: 'Barbell Curl', category: 'Bicep' },
    { name: 'Dumbbell Curl', category: 'Bicep' },
    { name: 'Hammer Curl', category: 'Bicep' },
    { name: 'Preacher Curl', category: 'Bicep' },
    { name: 'Cable Curl', category: 'Bicep' },

    // Triceps
    { name: 'Tricep Pushdown', category: 'Tricep' },
    { name: 'Skull Crushers', category: 'Tricep' },
    { name: 'Overhead Tricep Extension', category: 'Tricep' },
    { name: 'Close Grip Bench Press', category: 'Tricep' },
    { name: 'Tricep Dips', category: 'Tricep' },

    // Abs & Cardio
    { name: 'Crunches', category: 'Abs' },
    { name: 'Plank', category: 'Abs' },
    { name: 'Leg Raises', category: 'Abs' },
    { name: 'Russian Twists', category: 'Abs' },
    { name: 'Treadmill Run', category: 'Cardio' },
    { name: 'Cycling', category: 'Cardio' },
    { name: 'Elliptical', category: 'Cardio' },
    { name: 'Jump Rope', category: 'Cardio' }
];

export const getCategories = () => [
    'Chest', 'Lat', 'Leg Day', 'Shoulder', 'Bicep', 'Tricep', 'Abs', 'Cardio', 'Other'
];
