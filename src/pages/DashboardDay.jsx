import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useData } from '../utils/store';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { format, parseISO } from 'date-fns';

import { exerciseLibrary, getCategories } from '../utils/exercises';

const DashboardDay = () => {
    const { date } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const user = auth?.user;
    const context = useData();

    if (!auth) {
        return <div style={{ color: 'white', padding: '2rem' }}>Error: Auth Context missing.</div>;
    }

    if (!context) {
        return <div style={{ color: 'white', padding: '2rem' }}>Error: Data Context not found. Please refresh.</div>;
    }

    const { history, updateHistory, isLoading } = context;
    const dateObj = parseISO(date);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
                Loading...
            </div>
        );
    }

    // Get data for selected date or default
    const currentData = history[date] || {
        gymVisited: false,
        workouts: [],
        meals: []
    };

    // Defensive check to ensure arrays exist
    const workouts = Array.isArray(currentData.workouts) ? currentData.workouts : [];
    const meals = Array.isArray(currentData.meals) ? currentData.meals : [];

    // Input States
    const [workoutInput, setWorkoutInput] = useState('');
    const [weightInput, setWeightInput] = useState('');
    const [setsInput, setSetsInput] = useState('');
    const [repsInput, setRepsInput] = useState('');
    const [categoryInput, setCategoryInput] = useState('Chest');
    const [mealInput, setMealInput] = useState('');
    const [mealType, setMealType] = useState('Pre-workout');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Clipboard Data
    const [clipboard, setClipboard] = useLocalStorage('gym_app_clipboard', null);

    // Handlers
    const toggleGymVisited = () => {
        updateHistory(date, { ...currentData, gymVisited: !currentData.gymVisited });
    };

    const addWorkout = (e) => {
        e.preventDefault();
        if (!workoutInput.trim()) return;
        const newWorkout = {
            id: Date.now().toString(), // Use string ID for consistency
            text: workoutInput,
            weight: weightInput,
            sets: setsInput,
            reps: repsInput,
            category: categoryInput,
            completed: false
        };
        updateHistory(date, { ...currentData, workouts: [...workouts, newWorkout] });
        setWorkoutInput('');
        setWeightInput('');
        setSetsInput('');
        setRepsInput('');
        setShowSuggestions(false);
    };

    const toggleWorkout = (id) => {
        const updatedWorkouts = workouts.map(w =>
            w.id === id ? { ...w, completed: !w.completed } : w
        );
        updateHistory(date, { ...currentData, workouts: updatedWorkouts });
    };

    const deleteWorkout = (id) => {
        const updatedWorkouts = workouts.filter(w => w.id !== id);
        updateHistory(date, { ...currentData, workouts: updatedWorkouts });
    };

    const addMeal = (e) => {
        e.preventDefault();
        if (!mealInput.trim()) return;
        const newMeal = {
            id: Date.now().toString(),
            type: mealType,
            text: mealInput,
            completed: false
        };
        updateHistory(date, { ...currentData, meals: [...meals, newMeal] });
        setMealInput('');
    };

    const toggleMeal = (id) => {
        const updatedMeals = meals.map(m =>
            m.id === id ? { ...m, completed: !m.completed } : m
        );
        updateHistory(date, { ...currentData, meals: updatedMeals });
    };

    const deleteMeal = (id) => {
        const updatedMeals = currentData.meals.filter(m => m.id !== id);
        updateHistory(date, { ...currentData, meals: updatedMeals });
    };

    const copyPlan = () => {
        const dataToCopy = {
            workouts: workouts || [],
            meals: meals || []
        };
        setClipboard(dataToCopy);
    };

    const pastePlan = () => {
        try {
            const storedClipboard = clipboard || JSON.parse(window.localStorage.getItem('gym_app_clipboard'));

            if (!storedClipboard || !storedClipboard.workouts) {
                return;
            }

            // Generate new IDs for pasted items to avoid conflicts
            const newWorkouts = (storedClipboard.workouts || []).map(w => ({
                ...w,
                id: Date.now() + Math.random().toString(),
                completed: false
            }));
            const newMeals = (storedClipboard.meals || []).map(m => ({
                ...m,
                id: Date.now() + Math.random().toString(),
                completed: false
            }));

            updateHistory(date, {
                ...currentData,
                workouts: [...workouts, ...newWorkouts],
                meals: [...meals, ...newMeals]
            });
        } catch (err) {
            console.error("Paste failed:", err);
        }
    };




    const deleteItem = (type, id) => {
        if (type === 'workout') {
            updateHistory(date, {
                ...currentData,
                workouts: workouts.filter(w => w.id !== id)
            });
        } else {
            updateHistory(date, {
                ...currentData,
                meals: meals.filter(m => m.id !== id)
            });
        }
    };

    const filteredExercises = exerciseLibrary.filter(ex =>
        ex.name.toLowerCase().includes(workoutInput.toLowerCase())
    );

    return (
        <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>


            {/* Header with Back Button and Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-outline"
                        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        ← Back
                    </button>
                    <h2 style={{ margin: 0 }}>{format(dateObj, 'MMMM do, yyyy')}</h2>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={copyPlan}
                        className="btn-outline"
                        style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                        title="Copy today's plan"
                    >
                        📋 Copy
                    </button>
                    <button
                        onClick={pastePlan}
                        className="btn-primary"
                        style={{ fontSize: '0.9rem', padding: '8px 12px', cursor: 'pointer' }}
                        title="Paste plan from clipboard"
                    >
                        📋 Paste
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Gym Toggle */}
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Gym Attendance</h3>
                            <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Mark if you visited the gym today</p>
                        </div>
                        <div
                            onClick={toggleGymVisited}
                            style={{
                                width: '80px',
                                height: '40px',
                                background: currentData.gymVisited ? 'var(--primary)' : 'var(--glass-bg)',
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
                                left: currentData.gymVisited ? '44px' : '4px',
                                transition: 'left 0.3s',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}>
                                {currentData.gymVisited ? '✅' : '❌'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workout Log */}
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem', animationDelay: '0.1s' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Workout Log</h3>
                    <form onSubmit={addWorkout} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', position: 'relative' }}>
                        <select
                            value={categoryInput}
                            onChange={(e) => setCategoryInput(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                padding: '12px',
                                borderRadius: 'var(--radius-sm)',
                                outline: 'none',
                                minWidth: '100px'
                            }}
                        >
                            {getCategories().map(cat => (
                                <option key={cat}>{cat}</option>
                            ))}
                        </select>
                        <div style={{ flex: 2, minWidth: '150px', position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Exercise (e.g. Bench Press)"
                                value={workoutInput}
                                onChange={(e) => setWorkoutInput(e.target.value)}
                                onFocus={() => workoutInput.length > 1 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                                style={{ width: '100%' }}
                            />
                            {showSuggestions && filteredExercises.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-dark)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    zIndex: 10
                                }}>
                                    {filteredExercises.map((ex, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setWorkoutInput(ex.name);
                                                setCategoryInput(ex.category);
                                                setShowSuggestions(false);
                                            }}
                                            style={{
                                                padding: '10px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                justifyContent: 'space-between'
                                            }}
                                            className="hover-bg"
                                        >
                                            <span>{ex.name}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.category}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input
                            type="number"
                            placeholder="kg/lbs"
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            style={{ flex: 1, minWidth: '60px' }}
                        />
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
                        <button type="submit" className="btn-primary" style={{ padding: '0 1.5rem' }}>+</button>
                    </form>
                    <ul style={{ listStyle: 'none' }}>
                        {workouts.map(item => (
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
                                        onChange={() => toggleWorkout(item.id)}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                    />
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: 'var(--primary)',
                                                color: 'var(--bg-dark)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}>
                                                {item.category || 'General'}
                                            </span>
                                            <span style={{
                                                fontWeight: 'bold',
                                                textDecoration: item.completed ? 'line-through' : 'none'
                                            }}>{item.text}</span>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {item.weight ? `${item.weight} kg • ` : ''}
                                            {item.sets ? `${item.sets} Sets` : ''}
                                            {item.sets && item.reps ? ' x ' : ''}
                                            {item.reps ? `${item.reps} Reps` : ''}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteItem('workout', item.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                                >✕</button>
                            </li>
                        ))}
                        {workouts.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No workouts logged.</p>}
                    </ul>
                </div>

                {/* Food Log */}
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem', animationDelay: '0.2s' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Food Log</h3>
                    <form onSubmit={addMeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={mealType}
                                onChange={(e) => setMealType(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: 'var(--radius-sm)',
                                    outline: 'none'
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
                                placeholder="What did you eat?"
                                value={mealInput}
                                onChange={(e) => setMealInput(e.target.value)}
                                style={{ flex: 1 }}
                            />
                        </div>
                        <button type="submit" className="btn-primary">Add Meal</button>
                    </form>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {meals.map(item => (
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
                                        onChange={() => toggleMeal(item.id)}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                    />
                                    <div>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--primary)',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            marginRight: '0.5rem'
                                        }}>{item.type}</span>
                                        <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteItem('meal', item.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                                >✕</button>
                            </div>
                        ))}
                        {meals.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No meals logged.</p>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardDay;
