'use client';

import { useState } from 'react';
import { ClientForm } from '@/components/ClientForm';
import { ClientList } from '@/components/ClientList';
import { CalendarView } from '@/components/CalendarView';
import { logout } from '@/app/actions/auth';

export function Dashboard() {
    const [activeTab, setActiveTab] = useState<'register' | 'view' | 'calendar'>('register');

    return (
        <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
            {/* Background orbs */}
            <div className="orb" style={{ width: 400, height: 400, background: '#7c3aed', top: '-10%', left: '-10%' }} />
            <div className="orb" style={{ width: 350, height: 350, background: '#6366f1', bottom: '-5%', right: '-8%' }} />
            <div className="orb" style={{ width: 200, height: 200, background: '#818cf8', top: '50%', left: '60%' }} />

            <div className="relative z-10 flex flex-col min-h-screen px-4 py-10 max-w-6xl mx-auto">

                {/* Header & Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 glass-card p-4 rounded-2xl animate-fade-in-up">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl"
                            style={{ background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold"
                                style={{ background: 'linear-gradient(135deg, #f1f5f9, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Client Reminder
                            </h1>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Workspace
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'register' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            📝 Register
                        </button>
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'view' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            📋 Clients
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'calendar' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            📅 Calendar
                        </button>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                    >
                        Log Out
                    </button>
                </div>

                {/* Content Area */}
                <div className="w-full flex-1 flex flex-col pb-10">
                    {activeTab === 'register' && (
                        <div className="max-w-xl mx-auto w-full animate-fade-in-up">
                            <ClientForm />
                        </div>
                    )}

                    {activeTab === 'view' && (
                        <div className="w-full animate-fade-in-up">
                            <ClientList />
                        </div>
                    )}

                    {activeTab === 'calendar' && (
                        <div className="w-full animate-fade-in-up">
                            <CalendarView />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
