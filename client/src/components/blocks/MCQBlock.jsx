import { useId, useState } from 'react';

export default function MCQBlock({ number, question, options = [], answer, explanation, onAnswered }) {
  const [picked, setPicked] = useState(null);
  const [checked, setChecked] = useState(false);
  const name = useId();
  const correct = checked && picked === answer;

  const check = () => {
    if (picked === null) return;
    setChecked(true);
    onAnswered?.(picked === answer);
  };

  const reset = () => {
    setPicked(null);
    setChecked(false);
    onAnswered?.(null);
  };

  return (
    <fieldset className="rounded-lg border border-line bg-sheet p-5">
      <legend className="sr-only">Question {number}</legend>
      <p className="font-semibold">
        <span className="mr-2 text-pen">Q{number}.</span>
        {question}
      </p>
      <div className="mt-4 space-y-2">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const showRight = checked && i === answer;
          const showWrong = checked && isPicked && i !== answer;
          return (
            <label
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                showRight ? 'border-ok bg-ok-soft' : showWrong ? 'border-bad bg-bad-soft' : isPicked ? 'border-pen bg-pen-soft' : 'border-line hover:border-pen/50'
              } ${checked ? 'cursor-default' : ''}`}
            >
              <input type="radio" name={name} className="mt-1 accent-[var(--pen)]" checked={isPicked} disabled={checked} onChange={() => setPicked(i)} />
              <span className="flex-1">{opt}</span>
              {showRight && <span className="text-sm font-semibold text-ok">Correct answer</span>}
              {showWrong && <span className="text-sm font-semibold text-bad">Your answer</span>}
            </label>
          );
        })}
      </div>

      {!checked ? (
        <button onClick={check} disabled={picked === null} className="mt-4 rounded-md bg-pen px-4 py-2 text-sm font-semibold text-on-pen hover:bg-pen-strong disabled:cursor-not-allowed disabled:opacity-40">
          Check answer
        </button>
      ) : (
        <div className="mt-4" aria-live="polite">
          <p className={`font-semibold ${correct ? 'text-ok' : 'text-bad'}`}>{correct ? 'Correct.' : 'Not quite.'}</p>
          {explanation && <p className="mt-1 text-muted">{explanation}</p>}
          <button onClick={reset} className="mt-3 text-sm font-semibold text-pen hover:underline">
            Try again
          </button>
        </div>
      )}
    </fieldset>
  );
}
