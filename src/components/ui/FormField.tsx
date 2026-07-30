import { theme } from '../../theme/theme';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormField({ label, className = '', ...props }: FormFieldProps) {
  return (
    <label className={`grid gap-1.5 ${theme.text.label}`}>
      {label}
      <input
        className={`${theme.control.input} ${className}`}
        {...props}
      />
    </label>
  );
}
