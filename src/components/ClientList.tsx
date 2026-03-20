'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { isClientNotified } from '@/lib/clientStatus';

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

function normalizePhone(value: unknown): string {
  const phone = String(value ?? '').trim();
  return phone.startsWith(String.fromCharCode(39)) ? phone.slice(1) : phone;
}


function normalizeName(value: string): string {
  return (value || '').trim().toLocaleLowerCase();
}

function toDateInputValue(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function ClientList() {
  const { t, locale } = useI18n();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formLastServiceDate, setFormLastServiceDate] = useState('');
  const [formFrequency, setFormFrequency] = useState('');
  const [formTask, setFormTask] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNextDate, setFormNextDate] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clients');
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('failedFetchClients'));
      }

      setClients((data && typeof data === 'object' && Array.isArray(data.clients)) ? data.clients : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorLoadingClients'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    const q = normalizeName(searchName);
    if (!q) return clients;
    return clients.filter((c) => normalizeName(c.clientName).includes(q));
  }, [clients, searchName]);

  function openEdit(client: ClientRecord) {
    setEditError('');
    setEditing(client);
    setFormClientName(client.clientName || '');
    setFormLastServiceDate(toDateInputValue(client.lastServiceDate));
    setFormFrequency(String(client.frequency ?? ''));
    setFormTask(client.task || '');
    setFormPhone(normalizePhone(client.phone));
    setFormNextDate(toDateInputValue(client.nextDate));
  }

  function closeEdit() {
    if (saving || deleting) return;
    setEditing(null);
    setEditError('');
    setFormNextDate('');
  }

  async function saveEdit() {
    if (!editing) return;

    setSaving(true);
    setEditError('');
    try {
      const frequencyNumber = formFrequency.trim() ? parseInt(formFrequency.trim(), 10) : 0;

      const payload = {
        rowIndex: editing.rowIndex,
        clientName: formClientName.trim(),
        lastServiceDate: formLastServiceDate.trim(),
        frequency: Number.isFinite(frequencyNumber) ? frequencyNumber : 0,
        task: formTask.trim(),
        phone: formPhone.trim(),
        nextDate: formNextDate.trim(),
      };

      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('failedSaveAppointment'));
      }

      setEditing(null);
      await fetchClients();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : t('failedSaveAppointment'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrentClient() {
    if (!editing) return;
    if (!window.confirm(t('confirmDeleteClient'))) return;

    setDeleting(true);
    setEditError('');
    try {
      const res = await fetch(`/api/clients?rowIndex=${editing.rowIndex}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('failedDeleteClient'));
      }

      setEditing(null);
      await fetchClients();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : t('failedDeleteClient'));
    } finally {
      setDeleting(false);
    }
  }

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
      <div className="glass-card p-8 text-center text-red-400 space-y-4">
        <p>{error}</p>
        <button onClick={() => void fetchClients()} className="text-sm text-indigo-300 hover:text-indigo-200 underline">
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('clientsDirectory')}</h2>
          <p className="text-xs text-gray-400 mt-1">{t('searchExactHint')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative">
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={t('searchClientName')}
              className="w-full sm:w-72 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-indigo-400/40"
            />
            {searchName.trim() && (
              <button
                onClick={() => setSearchName('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={t('clearSearch')}
                type="button"
              >
                x
              </button>
            )}
          </div>

          <span className="bg-indigo-500/20 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full self-start sm:self-auto">
            {filteredClients.length}/{clients.length}
          </span>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400">
          <p>{t('noClientsYet')}</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400">
          <p>{t('noClientsMatch', { q: searchName })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.rowIndex}
              className="glass-card relative p-5 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => openEdit(client)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openEdit(client);
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" aria-hidden="true" />

              <div className="flex justify-between items-start mb-3 gap-3">
                <h3 className="font-semibold text-lg text-white truncate">
                  {client.clientName || '-'}
                </h3>
                {isClientNotified(client.status) ? (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-green-500/20 text-green-300 shrink-0">
                    {t('statusNotified')}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 shrink-0">
                    {t('statusPending')}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200 border border-indigo-400/20">
                  <span className="text-indigo-300">{t('nextService')}:</span>
                  <span>{client.nextDate ? new Date(client.nextDate).toLocaleDateString(locale) : t('unscheduled')}</span>
                </div>

                {client.phone && (
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500">Tel:</span>
                    {normalizePhone(client.phone)}
                  </p>
                )}
                {client.task && (
                  <p className="flex items-start gap-2">
                    <span className="text-gray-500">Task:</span>
                    {client.task}
                  </p>
                )}
                <div className="pt-3 mt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500 mb-1">{t('lastService')}</p>
                    <p className="font-medium text-gray-200">
                      {client.lastServiceDate ? new Date(client.lastServiceDate).toLocaleDateString(locale) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">{t('nextService')}</p>
                    <p className="font-medium text-indigo-300">
                      {client.nextDate ? new Date(client.nextDate).toLocaleDateString(locale) : t('unscheduled')}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 pt-2">{t('clickToEdit')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeEdit}>
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{t('editClient')}</h3>
                <p className="text-xs text-gray-400 mt-1">{t('rowNumber', { n: editing.rowIndex })}</p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="text-gray-400 hover:text-white text-xl leading-none"
                aria-label={t('close')}
              >
                x
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('nextService')}</label>
                  <input
                    type="date"
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                  />
                </div>
                <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-3">
                  <p className="text-xs text-indigo-200">{t('nextService')}</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formNextDate ? new Date(formNextDate).toLocaleDateString(locale) : t('unscheduled')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('clientName')}</label>
                <input
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('lastServiceDate')}</label>
                  <input
                    type="date"
                    value={formLastServiceDate}
                    onChange={(e) => setFormLastServiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('frequency')} (meses)</label>
                  <input
                    inputMode="numeric"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('maintenanceTask')}</label>
                <input
                  value={formTask}
                  onChange={(e) => setFormTask(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('phoneNumber')}</label>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              {editError && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {editError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={deleteCurrentClient}
                  disabled={saving || deleting}
                  className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                >
                  {deleting ? t('deleting') : t('deleteClient')}
                </button>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving || deleting}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 disabled:opacity-60"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={saving || deleting}
                    className="px-4 py-2 rounded-lg bg-indigo-500/80 text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {saving ? t('saving') : t('save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
