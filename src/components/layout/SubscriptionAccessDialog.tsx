import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import { listenForSubscriptionRequired } from '../../services/api';
import { theme } from '../../theme/theme';

export function SubscriptionAccessDialog() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  useEffect(() => listenForSubscriptionRequired((detail) => {
    setMessage(detail.message);
  }), []);

  if (!message) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--sf-scrim)] px-4"
      role="dialog"
    >
      <Panel className="w-full max-w-sm shadow-xl">
        <h2 className={theme.text.panelTitle}>{t('subscriptionRequiredTitle')}</h2>
        <p className={`mt-2 ${theme.text.body}`}>
          {message || t('subscriptionRequiredText')}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button onClick={() => setMessage('')} type="button" variant="secondary">
            {t('notNow')}
          </Button>
          <Button
            onClick={() => {
              setMessage('');
              navigate('/subscription');
            }}
            type="button"
          >
            {t('viewPlans')}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
