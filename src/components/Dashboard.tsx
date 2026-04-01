'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientForm } from '@/components/ClientForm';
import { ClientList } from '@/components/ClientList';
import { CalendarView } from '@/components/CalendarView';
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal';
import { logout } from '@/app/actions/auth';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';

export function Dashboard() {
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'register' | 'view' | 'calendar'>('register');
  const [sendingTelegramSummary, setSendingTelegramSummary] = useState(false);
  const [sendingGmailSummary, setSendingGmailSummary] = useState(false);
  const [sendingWhatsAppSummary, setSendingWhatsAppSummary] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function sendTelegramSummary() {
    setSendingTelegramSummary(true);
    setSummaryMessage(null);
    setMenuOpen(false);

    try {
      const response = await fetch('/api/telegram/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('telegramSummaryFailed'));
      }

      setSummaryMessage({ type: 'success', text: t('telegramSummarySent') });
    } catch (error) {
      setSummaryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('telegramSummaryFailed'),
      });
    } finally {
      setSendingTelegramSummary(false);
    }
  }

  async function sendGmailSummary() {
    setSendingGmailSummary(true);
    setSummaryMessage(null);
    setMenuOpen(false);

    try {
      const response = await fetch('/api/gmail/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('gmailSummaryFailed'));
      }

      setSummaryMessage({ type: 'success', text: t('gmailSummarySent') });
    } catch (error) {
      setSummaryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('gmailSummaryFailed'),
      });
    } finally {
      setSendingGmailSummary(false);
    }
  }

  async function sendWhatsAppSummary() {
    setSendingWhatsAppSummary(true);
    setSummaryMessage(null);
    setMenuOpen(false);

    try {
      const response = await fetch('/api/whatsapp/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const details = data && typeof data === 'object' ? (data.details || data.error) : null;
        throw new Error(typeof details === 'string' && details.trim() ? details : t('whatsappSummaryFailed'));
      }

      setSummaryMessage({ type: 'success', text: t('whatsappSummarySent') });
    } catch (error) {
      setSummaryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('whatsappSummaryFailed'),
      });
    } finally {
      setSendingWhatsAppSummary(false);
    }
  }

  function toggleLocale() {
    setLocale(locale === 'es' ? 'en' : 'es');
    setMenuOpen(false);
  }

  function handleThemeToggle() {
    toggleTheme();
    setMenuOpen(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
      <div className="orb" style={{ width: 400, height: 400, background: theme === 'dark' ? '#7c3aed' : '#38bdf8', top: '-10%', left: '-10%' }} />
      <div className="orb" style={{ width: 350, height: 350, background: theme === 'dark' ? '#6366f1' : '#4f46e5', bottom: '-5%', right: '-8%' }} />
      <div className="orb" style={{ width: 200, height: 200, background: theme === 'dark' ? '#818cf8' : '#67e8f9', top: '50%', left: '60%' }} />

      <div className="relative z-10 flex flex-col min-h-screen px-4 py-10 max-w-6xl mx-auto overflow-visible">
        <div className="relative z-30 flex flex-col md:flex-row justify-between items-center mb-10 gap-6 glass-card p-4 rounded-2xl animate-fade-in-up overflow-visible">
          <div className="flex items-center gap-4">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, var(--text-primary), var(--accent-3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {t('appTitle')}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('workspace')}
              </p>
            </div>
          </div>

          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 78%, transparent)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'register'
                ? 'text-white shadow-lg'
                : 'hover:bg-white/10'
                }`}
              style={activeTab === 'register'
                ? { background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }
                : { color: 'var(--text-secondary)' }}
            >
              {t('tabRegister')}
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'view'
                ? 'text-white shadow-lg'
                : 'hover:bg-white/10'
                }`}
              style={activeTab === 'view'
                ? { background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }
                : { color: 'var(--text-secondary)' }}
            >
              {t('tabClients')}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'calendar'
                ? 'text-white shadow-lg'
                : 'hover:bg-white/10'
                }`}
              style={activeTab === 'calendar'
                ? { background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }
                : { color: 'var(--text-secondary)' }}
            >
              {t('tabCalendar')}
            </button>
          </div>

          <div className="relative z-40" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              aria-label={t('menu')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
              {t('menu')}
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full z-[80] mt-3 w-72 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={sendTelegramSummary}
                  disabled={sendingTelegramSummary || sendingGmailSummary || sendingWhatsAppSummary}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/10 disabled:opacity-60"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {sendingTelegramSummary ? t('sendingTelegramSummary') : t('sendTelegramSummary')}
                </button>
                <button
                  type="button"
                  onClick={sendGmailSummary}
                  disabled={sendingTelegramSummary || sendingGmailSummary || sendingWhatsAppSummary}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/10 disabled:opacity-60"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {sendingGmailSummary ? t('sendingGmailSummary') : t('sendGmailSummary')}
                </button>
                <button
                  type="button"
                  onClick={sendWhatsAppSummary}
                  disabled={sendingTelegramSummary || sendingGmailSummary || sendingWhatsAppSummary}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/10 disabled:opacity-60"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {sendingWhatsAppSummary ? t('sendingWhatsAppSummary') : t('sendWhatsAppSummary')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/10"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t('reminderSettings')}
                </button>
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/10"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {locale === 'es' ? 'EN' : 'ES'}
                </button>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/10"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
                  <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-red-500/10"
                  style={{ color: '#f87171' }}
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>

        {summaryMessage && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${summaryMessage.type === 'success'
            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
            : 'border-red-400/20 bg-red-500/10 text-red-200'
            }`}>
            {summaryMessage.text}
          </div>
        )}

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

      <NotificationSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}



