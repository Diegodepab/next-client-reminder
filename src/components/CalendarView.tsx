'use client';

import { useState, useEffect, useMemo } from 'react';

interface ClientRecord {
    rowIndex: number;
    clientName: string;
    nextDate: string;
    status: string;
}

export function CalendarView() {
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation state
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        async function fetchClients() {
            try {
                const res = await fetch('/api/clients');
                if (res.ok) {
                    const data = await res.json();
                    setClients(data.clients || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchClients();
    }, []);

    // Calendar logic
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }, [currentDate]);

    const startDayOfMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = new Date(year, month, 1).getDay();
        // Adjust so Monday is 0 (European standard), instead of Sunday
        return day === 0 ? 6 : day - 1;
    }, [currentDate]);

    // Group clients by the specific days in the current viewed month
    const clientsThisMonth = useMemo(() => {
        const map = new Map<number, ClientRecord[]>();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        clients.forEach(client => {
            if (!client.nextDate) return;
            const d = new Date(client.nextDate);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!map.has(day)) map.set(day, []);
                map.get(day)?.push(client);
            }
        });
        return map;
    }, [clients, currentDate]);

    const prevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    const nextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    if (loading) {
        return (
            <div className="glass-card p-12 flex justify-center items-center">
                <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="glass-card p-6 md:p-8">
            {/* Header controls */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                    ← Prev
                </button>
                <h2 className="text-xl font-bold text-white text-center flex-1">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                    Next →
                </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 md:gap-3 lg:gap-4">
                {/* Empty slots for the start of the month */}
                {Array.from({ length: startDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2 rounded-xl bg-white/5 opacity-50 min-h-[80px]" />
                ))}

                {/* Actual days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayClients = clientsThisMonth.get(day) || [];
                    const hasClients = dayClients.length > 0;
                    const isToday =
                        new Date().getDate() === day &&
                        new Date().getMonth() === currentDate.getMonth() &&
                        new Date().getFullYear() === currentDate.getFullYear();

                    return (
                        <div
                            key={`day-${day}`}
                            className={`p-2 font-medium min-h-[80px] rounded-xl border flex flex-col items-start transition-all
                ${isToday ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/10 bg-white/5'}
                ${hasClients ? 'hover:border-indigo-400/50 hover:bg-white/10 cursor-pointer group' : ''}
              `}
                        >
                            <span className={`text-sm ${isToday ? 'text-indigo-300 font-bold' : 'text-gray-300'}`}>
                                {day}
                            </span>

                            <div className="mt-1 w-full space-y-1 overflow-hidden">
                                {dayClients.slice(0, 2).map((c, idx) => (
                                    <div key={idx} className="truncate text-[10px] sm:text-xs text-white bg-indigo-500/30 px-1.5 py-0.5 rounded border border-indigo-400/30">
                                        {c.clientName || 'Client'}
                                    </div>
                                ))}
                                {dayClients.length > 2 && (
                                    <div className="text-[10px] text-gray-400 italic">
                                        +{dayClients.length - 2} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
