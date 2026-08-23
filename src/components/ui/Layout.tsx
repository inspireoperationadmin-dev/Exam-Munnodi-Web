import { theme, type ThemeWidth } from '../../theme/theme';

interface PageShellProps {
  children: React.ReactNode;
  maxWidth?: ThemeWidth;
}

export function PageShell({ children, maxWidth = 'lg' }: PageShellProps) {
  return (
    <main className={theme.shell.main}>
      <section className={`${theme.shell.section} ${theme.width[maxWidth]}`}>
        {children}
      </section>
    </main>
  );
}

export function PageHeader({ children }: { children: React.ReactNode }) {
  return <header className={theme.shell.header}>{children}</header>;
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`${theme.panel.base} ${className}`}>
      {children}
    </section>
  );
}

export function LoadingPanel({ label }: { label: string }) {
  return (
    <Panel className={theme.panel.loading}>
      {label}
    </Panel>
  );
}

export function EmptyState({ title, text, imageSrc }: { title: string; text: string; imageSrc?: string }) {
  return (
    <Panel className="text-center">
      {imageSrc && (
        <img
          alt=""
          aria-hidden="true"
          className="mx-auto mb-4 h-36 w-36 object-contain opacity-90"
          src={imageSrc}
        />
      )}
      <h2 className={theme.text.panelTitle}>{title}</h2>
      <p className={`mx-auto mt-2 max-w-xl ${theme.text.body}`}>{text}</p>
    </Panel>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className={theme.text.eyebrow}>{children}</p>;
}
