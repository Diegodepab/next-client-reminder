'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { formatDisplayDate } from '@/lib/dates';

interface ClientRecord {
  rowIndex: number;
  clientName: string;
  lastServiceDate?: string;
  frequency?: number;
  task?: string;
  phone?: string;
  nextDate: string;
  status?: string;
}

function normalizePhone(value: unknown): string {
  const phone = String(value ?? '').trim();
  return phone.startsWith("'") ? phone.slice(1) : phone;
}


function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toYmdLocal(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function normalizeName(value: string): string {
  return (value || '').trim().toLocaleLowerCase();
}

export function CalendarView() {
  const { t, locale } = useI18n();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formNextDate, setFormNextDate] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formLastServiceDate, setFormLastServiceDate] = useState('');
  const [formFrequency, setFormFrequency] = useState('0');
  const [formTask, setFormTask] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

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
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const daysInMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  }, [currentDate]);

  const startDayOfMonth = useMemo(() => {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [currentDate]);

  const clientsThisMonth = useMemo(() => {
    const map = new Map<number, ClientRecord[]>();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    clients.forEach((client) => {
      if (!client.nextDate) return;
      const d = new Date(client.nextDate);
      if (Number.isNaN(d.getTime())) return;
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)?.push(client);
      }
    });

    map.forEach((arr) => {
      arr.sort((a, b) => normalizeName(a.clientName).localeCompare(normalizeName(b.clientName)));
    });

    return map;
  }, [clients, currentDate]);

  const prevMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const selectedDateYmd = useMemo(() => {
    if (selectedDay === null) return '';
    return toYmdLocal(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
  }, [selectedDay, currentDate]);

  const selectedDayClients = useMemo(() => {
    if (selectedDay === null) return [];
    return clientsThisMonth.get(selectedDay) || [];
  }, [clientsThisMonth, selectedDay]);

  const headerLabel = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [currentDate, locale]);

  const weekDays = useMemo(() => {
    return locale === 'es'
      ? ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }, [locale]);

  function openDay(day: number) {
    const ymd = toYmdLocal(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(day);
    setModalError('');
    setMode('create');
    setEditingRowIndex(null);

    setFormNextDate(ymd);
    setFormClientName('');
    setFormLastServiceDate(ymd);
    setFormFrequency('0');
    setFormTask('');
    setFormPhone('');
  }

  function closeModal() {
    if (saving) return;
    setSelectedDay(null);
    setModalError('');
    setEditingRowIndex(null);
    setMode('create');
  }

  function startEdit(client: ClientRecord) {
    setMode('edit');
    setModalError('');
    setEditingRowIndex(client.rowIndex);

    setFormNextDate((client.nextDate || '').slice(0, 10) || selectedDateYmd);
    setFormClientName(client.clientName || '');
    setFormLastServiceDate((client.lastServiceDate || '').slice(0, 10) || '');
    setFormFrequency(String(client.frequency ?? 0));
    setFormTask(client.task || '');
    setFormPhone(normalizePhone(client.phone));
  }

  async function save() {
    if (!formClientName.trim()) {
      setModalError(t('clientNameRequired'));
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const frequencyNumber = formFrequency.trim() ? parseInt(formFrequency.trim(), 10) : 0;

      const payload: Record<string, unknown> = {
        clientName: formClientName.trim(),
        lastServiceDate: formLastServiceDate.trim(),
        frequency: Number.isFinite(frequencyNumber) ? frequencyNumber : 0,
        task: formTask.trim(),
        phone: formPhone.trim(),
        nextDate: formNextDate.trim(),
      };

      let method: 'POST' | 'PUT' = 'POST';
      if (mode === 'edit') {
        if (!editingRowIndex) throw new Error(t('missingRowIndexEdit'));
        method = 'PUT';
        payload.rowIndex = editingRowIndex;
      }

      const res = await fetch('/api/clients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('failedSaveAppointment'));
      }

      await fetchClients();
      setMode('create');
      setEditingRowIndex(null);
      setFormClientName('');
      setFormTask('');
      setFormPhone('');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : t('failedSaveAppointment'));
    } finally {
      setSaving(false);
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
      <div className="glass-card p-8 text-center text-red-300 space-y-4">
        <p>{error}</p>
        <button onClick={() => void fetchClients()} className="text-sm text-indigo-300 hover:text-indigo-200 underline">
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white text-sm">
            {t('calendarPrev')}
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-white text-center flex-1" style={{ textTransform: 'capitalize' }}>
            {headerLabel}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white text-sm">
            {t('calendarNext')}
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {weekDays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: startDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="p-1 sm:p-2 rounded-lg bg-white/[0.02] min-h-[60px] sm:min-h-[80px]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayClients = clientsThisMonth.get(day) || [];
            const today = new Date();
            const isToday =
              today.getDate() === day &&
              today.getMonth() === currentDate.getMonth() &&
              today.getFullYear() === currentDate.getFullYear();

            return (
              <button
                type="button"
                key={`day-${day}`}
                onClick={() => openDay(day)}
                className={`p-1 sm:p-2 font-medium min-h-[60px] sm:min-h-[80px] rounded-lg sm:rounded-xl border flex flex-col items-start transition-all text-left
                  ${isToday ? 'border-indigo-400/60 bg-indigo-500/15' : 'border-white/[0.06] bg-white/[0.03]'}
                  hover:border-indigo-400/40 hover:bg-white/[0.06]
                `}
              >
                <span className={`text-xs sm:text-sm ${isToday ? 'text-indigo-300 font-bold' : 'text-gray-400'}`}>
                  {day}
                </span>

                <div className="mt-0.5 sm:mt-1 w-full space-y-0.5 sm:space-y-1 overflow-hidden">
                  {dayClients.slice(0, 2).map((c) => (
                    <div
                      key={c.rowIndex}
                      className="truncate text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded border bg-indigo-500/20 border-indigo-400/30 text-indigo-100"
                      title={c.clientName}
                    >
                      {c.clientName || '-'}
                    </div>
                  ))}
                  {dayClients.length > 2 && (
                    <div className="text-[8px] sm:text-[10px] text-gray-500 italic pl-1">
                      {t('moreCount', { n: dayClients.length - 2 })}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onClick={closeModal}>
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{formatDisplayDate(selectedDateYmd, locale)}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {mode === 'create'
                    ? t('newAppointment')
                    : t('editAppointment', { row: editingRowIndex || '' })}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white text-xl leading-none" aria-label={t('close')}>
                x
              </button>
            </div>

            {selectedDayClients.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">{t('appointments')}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDayClients.map((c) => (
                    <button
                      key={c.rowIndex}
                      type="button"
                      onClick={() => startEdit(c)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors
                        ${mode === 'edit' && editingRowIndex === c.rowIndex
                          ? 'bg-indigo-500/30 border-indigo-400/40 text-white'
                          : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'}
                      `}
                    >
                      {c.clientName || '-'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('create');
                      setEditingRowIndex(null);
                      setModalError('');
                      setFormNextDate(selectedDateYmd);
                      setFormLastServiceDate(selectedDateYmd);
                      setFormFrequency('0');
                      setFormClientName('');
                      setFormTask('');
                      setFormPhone('');
                    }}
                    className="text-xs px-3 py-1 rounded-full border bg-emerald-500/15 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    + {t('newAppointment')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('appointmentDate')}</label>
                  <input
                    type="date"
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('lastServiceDate')}</label>
                  <input
                    type="date"
                    value={formLastServiceDate}
                    onChange={(e) => setFormLastServiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('clientName')}</label>
                <input
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  placeholder="Juan"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('frequency')} (meses)</label>
                  <input
                    inputMode="numeric"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
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
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('maintenanceTask')}</label>
                <input
                  value={formTask}
                  onChange={(e) => setFormTask(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              {modalError && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 disabled:opacity-60"
                >
                  {t('close')}
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-500/80 text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving ? t('saving') : (mode === 'create' ? t('create') : t('save'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
