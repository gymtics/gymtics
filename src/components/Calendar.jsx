import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';

const Calendar = ({ selectedDate, onDateSelect, gymHistory = {} }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="glass-panel" style={{ padding: 'var(--spacing-md)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={prevMonth}
                    className="btn-outline"
                    style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        lineHeight: 1
                    }}
                >
                    ‹
                </button>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{format(currentMonth, 'MMMM yyyy')}</h3>
                <button
                    onClick={nextMonth}
                    className="btn-outline"
                    style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        lineHeight: 1
                    }}
                >
                    ›
                </button>
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {/* Weekday Headers */}
                {weekDays.map(day => (
                    <div key={day} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {day}
                    </div>
                ))}

                {/* Calendar Days */}
                {days.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const hasVisited = gymHistory[dateKey]?.gymVisited;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateSelect(day)}
                            style={{
                                padding: '10px',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                background: isSelected ? 'var(--primary)' : hasVisited === true ? '#4ade80' : hasVisited === false ? '#ff4444' : 'transparent',
                                color: isSelected ? 'var(--bg-dark)' : (hasVisited === true || hasVisited === false) ? 'white' : isCurrentMonth ? 'white' : 'var(--text-muted)',
                                opacity: isCurrentMonth ? 1 : 0.4,
                                position: 'relative',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '60px',
                                gap: '4px'
                            }}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: '1rem', zIndex: 1 }}>{format(day, 'd')}</span>

                            {/* Indicator - Explicit checks */}
                            {hasVisited === true && <span style={{ fontSize: '0.8rem' }}>✅</span>}
                            {hasVisited === false && <span style={{ fontSize: '0.8rem' }}>❌</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(Calendar);
