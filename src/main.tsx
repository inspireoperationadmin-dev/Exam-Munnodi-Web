import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './features/auth/AuthContext';
import { RegistrationProvider } from './features/auth/RegistrationContext';
import { SubscriptionProvider } from './features/subscription/SubscriptionContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <RegistrationProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <App />
              </SubscriptionProvider>
            </AuthProvider>
          </RegistrationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
