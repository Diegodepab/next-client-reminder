'use client';

import { useState } from 'react';

export function ClientForm() {
    const [formData, setFormData] = useState({
        clientName: '',
        lastServiceDate: new Date().toISOString().split('T')[0], // Default to today
        frequency: '6', // Default 6 months as user requested
        task: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: '✅ Client registered successfully!' });
                setFormData({
                    clientName: '',
                    lastServiceDate: new Date().toISOString().split('T')[0],
                    frequency: '6',
                    task: '',
                    phone: '',
                });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to register client' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="glass-card p-6 sm:p-8 animate-fade-in-up-delay">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold" style={{ color: 'white' }}>New Client</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Register a new maintenance cycle</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Client Name */}
                <div>
                    <label htmlFor="clientName" className="label-text">
                        👤 Client Name <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        id="clientName"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleChange}
                        className="input-dark w-full px-4 py-3"
                        placeholder="Enter client name"
                    />
                </div>

                {/* Date + Frequency Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="lastServiceDate" className="label-text">
                            📅 Last Service Date
                        </label>
                        <input
                            type="date"
                            id="lastServiceDate"
                            name="lastServiceDate"
                            value={formData.lastServiceDate}
                            onChange={handleChange}
                            className="input-dark w-full px-4 py-3"
                        />
                    </div>
                    <div>
                        <label htmlFor="frequency" className="label-text">
                            🔄 Frequency <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                        </label>
                        <select
                            id="frequency"
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleChange}
                            className="input-dark w-full px-4 py-3"
                        >
                            <option value="">No reminder</option>
                            <option value="1">Every 1 month</option>
                            <option value="2">Every 2 months</option>
                            <option value="3">Every 3 months</option>
                            <option value="6">Every 6 months (Default)</option>
                            <option value="12">Every 12 months</option>
                        </select>
                    </div>
                </div>

                {/* Task */}
                <div>
                    <label htmlFor="task" className="label-text">
                        🔧 Maintenance Task <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                        id="task"
                        name="task"
                        value={formData.task}
                        onChange={handleChange}
                        rows={3}
                        className="input-dark w-full px-4 py-3 resize-none"
                        placeholder="Describe the maintenance task..."
                    />
                </div>

                {/* Phone */}
                <div>
                    <label htmlFor="phone" className="label-text">
                        📞 Phone Number <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-dark w-full px-4 py-3"
                        placeholder="+34 600 000 000"
                    />
                </div>

                {/* Status Message */}
                {message.text && (
                    <div className={`p-4 text-sm font-medium rounded-lg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        {message.text}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-gradient w-full py-3.5 text-base mt-2"
                >
                    <span className="flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Registering...
                            </>
                        ) : (
                            'Register Client'
                        )}
                    </span>
                </button>
            </form>
        </div>
    );
}
