import { useState } from 'react';
import { theme } from '../../theme/theme';

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function PasswordField({ label, className = '', ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={`grid gap-1.5 ${theme.text.label}`}>
      {label}
      <span className="relative block">
        <input
          className={`${theme.control.input} w-full pr-11 ${className}`}
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          type="button"
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${theme.control.iconButton}`}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9.4 5.4A9.7 9.7 0 0112 5c5 0 8.5 4.2 9.6 5.8a2 2 0 010 2.4 17.4 17.4 0 01-2.4 2.8M6.2 6.9a17.9 17.9 0 00-3.8 3.9 2 2 0 000 2.4C3.5 14.8 7 19 12 19a9.7 9.7 0 004.2-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M2.4 10.8C3.5 9.2 7 5 12 5s8.5 4.2 9.6 5.8a2 2 0 010 2.4C20.5 14.8 17 19 12 19s-8.5-4.2-9.6-5.8a2 2 0 010-2.4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>
      </span>
    </label>
  );
}
