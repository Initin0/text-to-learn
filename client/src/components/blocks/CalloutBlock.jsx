import { Inline } from './inline.jsx';

const STYLES = {
  tip: { label: 'Tip', box: 'border-ok/40 bg-ok-soft', title: 'text-ok' },
  note: { label: 'Note', box: 'border-pen/30 bg-pen-soft', title: 'text-pen-strong' },
  warning: { label: 'Watch out', box: 'border-warn/40 bg-warn-soft', title: 'text-warn' },
};

export default function CalloutBlock({ variant = 'note', text }) {
  const s = STYLES[variant] || STYLES.note;
  return (
    <aside className={`my-6 rounded-lg border-l-4 px-4 py-3 ${s.box}`}>
      <p className={`text-sm font-bold ${s.title}`}>{s.label}</p>
      <p className="mt-1">
        <Inline text={text} />
      </p>
    </aside>
  );
}
