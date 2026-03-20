'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function ClientForm() {
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    clientName: '',
    lastServiceDate: new Date().toISOString().split('T')[0],
    frequency: '6',
    task: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

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
        setMessage({ type: 'success', text: t('clientRegistered') });
        setFormData({
          clientName: '',
          lastServiceDate: new Date().toISOString().split('T')[0],
          frequency: '6',
          task: '',
          phone: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || t('failedRegisterClient') });
      }
    } catch {
      setMessage({ type: 'error', text: t('networkErrorRetry') });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in-up-delay">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold" style={{ color: 'white' }}>
          {t('newClientTitle')}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {t('newClientSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="clientName" className="label-text">
            {t('clientName')} <span className="text-xs text-gray-500 font-normal">{t('optional')}</span>
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            className="input-dark w-full px-4 py-3"
            placeholder={t('clientName')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lastServiceDate" className="label-text">
              {t('lastServiceDate')}
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
              {t('frequency')} <span className="text-xs text-gray-500 font-normal">{t('optional')}</span>
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="input-dark w-full px-4 py-3"
            >
              <option value="">{t('noReminder')}</option>
              <option value="1">{t('everyMonths', { n: 1 })}</option>
              <option value="2">{t('everyMonths', { n: 2 })}</option>
              <option value="3">{t('everyMonths', { n: 3 })}</option>
              <option value="6">{t('every6Default')}</option>
              <option value="12">{t('everyMonths', { n: 12 })}</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="task" className="label-text">
            {t('maintenanceTask')} <span className="text-xs text-gray-500 font-normal">{t('optional')}</span>
          </label>
          <textarea
            id="task"
            name="task"
            value={formData.task}
            onChange={handleChange}
            rows={3}
            className="input-dark w-full px-4 py-3 resize-none"
            placeholder={t('maintenanceTask')}
          />
        </div>

        <div>
          <label htmlFor="phone" className="label-text">
            {t('phoneNumber')} <span className="text-xs text-gray-500 font-normal">{t('optional')}</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input-dark w-full px-4 py-3"
            placeholder={t('phoneNumber')}
          />
        </div>

        {message.text && (
          <div className={`p-4 text-sm font-medium rounded-lg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-gradient w-full py-3.5 text-base mt-2">
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('registering')}
              </>
            ) : (
              t('registerClient')
            )}
          </span>
        </button>
      </form>
    </div>
  );
}
