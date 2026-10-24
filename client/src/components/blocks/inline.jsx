// Tiny, safe inline formatter: **bold**, `code` and line breaks. No HTML is ever injected.
export function Inline({ text = '' }) {
  const lines = String(text).split('\n');
  return lines.map((line, li) => (
    <span key={li}>
      {li > 0 && <br />}
      {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
          return (
            <code key={i} className="rounded bg-code px-1.5 py-0.5 font-mono text-[0.9em]">
              {part.slice(1, -1)}
            </code>
          );
        return part;
      })}
    </span>
  ));
}
