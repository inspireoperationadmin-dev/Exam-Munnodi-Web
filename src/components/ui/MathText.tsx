import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

const delimiters = [
  { open: '$$', close: '$$', displayMode: true },
  { open: '\\[', close: '\\]', displayMode: true },
  { open: '\\(', close: '\\)', displayMode: false },
  { open: '$', close: '$', displayMode: false },
] as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\r?\n/g, '<br />');
}

function renderMath(value: string, displayMode: boolean) {
  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    strict: false,
    trust: false,
  });
}

function renderMixedContent(text: string) {
  let html = '';
  let cursor = 0;

  while (cursor < text.length) {
    const match = delimiters
      .map((delimiter) => ({
        delimiter,
        index: text.indexOf(delimiter.open, cursor),
      }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index || b.delimiter.open.length - a.delimiter.open.length)[0];

    if (!match) {
      html += escapeHtml(text.slice(cursor));
      break;
    }

    if (match.index > cursor) {
      html += escapeHtml(text.slice(cursor, match.index));
    }

    const contentStart = match.index + match.delimiter.open.length;
    const contentEnd = text.indexOf(match.delimiter.close, contentStart);

    if (contentEnd < 0) {
      html += escapeHtml(text.slice(match.index));
      break;
    }

    const math = text.slice(contentStart, contentEnd).trim();
    html += math ? renderMath(math, match.delimiter.displayMode) : escapeHtml(text.slice(match.index, contentEnd + match.delimiter.close.length));
    cursor = contentEnd + match.delimiter.close.length;
  }

  return html;
}

export function MathText({ text, className }: MathTextProps) {
  return (
    <span
      className={`math-content ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: renderMixedContent(text) }}
    />
  );
}
