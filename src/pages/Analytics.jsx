import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useData } from '../utils/store';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const Analytics = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { history, weightLog, addWeight, prs, updatePR, isLoading } = useData();
    const [weightInput, setWeightInput] = useState('');

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
                Loading...
            </div>
        );
    }

    // 1. Gym Consistency Data (Visits per Month)
    const [timeRange, setTimeRange] = useState('7d'); // '7d', '1m', '1y', 'all'

    const getConsistencyData = () => {
        const today = new Date();
        let data = [];

        if (timeRange === '7d') {
            // Last 7 Days (Daily)
            data = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dateStr = format(d, 'yyyy-MM-dd');
                return {
                    name: format(d, 'EEE'), // Mon, Tue...
                    visited: history[dateStr]?.gymVisited ? 1 : 0,
                    fullDate: dateStr
                };
            });
        } else if (timeRange === '1m') {
            // Last 30 Days (Daily)
            data = Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const dateStr = format(d, 'yyyy-MM-dd');
                return {
                    name: format(d, 'dd'), // 01, 02...
                    visited: history[dateStr]?.gymVisited ? 1 : 0,
                    fullDate: dateStr
                };
            });
        } else if (timeRange === '1y') {
            // Last 12 Months (Monthly Aggregation)
            data = Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (11 - i));
                const monthStr = format(d, 'yyyy-MM');

                // Count visits in this month
                let count = 0;
                Object.keys(history).forEach(date => {
                    if (date.startsWith(monthStr) && history[date].gymVisited) {
                        count++;
                    }
                });

                return {
                    name: format(d, 'MMM'), // Jan, Feb...
                    visited: count
                };
            });
        } else if (timeRange === 'all') {
            // Lifetime (Yearly Aggregation)
            // Find min year from history or default to current year
            const years = new Set([today.getFullYear()]);
            Object.keys(history).forEach(date => years.add(parseISO(date).getFullYear()));
            const sortedYears = Array.from(years).sort();

            data = sortedYears.map(year => {
                let count = 0;
                Object.keys(history).forEach(date => {
                    if (date.startsWith(`${year} `) && history[date].gymVisited) {
                        count++;
                    }
                });
                return {
                    name: year.toString(),
                    visited: count
                };
            });
        }

        return data;
    };

    // 2. Body Weight Data
    const handleAddWeight = (e) => {
        e.preventDefault();
        if (!weightInput) return;
        const today = format(new Date(), 'yyyy-MM-dd');
        addWeight(today, parseFloat(weightInput));
        setWeightInput('');
    };

    // 3. PR Tracker (Max Weight)
    const [prExercise, setPrExercise] = useState('Bench Press');
    const [prWeight, setPrWeight] = useState('');
    const [prReps, setPrReps] = useState('');

    const getMaxWeight = (exerciseName) => {
        // 1. Check Manual PRs (from useData hook)
        const manual = prs[exerciseName] || { weight: 0, reps: 0 };

        // 2. Check History (Auto-Track)
        let maxAuto = { weight: 0, reps: 0 };
        Object.values(history).forEach(day => {
            day.workouts?.forEach(w => {
                // Case-insensitive check for exercise name
                if (w.text.toLowerCase().includes(exerciseName.toLowerCase()) && w.weight) {
                    const wWeight = parseFloat(w.weight);
                    if (wWeight > maxAuto.weight) {
                        maxAuto = { weight: wWeight, reps: parseInt(w.reps) || 0 };
                    }
                }
            });
        });

        // Return the winner
        return manual.weight > maxAuto.weight ? manual : maxAuto;
    };

    const addManualPR = (e) => {
        e.preventDefault();
        if (!prWeight) return;

        const currentMax = getMaxWeight(prExercise);
        const newWeight = parseFloat(prWeight);
        const newReps = parseInt(prReps) || 0;

        if (newWeight > currentMax.weight) {
            updatePR(prExercise, newWeight, newReps);
            alert(`New PR for ${prExercise}! 🎉`);
            setPrWeight('');
            setPrReps('');
        } else {
            alert(`That's not a PR yet! Current PR is ${currentMax.weight} kg.`);
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-outline"
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: 'auto', // Override mobile 100% width
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
                <h2 style={{ margin: 0, textAlign: 'center' }}>Analytics</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Consistency Chart */}
                <div className="glass-panel animate-slide-up">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--primary)', margin: 0 }}>Gym Consistency</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                            {['7d', '1m', '1y', 'all'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    style={{
                                        background: timeRange === range ? 'var(--primary)' : 'transparent',
                                        color: timeRange === range ? 'black' : 'var(--text-muted)',
                                        border: 'none',
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: timeRange === range ? 'bold' : 'normal',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {range === '7d' ? '7 Days' : range === '1m' ? '1 Month' : range === '1y' ? '1 Year' : 'Lifetime'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={getConsistencyData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="visited" fill="var(--primary)" radius={[4, 4, 0, 0]} animationDuration={500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Body Weight Tracker */}
                <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--secondary)', margin: 0 }}>Body Weight</h3>
                        <form onSubmit={handleAddWeight} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
                                placeholder="kg/lbs"
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                                style={{
                                    width: '100px',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>+</button>
                        </form>
                    </div>

                    {weightLog.length > 0 ? (
                        <div style={{ height: '250px', width: '100%' }}>
                            <ResponsiveContainer>
                                <LineChart data={weightLog}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="date" stroke="#888" tickFormatter={str => format(parseISO(str), 'MM/dd')} />
                                    <YAxis stroke="#888" domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="weight" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                            Start logging your weight to see the graph!
                        </p>
                    )}
                </div>

                {/* PR Tracker (Max Weight) */}
                <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--accent)', margin: 0 }}>🏆 Personal Records</h3>

                        {/* Manual PR Entry Form */}
                        <form onSubmit={addManualPR} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                                value={prExercise}
                                onChange={(e) => setPrExercise(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    padding: '8px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem',
                                    outline: 'none'
                                }}
                            >
                                {['Bench Press', 'Squat', 'Deadlift', 'Pull Ups', 'Push Ups'].map(ex => (
                                    <option key={ex} value={ex}>{ex}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="kg"
                                value={prWeight}
                                onChange={(e) => setPrWeight(e.target.value)}
                                style={{
                                    width: '60px',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="reps"
                                value={prReps}
                                onChange={(e) => setPrReps(e.target.value)}
                                style={{
                                    width: '50px',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none'
                                }}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>+</button>
                        </form>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                        {['Bench Press', 'Squat', 'Deadlift', 'Pull Ups', 'Push Ups'].map(exercise => {
                            const record = getMaxWeight(exercise);
                            return (
                                <div key={exercise} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{exercise}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                                        {record.weight} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {record.reps} reps
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
