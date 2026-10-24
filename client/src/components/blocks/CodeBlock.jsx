import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

export default function CodeBlock({ language = 'text', text = '' }) {
  const [copied, setCopied] = useState(false);
  const code = text.replace(/\n+$/, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the code is still selectable */
    }
  };

  return (
    <figure className="my-6 overflow-hidden rounded-lg border border-line bg-[#0f1630]">
      <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-[#aab4d6]">
        <span className="font-mono">{language}</span>
        <button onClick={copy} className="rounded px-2 py-0.5 font-semibold hover:bg-white/10 hover:text-white">
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </figcaption>
      <Highlight code={code} language={language.toLowerCase()} theme={themes.nightOwl}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto p-4 font-mono text-[0.88rem] leading-relaxed" style={{ background: 'transparent' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </figure>
  );
}
