import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../utils/store';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { format } from 'date-fns';

const Dashboard = () => {
    const { user, logout, updateAvatar } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Date Selection
    const [selectedDate, setSelectedDate] = useState(new Date());
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    // History Data (All dates in one object)
    const [history, setHistory] = useLocalStorage('gym_app_history', {});

    // Get data for selected date or default
    const currentData = history[dateKey] || {
        gymVisited: null, // Default to neutral
        workouts: [],
        meals: []
    };

    // Input States
    const [workoutInput, setWorkoutInput] = useState('');
    const [setsInput, setSetsInput] = useState('');
    const [repsInput, setRepsInput] = useState('');
    const [mealInput, setMealInput] = useState('');
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
                completed: false
            }]
        });
        setWorkoutInput('');
        setSetsInput('');
        setRepsInput('');
    };

    const addMeal = (e) => {
        e.preventDefault();
        if (!mealInput.trim()) return;
        updateHistory({
            ...currentData,
            meals: [...currentData.meals, {
                id: Date.now(),
                type: mealType,
                text: mealInput,
                completed: false
            }]
        });
        setMealInput('');
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
                        </div >
                    </div >

    {/* Workout Log */ }
    < div className = "glass-panel animate-slide-up" style = {{ padding: '2rem', animationDelay: '0.1s' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Workout Log</h3>
                        <form onSubmit={addWorkout} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Exercise (e.g. Bench Press)"
                                value={workoutInput}
                                onChange={(e) => setWorkoutInput(e.target.value)}
                                style={{ flex: 2, minWidth: '150px' }}
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
                                            <span style={{
                                                fontWeight: 'bold',
                                                display: 'block',
                                                textDecoration: item.completed ? 'line-through' : 'none'
                                            }}>{item.text}</span>
                                            {(item.sets || item.reps) && (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {item.sets ? `${item.sets} Sets` : ''}
                                                    {item.sets && item.reps ? ' x ' : ''}
                                                    {item.reps ? `${item.reps} Reps` : ''}
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
                    </div >

    {/* Food Log */ }
    < div className = "glass-panel animate-slide-up" style = {{ padding: '2rem', animationDelay: '0.2s' }}>
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
                            {currentData.meals.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No meals logged.</p>}
                        </div>
                    </div >

                </div >
            </div >
        </div >
    );
};

export default Dashboard;
