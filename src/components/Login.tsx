'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
            {/* Background orbs */}
            <div className="orb" style={{ width: 400, height: 400, background: '#7c3aed', top: '-10%', left: '-10%' }} />
            <div className="orb" style={{ width: 350, height: 350, background: '#6366f1', bottom: '-5%', right: '-8%' }} />

            <div className="w-full max-w-sm glass-card p-8 animate-fade-in-up md:max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-float"
                        style={{ background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Secure Access</h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Enter your admin password to continue
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            className="input-dark w-full px-4 py-3 text-center tracking-widest"
                            placeholder="••••••••"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm font-medium alert-error text-center rounded-lg animate-fade-in-up">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-gradient w-full py-3.5 text-base flex justify-center items-center"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            'Enter Workspace'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
