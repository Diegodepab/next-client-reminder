'use client';

import { useState, useEffect } from 'react';

interface ClientRecord {
    rowIndex: number;
    clientName: string;
    lastServiceDate: string;
    frequency: number;
    task: string;
    phone: string;
    nextDate: string;
    status: string;
    notifiedAt: string;
}

export function ClientList() {
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchClients() {
            try {
                const res = await fetch('/api/clients');
                if (!res.ok) throw new Error('Failed to fetch clients');

                const data = await res.json();
                setClients(data.clients || []);
            } catch (err) {
                setError('Error loading clients. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchClients();
    }, []);

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

    if (error) {
        return (
            <div className="glass-card p-8 text-center text-red-400">
                <p>{error}</p>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="glass-card p-12 text-center text-gray-400">
                <p>No clients registered yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Clients Directory</h2>
                <span className="bg-indigo-500/20 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full">
                    {clients.length} Total
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clients.map((client, idx) => (
                    <div key={client.rowIndex || idx} className="glass-card p-5 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg text-white">
                                {client.clientName || 'Unnamed Client'}
                            </h3>
                            {client.status === 'Notified' ? (
                                <span className="text-xs font-medium px-2 py-1 rounded bg-green-500/20 text-green-300">
                                    Notified
                                </span>
                            ) : (
                                <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
                                    Pending
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 text-sm text-gray-300">
                            {client.phone && (
                                <p className="flex items-center gap-2">
                                    <span>📞</span>
                                    {/* Remove the leading apostrophe used for Google Sheets escaping */}
                                    {client.phone.startsWith("'") ? client.phone.slice(1) : client.phone}
                                </p>
                            )}
                            {client.task && (
                                <p className="flex items-start gap-2">
                                    <span>🔧</span> {client.task}
                                </p>
                            )}
                            <div className="pt-3 mt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Last Service</p>
                                    <p className="font-medium text-gray-200">
                                        {client.lastServiceDate ? new Date(client.lastServiceDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Next Service</p>
                                    <p className="font-medium text-indigo-300">
                                        {client.nextDate ? new Date(client.nextDate).toLocaleDateString() : 'Unscheduled'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
