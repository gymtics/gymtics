import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useData } from '../utils/store';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { format, parseISO } from 'date-fns';

import { exerciseLibrary, getCategories } from '../utils/exercises';
import { foodData, calculateCalories } from '../utils/foodData';
import { useToast } from '../components/ToastProvider';

const DashboardDay = () => {
    const { date } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const user = auth?.user;
    const context = useData();
    const toast = useToast();

    if (!auth) {
        return <div style={{ color: 'white', padding: '2rem' }}>Error: Auth Context missing.</div>;
    }

    if (!context) {
        return <div style={{ color: 'white', padding: '2rem' }}>Error: Data Context not found. Please refresh.</div>;
    }

    const { history, updateHistory, addWeight, deleteWeight, weightLog, isLoading } = context;
    const dateObj = parseISO(date);

    // Check if there is already a weight entry for this date
    const existingWeight = weightLog.find(log => log.date === date);

    // Local state for weight input in this view
    const [dayWeight, setDayWeight] = useState('');

    const saveDayWeight = (e) => {
        e.preventDefault();
        if (!dayWeight) return;
        addWeight(date, parseFloat(dayWeight));
        toast.success("Weight saved!");
        setDayWeight('');
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
                Loading...
            </div>
        );
    }

    // Get data for selected date or default
    const currentData = history[date] || {
        gymVisited: null,
        workouts: [],
        meals: []
    };

    // Defensive check to ensure arrays exist
    const workouts = Array.isArray(currentData.workouts) ? currentData.workouts : [];
    const meals = Array.isArray(currentData.meals) ? currentData.meals : [];

    // Input States
    const [workoutInput, setWorkoutInput] = useState('');
    const [categoryInput, setCategoryInput] = useState('Chest');

    // Workout Sets State
    const [currentSets, setCurrentSets] = useState([{ weight: '', reps: '' }]);

    // Food Inputs
    const [mealInput, setMealInput] = useState('');
    const [mealType, setMealType] = useState('Pre-workout');
    const [mealQuantity, setMealQuantity] = useState('');
    const [mealUnit, setMealUnit] = useState('100g');

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);

    // Clipboard Data
    const [clipboard, setClipboard] = useLocalStorage('gym_app_clipboard', null);

    // Handlers
    const triggerFullScreenEmoji = (emoji) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease-out;
        `;

        const emojiEl = document.createElement('div');
        emojiEl.innerText = emoji;
        emojiEl.style.cssText = `
            font-size: 15rem;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        `;

        // Add animations styles
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes popIn {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        overlay.appendChild(emojiEl);
        document.body.appendChild(overlay);

        // Remove after 1.5s
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                overlay.remove();
                style.remove();
            }, 300);
        }, 1500);
    };

    const toggleGymVisited = () => {
        let nextState;
        if (currentData.gymVisited === null || currentData.gymVisited === undefined) {
            nextState = true;
            triggerFullScreenEmoji('☠️');
        }
        else if (currentData.gymVisited === true) {
            nextState = false;
            triggerFullScreenEmoji('🤡');
        }
        else nextState = null; // No -> Unmarked

        updateHistory(date, { ...currentData, gymVisited: nextState });
    };

    const handleSetChange = (index, field, value) => {
        const newSets = [...currentSets];
        newSets[index][field] = value;
        setCurrentSets(newSets);
    };

    const addSetRow = () => {
        setCurrentSets([...currentSets, { weight: '', reps: '' }]);
    };

    const removeSetRow = (index) => {
        if (currentSets.length > 1) {
            setCurrentSets(currentSets.filter((_, i) => i !== index));
        }
    };

    const addWorkout = (e) => {
        e.preventDefault();
        if (!workoutInput.trim()) return;

        // Filter out empty sets
        const validSets = currentSets.filter(s => s.weight || s.reps);

        const newWorkout = {
            id: Date.now().toString(),
            text: workoutInput,
            category: categoryInput,
            sets: JSON.stringify(validSets), // Store as JSON string
            completed: false
        };
        updateHistory(date, { ...currentData, workouts: [...workouts, newWorkout] });

        // Reset form
        setWorkoutInput('');
        setCurrentSets([{ weight: '', reps: '' }]);
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

        // Smart default for quantity if empty
        let finalQty = parseFloat(mealQuantity);
        if (!finalQty || isNaN(finalQty)) {
            if (mealUnit.includes('100')) finalQty = 100; // Default to 100 for grams/ml
            else finalQty = 1; // Default to 1 for units
        }

        // Try to calculate calories even if manually typed
        const calories = calculateCalories(mealInput, finalQty, mealUnit);

        const newMeal = {
            id: Date.now().toString(),
            type: mealType,
            text: mealInput,
            quantity: finalQty,
            unit: mealUnit,
            calories: calories, // This will now be populated if matched
            completed: false
        };
        updateHistory(date, { ...currentData, meals: [...meals, newMeal] });
        setMealInput('');
        setMealQuantity('');
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
        toast.success("Plan copied successfully!");
    };

    const pastePlan = () => {
        try {
            const storedClipboard = clipboard || JSON.parse(window.localStorage.getItem('gym_app_clipboard'));

            if (!storedClipboard || !storedClipboard.workouts) {
                toast.error("Clipboard is empty!");
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
            toast.success("Plan pasted successfully!");
        } catch (err) {
            console.error("Paste failed:", err);
            toast.error("Failed to paste plan.");
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

    const filteredFoods = React.useMemo(() => {
        if (!mealInput) return [];
        const lowerInput = mealInput.toLowerCase();
        return Object.entries(foodData)
            .filter(([name]) => name.toLowerCase().includes(lowerInput))
            .sort(([a], [b]) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                // Prioritize exact match
                if (aLower === lowerInput) return -1;
                if (bLower === lowerInput) return 1;
                // Prioritize starts with
                const aStarts = aLower.startsWith(lowerInput);
                const bStarts = bLower.startsWith(lowerInput);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return 0;
            })
            .slice(0, 50); // Limit to 50 results for performance
    }, [mealInput]);

    return (
        <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>


            {/* Header with Back Button and Actions */}
            {/* Header with Back Button and Actions */}
            {/* Header with Back Button and Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>

                {/* Top Row: Back Button and Date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
                    <div style={{ position: 'absolute', left: 0 }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-outline"
                            style={{
                                width: 'auto',
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                border: '1px solid var(--text-muted)',
                                color: 'var(--text-muted)'
                            }}
                        >
                            ← Back
                        </button>
                    </div>
                    <h2 style={{ margin: 0, textAlign: 'center', fontSize: '1.5rem' }}>{format(dateObj, 'MMMM do, yyyy')}</h2>
                </div>

                {/* Action Buttons (Centered below date for clean look) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={copyPlan}
                        className="btn-outline"
                        style={{
                            fontSize: '0.85rem',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderColor: 'var(--text-muted)',
                            color: 'var(--text-muted)'
                        }}
                        title="Copy today's plan"
                    >
                        <span>📋</span> Copy Plan
                    </button>
                    <button
                        onClick={pastePlan}
                        className="btn-outline"
                        style={{
                            fontSize: '0.85rem',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderColor: 'var(--primary)',
                            color: 'var(--primary)'
                        }}
                        title="Paste plan from clipboard"
                    >
                        <span>📋</span> Paste Plan
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Gym Toggle & Weight */}
                <div className="glass-panel animate-slide-up" style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Row 1: Attendance Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div
                                    onClick={toggleGymVisited}
                                    style={{
                                        width: '70px',
                                        height: '36px',
                                        background: currentData.gymVisited === true ? 'var(--primary)' :
                                            currentData.gymVisited === false ? 'var(--accent)' : 'var(--glass-bg)',
                                        borderRadius: '20px',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s'
                                    }}
                                >
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        background: 'white',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: '4px',
                                        left: currentData.gymVisited === true ? '38px' :
                                            currentData.gymVisited === false ? '4px' : '21px',
                                        transition: 'left 0.3s',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem'
                                    }}>
                                        {currentData.gymVisited === true ? '✅' :
                                            currentData.gymVisited === false ? '❌' : ''}
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Gym Status</h3>
                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>Visited today?</p>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Weight Log */}
                        <div style={{
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>⚖️</span>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Body Weight</h3>
                            </div>

                            {existingWeight ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                                        {existingWeight.weight} kg
                                    </span>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Clear this weight entry?")) {
                                                deleteWeight(date);
                                                toast.success("Weight cleared");
                                            }
                                        }}
                                        style={{
                                            background: 'rgba(255, 68, 68, 0.2)',
                                            border: '1px solid rgba(255, 68, 68, 0.3)',
                                            color: '#ff4444',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >✕</button>
                                </div>
                            ) : (
                                <form onSubmit={saveDayWeight} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                    <input
                                        type="number"
                                        placeholder="Add kg..."
                                        value={dayWeight}
                                        onChange={(e) => setDayWeight(e.target.value)}
                                        style={{
                                            width: '80px',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Save</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Workout Log */}
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem', animationDelay: '0.1s' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Workout Log</h3>
                    <form onSubmit={addWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                        </div>

                        {/* Sets Builder */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {currentSets.map((set, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', width: '20px' }}>#{idx + 1}</span>
                                    <input
                                        type="number"
                                        placeholder="kg"
                                        value={set.weight}
                                        onChange={(e) => handleSetChange(idx, 'weight', e.target.value)}
                                        style={{ flex: 1, minWidth: '60px' }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Reps"
                                        value={set.reps}
                                        onChange={(e) => handleSetChange(idx, 'reps', e.target.value)}
                                        style={{ flex: 1, minWidth: '60px' }}
                                    />
                                    {currentSets.length > 1 && (
                                        <button type="button" onClick={() => removeSetRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>✕</button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addSetRow} style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Set</button>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Workout</button>
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {(() => {
                                                try {
                                                    const sets = JSON.parse(item.sets || '[]');
                                                    if (Array.isArray(sets) && sets.length > 0) {
                                                        return sets.map((s, i) => (
                                                            <span key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                Set {i + 1}: {s.weight}kg x {s.reps}
                                                            </span>
                                                        ));
                                                    }
                                                } catch (e) { }
                                                // Fallback for old data
                                                return (
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        {item.weight ? `${item.weight} kg • ` : ''}
                                                        {item.sets ? `${item.sets} Sets` : ''}
                                                        {item.sets && item.reps ? ' x ' : ''}
                                                        {item.reps ? `${item.reps} Reps` : ''}
                                                    </span>
                                                );
                                            })()}
                                        </div>
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
                <div className="glass-panel" style={{ padding: '2rem', overflow: 'visible' }}>
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
                            <div style={{ flex: 2, position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Food item (e.g. Banana)"
                                    value={mealInput}
                                    onChange={(e) => {
                                        setMealInput(e.target.value);
                                        if (e.target.value.length > 0) setShowFoodSuggestions(true);
                                    }}
                                    onFocus={() => {
                                        if (mealInput.length > 0) setShowFoodSuggestions(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowFoodSuggestions(false), 300)}
                                    style={{ width: '100%' }}
                                />
                                {showFoodSuggestions && filteredFoods.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        maxHeight: '250px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}>
                                        {filteredFoods.map(([name, data], idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setMealInput(name);
                                                    // Auto-set unit if possible (default to 100g/unit)
                                                    if (data.unit.includes('100g')) {
                                                        setMealUnit('100g');
                                                        setMealQuantity('100');
                                                    } else if (data.unit.includes('100ml')) {
                                                        setMealUnit('100ml');
                                                        setMealQuantity('100');
                                                    } else {
                                                        setMealUnit('1 unit');
                                                        setMealQuantity('1');
                                                    }
                                                    setShowFoodSuggestions(false);
                                                }}
                                                style={{
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                                className="hover-bg"
                                            >
                                                <span style={{ fontWeight: '500' }}>{name}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {data.calories} kcal / {data.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
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
                                <option value="100g">grams (100g base)</option>
                                <option value="1 unit">unit (e.g. 1 banana)</option>
                                <option value="100ml">ml (100ml base)</option>
                            </select>
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
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: 'var(--primary)',
                                                color: 'var(--bg-dark)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                marginRight: '8px'
                                            }}>{item.type}</span>
                                            <span style={{
                                                fontWeight: '500',
                                                textDecoration: item.completed ? 'line-through' : 'none',
                                                color: item.completed ? 'var(--text-muted)' : 'white'
                                            }}>{item.text}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span>
                                                {item.quantity ?? 0} {item.unit ? item.unit.replace('100', '').replace('1 ', '') : ''}
                                            </span>
                                            <span>•</span>
                                            <span style={{ color: 'var(--secondary)' }}>{item.calories || 0} kcal</span>
                                        </div>
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

            </div >
        </div >
    );
};

export default DashboardDay;
