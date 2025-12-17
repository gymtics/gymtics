import { foodData, calculateCalories } from '../utils/foodData';

const Dashboard = () => {
    // ... (lines 9-27)

    // Input States
    const [workoutInput, setWorkoutInput] = useState('');
    const [setsInput, setSetsInput] = useState('');
    const [repsInput, setRepsInput] = useState('');
    const [weightInput, setWeightInput] = useState('');
    const [category, setCategory] = useState('Strength');
    const [mealInput, setMealInput] = useState('');
    const [mealQuantity, setMealQuantity] = useState('');
    const [mealUnit, setMealUnit] = useState('grams');
    const [mealType, setMealType] = useState('Pre-workout');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Update history helper
    const updateHistory = (newData) => {
        setHistory({
            ...history,
            [dateKey]: newData
        });
    };

    const toggleGym = () => {
        let nextState;
        if (currentData.gymVisited === null) nextState = true; // Neutral -> Yes
        else if (currentData.gymVisited === true) nextState = false; // Yes -> No
        else nextState = null; // No -> Neutral

        updateHistory({ ...currentData, gymVisited: nextState });
    };

    const toggleCompletion = (type, id) => {
        if (type === 'workout') {
            updateHistory({
                ...currentData,
                workouts: currentData.workouts.map(w => w.id === id ? { ...w, completed: !w.completed } : w)
            });
        } else {
            updateHistory({
                ...currentData,
                meals: currentData.meals.map(m => m.id === id ? { ...m, completed: !m.completed } : m)
            });
        }
    };

    const addWorkout = (e) => {
        e.preventDefault();
        if (!workoutInput.trim()) return;
        updateHistory({
            ...currentData,
            workouts: [...currentData.workouts, {
                id: Date.now(),
                text: workoutInput,
                sets: setsInput,
                reps: repsInput,
                weight: weightInput,
                category: category,
                completed: false
            }]
        });
        setWorkoutInput('');
        setSetsInput('');
        setRepsInput('');
        setWeightInput('');
    };

    const addMeal = (e) => {
        e.preventDefault();
        if (!mealInput.trim()) return;

        const calories = calculateCalories(mealInput, parseFloat(mealQuantity) || 0, mealUnit);

        updateHistory({
            ...currentData,
            meals: [...currentData.meals, {
                id: Date.now(),
                type: mealType,
                text: mealInput,
                quantity: mealQuantity,
                unit: mealUnit,
                calories: calories,
                completed: false
            }]
        });
        setMealInput('');
        setMealQuantity('');
    };

    const deleteItem = (type, id) => {
        if (type === 'workout') {
            updateHistory({
                ...currentData,
                workouts: currentData.workouts.filter(w => w.id !== id)
            });
        } else {
            updateHistory({
                ...currentData,
                meals: currentData.meals.filter(m => m.id !== id)
            });
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2rem 0',
                marginBottom: '2rem'
            }}>
                <div className="flex-center" style={{ gap: '1rem' }}>
                    <div
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid var(--primary)',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.5rem' }}>👤</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*,.heic,.heif"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Hello, <span className="text-gradient">{user?.username || 'User'}</span></h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date().toDateString()}</p>
                    </div>
                </div>
                <button className="btn-outline" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    Logout
                </button>
            </header>

            {/* Main Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* Left Column: Calendar */}
                <div>
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        gymHistory={history}
                    />
                </div>

                {/* Right Column: Details for Selected Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Date Header & Gym Toggle */}
                    <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem' }}>{format(selectedDate, 'MMMM do')}</h2>
                                <p style={{ color: 'var(--text-muted)' }}>Did you go to the gym?</p>
                            </div>
                            <div
                                onClick={toggleGym}
                                style={{
                                    width: '80px',
                                    height: '40px',
                                    background: currentData.gymVisited === true ? '#4ade80' : currentData.gymVisited === false ? '#ff4444' : 'var(--glass-bg)',
                                    borderRadius: '20px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '4px',
                                    left: currentData.gymVisited === true ? '44px' : currentData.gymVisited === false ? '4px' : '24px', // Center for neutral
                                    transition: 'left 0.3s',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    {currentData.gymVisited === true ? '✅' : currentData.gymVisited === false ? '❌' : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workout Log */}
                    <div className="glass-panel animate-slide-up" style={{ padding: '2rem', animationDelay: '0.1s' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Workout Log</h3>
                        <form onSubmit={addWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        outline: 'none',
                                        flex: 1,
                                        minWidth: '120px'
                                    }}
                                >
                                    <option>Strength</option>
                                    <option>Cardio</option>
                                    <option>Flexibility</option>
                                    <option>Other</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Exercise (e.g. Bench Press)"
                                    value={workoutInput}
                                    onChange={(e) => setWorkoutInput(e.target.value)}
                                    style={{ flex: 2, minWidth: '150px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    placeholder="Sets"
                                    value={setsInput}
                                    onChange={(e) => setSetsInput(e.target.value)}
                                    style={{ flex: 1, minWidth: '60px' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Reps"
                                    value={repsInput}
                                    onChange={(e) => setRepsInput(e.target.value)}
                                    style={{ flex: 1, minWidth: '60px' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Weight (kg)"
                                    value={weightInput}
                                    onChange={(e) => setWeightInput(e.target.value)}
                                    style={{ flex: 1, minWidth: '60px' }}
                                />
                            </div>
                            {/* Button matches Add Meal size */}
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Workout</button>
                        </form>
                        <ul style={{ listStyle: 'none' }}>
                            {currentData.workouts.map(item => (
                                <li key={item.id} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '1rem',
                                    marginBottom: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: item.completed ? 0.5 : 1,
                                    transition: 'opacity 0.3s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={item.completed || false}
                                            onChange={() => toggleCompletion('workout', item.id)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                        />
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--secondary)',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 'bold'
                                                }}>{item.category || 'Strength'}</span>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    textDecoration: item.completed ? 'line-through' : 'none'
                                                }}>{item.text}</span>
                                            </div>
                                            {(item.sets || item.reps || item.weight) && (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {item.sets ? `${item.sets} Sets` : ''}
                                                    {item.sets && item.reps ? ' x ' : ''}
                                                    {item.reps ? `${item.reps} Reps` : ''}
                                                    {item.weight ? ` @ ${item.weight}kg` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteItem('workout', item.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                                    >✕</button>
                                </li>
                            ))}
                            {currentData.workouts.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No workouts logged.</p>}
                        </ul>
                    </div>

                    {/* Food Log */}
                    <div className="glass-panel animate-slide-up" style={{ padding: '2rem', animationDelay: '0.2s' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Food Log</h3>
                        <form onSubmit={addMeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <select
                                    value={mealType}
                                    onChange={(e) => setMealType(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        outline: 'none',
                                        flex: 1,
                                        minWidth: '120px'
                                    }}
                                >
                                    <option>Pre-workout</option>
                                    <option>Breakfast</option>
                                    <option>Lunch</option>
                                    <option>Dinner</option>
                                    <option>Snack</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Food (e.g. Chicken Breast)"
                                    value={mealInput}
                                    onChange={(e) => setMealInput(e.target.value)}
                                    style={{ flex: 2, minWidth: '150px' }}
                                    list="food-suggestions"
                                />
                                <datalist id="food-suggestions">
                                    {Object.keys(foodData).map(food => <option key={food} value={food} />)}
                                </datalist>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Qty"
                                    value={mealQuantity}
                                    onChange={(e) => setMealQuantity(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <select
                                    value={mealUnit}
                                    onChange={(e) => setMealUnit(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        outline: 'none',
                                        flex: 1
                                    }}
                                >
                                    <option value="grams">grams</option>
                                    <option value="ml">ml</option>
                                    <option value="units">units</option>
                                    <option value="oz">oz</option>
                                    <option value="cups">cups</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Meal</button>
                        </form>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {currentData.meals.map(item => (
                                <div key={item.id} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: item.completed ? 0.5 : 1,
                                    transition: 'opacity 0.3s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={item.completed || false}
                                            onChange={() => toggleCompletion('meal', item.id)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                        />
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--primary)',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 'bold'
                                                }}>{item.type}</span>
                                                <span style={{ textDecoration: item.completed ? 'line-through' : 'none', fontWeight: 'bold' }}>{item.text}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {item.quantity} {item.unit} {item.calories ? `• ${item.calories} kcal` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteItem('meal', item.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                                    >✕</button>
                                </div>
                            ))}
                            {currentData.meals.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No meals logged.</p>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
