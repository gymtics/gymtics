import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useData } from '../utils/store';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Area, AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';

import { useToast } from '../components/ToastProvider';

const Analytics = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { history, weightLog, addWeight, prs, updatePR, deletePR, isLoading } = useData();
    const [weightInput, setWeightInput] = useState('');
    const toast = useToast();



    // Calculate Streak
    const getStreak = () => {
        const today = new Date();
        // Normalize today to string
        const todayStr = format(today, 'yyyy-MM-dd');

        let streak = 0;
        let currentDate = today;

        // If today is marked, start counting from today. 
        // If not, start check from yesterday (to see if streak is active but just not logged today yet)
        if (!history[todayStr]?.gymVisited) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        while (true) {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            if (history[dateStr]?.gymVisited) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    };

    const currentStreak = getStreak();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
                <div className="animate-pulse">Loading Analytics...</div>
            </div>
        );
    }

    // 1. Gym Consistency Data
    const [timeRange, setTimeRange] = useState('7d');



    const getConsistencyData = () => {
        const today = new Date();
        let data = [];

        if (timeRange === '7d') {
            data = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dateStr = format(d, 'yyyy-MM-dd');
                return {
                    name: format(d, 'EEE'),
                    visited: history[dateStr]?.gymVisited ? 1 : 0,
                    fullDate: dateStr
                };
            });
        } else if (timeRange === '1m') {
            data = Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const dateStr = format(d, 'yyyy-MM-dd');
                return {
                    name: format(d, 'dd'),
                    visited: history[dateStr]?.gymVisited ? 1 : 0,
                    fullDate: dateStr
                };
            });
        } else if (timeRange === '1y') {
            data = Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (11 - i));
                const monthStr = format(d, 'yyyy-MM');
                let count = 0;
                Object.keys(history).forEach(date => {
                    if (date.startsWith(monthStr) && history[date].gymVisited) count++;
                });
                return { name: format(d, 'MMM'), visited: count };
            });
        } else if (timeRange === 'all') {
            const years = new Set([today.getFullYear()]);
            Object.keys(history).forEach(date => years.add(parseISO(date).getFullYear()));
            const sortedYears = Array.from(years).sort();
            data = sortedYears.map(year => {
                let count = 0;
                Object.keys(history).forEach(date => {
                    if (date.startsWith(`${year} `) && history[date].gymVisited) count++;
                });
                return { name: year.toString(), visited: count };
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

    // 3. PR Tracker
    const [prExercise, setPrExercise] = useState('Bench Press');
    const [prWeight, setPrWeight] = useState('');
    const [prReps, setPrReps] = useState('');

    const getMaxWeight = (exerciseName) => {
        const manual = prs[exerciseName] || { weight: 0, reps: 0 };
        let maxAuto = { weight: 0, reps: 0 };
        Object.values(history).forEach(day => {
            day.workouts?.forEach(w => {
                if (w.text.toLowerCase().includes(exerciseName.toLowerCase()) && w.weight) {
                    const wWeight = parseFloat(w.weight);
                    if (wWeight > maxAuto.weight) {
                        maxAuto = { weight: wWeight, reps: parseInt(w.reps) || 0 };
                    }
                }
            });
        });
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

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '0.8rem' }}>{label}</p>
                    <p style={{ color: '#fff', margin: '4px 0 0', fontWeight: 'bold' }}>
                        {payload[0].value} {payload[0].name === 'visited' ? 'Visits' : 'kg'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', paddingTop: '2rem' }}>
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-outline"
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: 'auto',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-muted)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    ← Back
                </button>
                <div className="flex-center" style={{ flexDirection: 'column' }}>
                    <h2 className="text-gradient" style={{ margin: 0, textAlign: 'center', fontSize: '2rem', letterSpacing: '-0.5px' }}>
                        Analytics
                    </h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(255, 165, 0, 0.15)',
                            border: '1px solid rgba(255, 165, 0, 0.3)',
                            padding: '4px 12px',
                            borderRadius: '20px'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>💪</span>
                            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{currentStreak} Day Streak</span>
                        </div>

                        <button
                            onClick={() => navigate('/leaderboard')}
                            style={{
                                marginTop: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'rgba(50, 205, 50, 0.15)',
                                border: '1px solid rgba(50, 205, 50, 0.3)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                color: '#4ade80',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>🏆</span>
                            <span>Leaderboard</span>
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* Consistency Chart */}
                <div className="glass-panel animate-slide-up" style={{
                    background: 'linear-gradient(145deg, rgba(30,30,30,0.6) 0%, rgba(20,20,20,0.8) 100%)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>💪</span>
                            <h3 style={{ color: '#fff', margin: 0, fontWeight: '600' }}>Consistency</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
                            {['7d', '1m', '1y', 'all'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    style={{
                                        background: timeRange === range ? 'var(--primary)' : 'transparent',
                                        color: timeRange === range ? 'black' : '#888',
                                        border: 'none',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {range === '7d' ? 'Week' : range === '1m' ? 'Month' : range === '1y' ? 'Year' : 'All'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={getConsistencyData()}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#666"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar
                                    dataKey="visited"
                                    fill="url(#barGradient)"
                                    radius={[6, 6, 0, 0]}
                                    animationDuration={800}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Body Weight Tracker */}
                <div className="glass-panel animate-slide-up" style={{
                    animationDelay: '0.1s',
                    background: 'linear-gradient(145deg, rgba(30,30,30,0.6) 0%, rgba(20,20,20,0.8) 100%)',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                            <h3 style={{ color: '#fff', margin: 0, fontWeight: '600' }}>Body Weight</h3>
                        </div>
                        <form onSubmit={handleAddWeight} style={{
                            display: 'flex',
                            gap: '0.5rem',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '4px',
                            borderRadius: '10px',
                            marginLeft: 'auto' // Force alignment to right even when wrapped
                        }}>
                            <input
                                type="number"
                                placeholder="Add weight..."
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                                style={{
                                    width: '100px', // Slightly reduced for mobile
                                    padding: '8px 12px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button type="submit" className="btn-primary" style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '1.2rem',
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>+</button>
                        </form>
                    </div>

                    {weightLog.length > 0 ? (
                        <div style={{ height: '280px', width: '100%' }}>
                            <ResponsiveContainer>
                                <AreaChart data={weightLog}>
                                    <defs>
                                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666"
                                        tickFormatter={str => format(parseISO(str), 'MM/dd')}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                        hide
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="var(--secondary)"
                                        strokeWidth={3}
                                        fill="url(#weightGradient)"
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            border: '1px dashed rgba(255,255,255,0.1)'
                        }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                No weight data yet. Start logging to track your progress! 📈
                            </p>
                        </div>
                    )}
                </div>

            </div>



            {/* PR Tracker */}
            <div className="glass-panel animate-slide-up" style={{
                animationDelay: '0.2s',
                background: 'linear-gradient(145deg, rgba(30,30,30,0.6) 0%, rgba(20,20,20,0.8) 100%)',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🏆</span>
                        <h3 style={{ color: '#fff', margin: 0, fontWeight: '600' }}>Personal Records</h3>
                    </div>

                    {/* Manual PR Entry Form */}
                    <form onSubmit={addManualPR} style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '6px',
                        borderRadius: '12px',
                        flexWrap: 'wrap', // Allow wrapping but keep groups together
                        justifyContent: 'flex-start' // Align to left
                    }}>
                        <select
                            value={prExercise}
                            onChange={(e) => setPrExercise(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                padding: '8px',
                                fontSize: '0.9rem',
                                outline: 'none',
                                fontWeight: '500',
                                cursor: 'pointer',
                                maxWidth: '120px'
                            }}
                        >
                            {['Bench Press', 'Squat', 'Deadlift', 'Pull Ups', 'Push Ups'].map(ex => (
                                <option key={ex} value={ex} style={{ background: '#222' }}>{ex}</option>
                            ))}
                        </select>

                        {/* Group Inputs and Button to prevent separation */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <input
                                type="number"
                                placeholder="kg"
                                value={prWeight}
                                onChange={(e) => setPrWeight(e.target.value)}
                                style={{
                                    width: '50px',
                                    padding: '8px 4px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    textAlign: 'center'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="reps"
                                value={prReps}
                                onChange={(e) => setPrReps(e.target.value)}
                                style={{
                                    width: '40px',
                                    padding: '8px 4px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    textAlign: 'center'
                                }}
                            />
                            <button type="submit" className="btn-primary" style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}>+</button>
                        </div>
                    </form>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {['Bench Press', 'Squat', 'Deadlift', 'Pull Ups', 'Push Ups'].map(exercise => {
                        const record = getMaxWeight(exercise);
                        const isSet = record.weight > 0;
                        return (
                            <div key={exercise} style={{
                                background: isSet
                                    ? 'linear-gradient(145deg, rgba(255, 215, 0, 0.1) 0%, rgba(0,0,0,0) 100%)'
                                    : 'rgba(255,255,255,0.03)',
                                padding: '1.2rem',
                                borderRadius: '16px',
                                textAlign: 'center',
                                border: isSet ? '1px solid rgba(255, 215, 0, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                transition: 'transform 0.2s',
                                cursor: 'default'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    {exercise}
                                </div>
                                <div style={{
                                    fontSize: '1.8rem',
                                    fontWeight: '800',
                                    color: isSet ? '#fff' : 'rgba(255,255,255,0.2)',
                                    textShadow: isSet ? '0 0 20px rgba(255, 215, 0, 0.3)' : 'none'
                                }}>
                                    {record.weight}
                                    <span style={{ fontSize: '0.9rem', color: isSet ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)', marginLeft: '4px', fontWeight: 'normal' }}>kg</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: isSet ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)', marginTop: '4px' }}>
                                    {record.reps} reps
                                </div>

                                {isSet && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toast.confirm(`Clear ${exercise} record?`, () => {
                                                deletePR(exercise);
                                                toast.success(`Cleared ${exercise} record`);
                                            });
                                        }}
                                        style={{
                                            marginTop: '10px',
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
                                            fontSize: '0.8rem',
                                            marginLeft: 'auto',
                                            marginRight: 'auto'
                                        }}
                                        title="Clear Record"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>

    );
};

export default Analytics;
