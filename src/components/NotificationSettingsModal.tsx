'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { NotificationSettings } from '@/lib/googleSheets';

interface NotificationSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_MESSAGE = { type: 'idle', text: '' } as const;

function getDefaultSettings(): NotificationSettings {
  return {
    enabled: true,
    sendTelegram: true,
    sendEmail: false,
    sendWhatsApp: false,
    frequency: 'daily',
    weeklyDay: 1,
    notifyHour: 9,
    daysAhead: 7,
    timeZone: 'Europe/Madrid',
    lastTriggeredAt: '',
  };
}

function getUpcomingPreview(settings: NotificationSettings, locale: 'es' | 'en') {
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(settings.notifyHour);

  while (true) {
    const weekday = next.getDay();
    if (settings.frequency === 'daily' || weekday === settings.weeklyDay) {
      break;
    }
    next.setDate(next.getDate() + 1);
  }

  if (next.getTime() < Date.now()) {
    next.setDate(next.getDate() + (settings.frequency === 'daily' ? 1 : 7));
  }

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: settings.timeZone,
  }).format(next);
}

export function NotificationSettingsModal({ open, onClose }: NotificationSettingsModalProps) {
  const { locale, t } = useI18n();
  const [settings, setSettings] = useState<NotificationSettings>(getDefaultSettings());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'idle' | 'success' | 'error'; text: string }>(EMPTY_MESSAGE);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setFeedback(EMPTY_MESSAGE);

      try {
        const response = await fetch('/api/settings');
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const details = data && typeof data === 'object' ? (data.details || data.error) : null;
          throw new Error(typeof details === 'string' && details.trim() ? details : t('settingsLoadFailed'));
        }

        if (!cancelled && data && typeof data === 'object' && data.settings) {
          setSettings(data.settings as NotificationSettings);
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback({
            type: 'error',
            text: error instanceof Error ? error.message : t('settingsLoadFailed'),
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const weekDays = useMemo(() => [
    { value: 1, label: t('monday') },
    { value: 2, label: t('tuesday') },
    { value: 3, label: t('wednesday') },
    { value: 4, label: t('thursday') },
    { value: 5, label: t('friday') },
    { value: 6, label: t('saturday') },
    { value: 0, label: t('sunday') },
  ], [t]);

  const nextRunLabel = useMemo(() => getUpcomingPreview(settings, locale), [settings, locale]);

  if (!open) {
    return null;
  }

  async function saveSettings() {
    if (settings.enabled && !settings.sendTelegram && !settings.sendEmail && !settings.sendWhatsApp) {
      setFeedback({ type: 'error', text: t('noChannelsEnabled') });
      return;
    }

    setSaving(true);
    setFeedback(EMPTY_MESSAGE);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('settingsSaveFailed'));
      }

      if (data && typeof data === 'object' && data.settings) {
        setSettings(data.settings as NotificationSettings);
      }

      setFeedback({ type: 'success', text: t('settingsSaved') });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : t('settingsSaveFailed'),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 p-4 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{t('reminderSettings')}</h2>
            <p className="mt-1 text-sm text-gray-400">{t('automaticReminders')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/10"
          >
            {t('close')}
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-300">{t('loadingSettings')}</div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{t('automaticReminders')}</p>
                  <p className="text-xs text-gray-400">{t('nextRunLabel')}: {nextRunLabel}</p>
                </div>
                <label className="inline-flex items-center gap-3 text-sm text-gray-200">
                  <span>{settings.enabled ? 'ON' : 'OFF'}</span>
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">{t('notificationChannels')}</p>
                <div className="mt-3 space-y-3 text-sm text-gray-200">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.sendTelegram}
                      onChange={(event) => setSettings((current) => ({ ...current, sendTelegram: event.target.checked }))}
                    />
                    <span>{t('notifyTelegram')}</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.sendEmail}
                      onChange={(event) => setSettings((current) => ({ ...current, sendEmail: event.target.checked }))}
                    />
                    <span>{t('notifyEmail')}</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.sendWhatsApp}
                      onChange={(event) => setSettings((current) => ({ ...current, sendWhatsApp: event.target.checked }))}
                    />
                    <span>{t('notifyWhatsApp')}</span>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-sm font-medium text-white">{t('notificationHour')}</label>
                <select
                  value={settings.notifyHour}
                  onChange={(event) => setSettings((current) => ({ ...current, notifyHour: Number(event.target.value) }))}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
                >
                  {Array.from({ length: 24 }).map((_, index) => (
                    <option key={index} value={index}>
                      {String(index).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-400">{t('timeZoneLabel')}: {settings.timeZone}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-sm font-medium text-white">{t('notificationFrequency')}</label>
                <select
                  value={settings.frequency}
                  onChange={(event) => setSettings((current) => ({ ...current, frequency: event.target.value === 'weekly' ? 'weekly' : 'daily' }))}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
                >
                  <option value="daily">{t('daily')}</option>
                  <option value="weekly">{t('weekly')}</option>
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-sm font-medium text-white">{t('weeklyDay')}</label>
                <select
                  value={settings.weeklyDay}
                  onChange={(event) => setSettings((current) => ({ ...current, weeklyDay: Number(event.target.value) }))}
                  disabled={settings.frequency !== 'weekly'}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
                >
                  {weekDays.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-sm font-medium text-white">{t('notificationDaysAhead')}</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.daysAhead}
                  onChange={(event) => setSettings((current) => ({ ...current, daysAhead: Number(event.target.value) || 1 }))}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
            </div>

            {feedback.text && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-400/20 bg-red-500/10 text-red-200'
              }`}>
                {feedback.text}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
              >
                {t('closeSettings')}
              </button>
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={saving}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {saving ? t('savingSettings') : t('save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
