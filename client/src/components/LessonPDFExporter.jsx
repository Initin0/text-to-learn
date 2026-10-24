import { forwardRef, useRef, useState } from 'react';

const PALETTES = {
  light: { bg: '#ffffff', ink: '#1b2340', muted: '#59627f', rule: '#d3ddf0', pen: '#2f4bd6', soft: '#eef2ff', ok: '#1d7f54', codeBg: '#0f1630', codeInk: '#e3e9ff', margin: '#e0525a' },
  dark: { bg: '#121829', ink: '#e7ebf6', muted: '#9ea8c6', rule: '#2a3557', pen: '#8fa3ff', soft: '#1c2547', ok: '#52c792', codeBg: '#0a0f1f', codeInk: '#e3e9ff', margin: '#f06a72' },
};

const PAGE_W = 794; // A4 width in CSS px at 96 dpi
const PAGE_H = 1123;
const MARGIN_Y = 52;

// **bold** and `code` handling for the print layout (plain text otherwise).
function PrintInline({ text = '', p }) {
  return String(text)
    .split('\n')
    .map((line, li) => (
      <span key={li}>
        {li > 0 && <br />}
        {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
          part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
            <code key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9em', background: p.soft, padding: '1px 5px', borderRadius: 4 }}>
              {part.slice(1, -1)}
            </code>
          ) : (
            part
          )
        )}
      </span>
    ));
}

// One unbreakable unit of the print layout; page breaks only fall between these.
function B({ children, style, keep }) {
  return (
    <div data-pdf-block data-pdf-keep={keep ? '' : undefined} style={{ paddingBottom: 14, ...style }}>
      {children}
    </div>
  );
}

const PrintLesson = forwardRef(function PrintLesson({ lesson, theme }, ref) {
  const p = PALETTES[theme];
  const quiz = lesson.content.filter((b) => b.type === 'mcq');
  const h = (size) => ({ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: size, lineHeight: 1.25, margin: 0, color: p.ink });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', left: -20000, top: 0, width: PAGE_W, background: p.bg, color: p.ink, padding: '0 64px', boxSizing: 'border-box', fontFamily: 'Atkinson Hyperlegible Next, sans-serif', fontSize: 15, lineHeight: 1.65 }}
    >
      <B style={{ borderLeft: `3px solid ${p.margin}`, paddingLeft: 16, marginBottom: 12 }}>
        <p style={{ margin: 0, color: p.muted, fontSize: 13 }}>
          {lesson.context.courseTitle} / Module {lesson.context.moduleIndex + 1}: {lesson.context.moduleTitle}
        </p>
        <h1 style={{ ...h(30), marginTop: 6 }}>{lesson.title}</h1>
      </B>

      {lesson.objectives?.length > 0 && (
        <B style={{ background: p.soft, borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
          <p style={{ margin: 0, fontWeight: 700, color: p.pen }}>By the end of this lesson you can</p>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20, listStyleType: 'disc' }}>
            {lesson.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </B>
      )}

      {lesson.content.map((b, i) => {
        if (b.type === 'heading') return <B key={i} keep style={{ paddingTop: 10 }}><h2 style={h(21)}>{b.text}</h2></B>;
        if (b.type === 'paragraph') return <B key={i}><p style={{ margin: 0 }}><PrintInline text={b.text} p={p} /></p></B>;
        if (b.type === 'list') {
          const L = b.ordered ? 'ol' : 'ul';
          return (
            <B key={i}>
              <L style={{ margin: 0, paddingLeft: 22, listStyleType: b.ordered ? 'decimal' : 'disc' }}>
                {b.items.map((it, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>
                    <PrintInline text={it} p={p} />
                  </li>
                ))}
              </L>
            </B>
          );
        }
        if (b.type === 'callout')
          return (
            <B key={i}>
              <div style={{ borderLeft: `4px solid ${p.pen}`, background: p.soft, padding: '8px 14px', borderRadius: 6 }}>
                <PrintInline text={b.text} p={p} />
              </div>
            </B>
          );
        if (b.type === 'code')
          return (
            <B key={i}>
              <pre style={{ margin: 0, background: p.codeBg, color: p.codeInk, padding: '12px 14px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {b.text}
              </pre>
            </B>
          );
        if (b.type === 'video')
          return (
            <B key={i}>
              <p style={{ margin: 0, color: p.muted }}>
                Video: search YouTube for <strong style={{ color: p.ink }}>“{b.query}”</strong>
              </p>
            </B>
          );
        return null;
      })}

      {quiz.length > 0 && (
        <>
          <B keep style={{ paddingTop: 18, borderTop: `2px dashed ${p.rule}`, marginTop: 8 }}>
            <h2 style={h(21)}>Quiz</h2>
          </B>
          {quiz.map((q, i) => (
            <B key={`q${i}`}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {i + 1}. {q.question}
              </p>
              <ol type="A" style={{ margin: '4px 0 0', paddingLeft: 24, listStyleType: 'upper-alpha' }}>
                {q.options.map((o, j) => (
                  <li key={j}>{o}</li>
                ))}
              </ol>
            </B>
          ))}
          <B keep style={{ paddingTop: 10 }}>
            <h2 style={h(18)}>Answer key</h2>
          </B>
          {quiz.map((q, i) => (
            <B key={`a${i}`} style={{ paddingBottom: 8 }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: p.ok }}>
                  {i + 1}. {String.fromCharCode(65 + q.answer)}
                </strong>{' '}
                {q.options[q.answer]}
                {q.explanation && <span style={{ color: p.muted }}>. {q.explanation}</span>}
              </p>
            </B>
          ))}
        </>
      )}

      {lesson.readings?.length > 0 && (
        <>
          <B keep style={{ paddingTop: 10 }}>
            <h2 style={h(18)}>Suggested readings</h2>
          </B>
          {lesson.readings.map((r, i) => (
            <B key={`r${i}`} style={{ paddingBottom: 6 }}>
              <p style={{ margin: 0 }}>
                {r.title}
                {r.url && <span style={{ color: p.pen }}> {r.url}</span>}
              </p>
            </B>
          ))}
        </>
      )}
      <div data-pdf-block style={{ paddingTop: 16, color: p.muted, fontSize: 12 }}>
        Generated with Text-to-Learn
      </div>
    </div>
  );
});

// Choose page breaks between blocks so no paragraph is cut in half.
function pageBreaks(root, pageH) {
  const rootTop = root.getBoundingClientRect().top;
  const blocks = [...root.querySelectorAll('[data-pdf-block]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top - rootTop, bottom: r.bottom - rootTop, keep: el.hasAttribute('data-pdf-keep') };
  });
  const total = root.scrollHeight;
  const pages = [];
  let start = 0;
  while (start < total - 1) {
    let end = Math.min(start + pageH, total);
    if (end < total) {
      const crossing = blocks.find((b) => b.top < end && b.bottom > end && b.top > start);
      if (crossing) end = crossing.top;
      // never leave a heading alone at the bottom of a page
      const inside = blocks.filter((b) => b.top >= start && b.bottom <= end);
      const last = inside[inside.length - 1];
      if (last?.keep && last.top > start) end = last.top;
    }
    end = Math.floor(end);
    if (end <= start) end = Math.min(start + pageH, total);
    pages.push([start, end]);
    start = end;
  }
  return pages;
}

export async function exportElementToPdf(el, { filename, background }) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
  await document.fonts?.ready;
  const scale = 2;
  const canvas = await html2canvas(el, { scale, backgroundColor: background, useCORS: true, logging: false, windowWidth: PAGE_W });

  const pdf = new jsPDF({ unit: 'px', format: [PAGE_W, PAGE_H], hotfixes: ['px_scaling'] });
  const contentH = PAGE_H - MARGIN_Y * 2;
  const pages = pageBreaks(el, contentH);

  pages.forEach(([s, e], i) => {
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H]);
    pdf.setFillColor(background);
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = Math.max(1, Math.round((e - s) * scale));
    slice.getContext('2d').drawImage(canvas, 0, Math.round(s * scale), canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, MARGIN_Y, PAGE_W, e - s);
    pdf.setFontSize(10);
    pdf.setTextColor(140);
    pdf.text(`${i + 1} / ${pages.length}`, PAGE_W - 64, PAGE_H - 24, { align: 'right' });
  });
  pdf.save(filename);
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

// DownloadButton + hidden, print-styled copy of the lesson.
export default function LessonPDFExporter({ lesson }) {
  const ref = useRef(null);
  const [theme, setTheme] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const download = async (t) => {
    setError(null);
    setBusy(true);
    setTheme(t);
    // wait for the hidden layout to render with the chosen palette
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      await exportElementToPdf(ref.current, { filename: `${slug(lesson.title)}${t === 'dark' ? '-dark' : ''}.pdf`, background: PALETTES[t].bg });
    } catch (err) {
      console.error(err);
      setError('Could not create the PDF. Try again.');
    } finally {
      setBusy(false);
      setTheme(null);
    }
  };

  return (
    <div className="relative">
      <div className="inline-flex overflow-hidden rounded-lg border border-line bg-sheet">
        <button onClick={() => download('light')} disabled={busy} className="px-3 py-2 text-sm font-semibold hover:bg-pen-soft disabled:opacity-60">
          {busy ? 'Making PDF…' : 'Download PDF'}
        </button>
        <button onClick={() => download('dark')} disabled={busy} className="border-l border-line px-3 py-2 text-sm text-muted hover:bg-pen-soft hover:text-ink disabled:opacity-60" title="Download with a dark background">
          Dark
        </button>
      </div>
      {error && <p className="absolute top-full mt-1 text-xs text-bad">{error}</p>}
      {theme && <PrintLesson ref={ref} lesson={lesson} theme={theme} />}
    </div>
  );
}
