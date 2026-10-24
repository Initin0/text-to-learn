import { useState } from 'react';
import MCQBlock from './MCQBlock.jsx';

export default function QuizSection({ questions }) {
  const [results, setResults] = useState({});
  const answered = Object.values(results).filter((v) => v !== null && v !== undefined);
  const score = answered.filter(Boolean).length;

  return (
    <section className="mt-12 border-t-2 border-dashed border-rule pt-8" aria-labelledby="quiz-title">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="quiz-title" className="font-display text-2xl font-bold">
          Check your understanding
        </h2>
        <p className="text-sm text-muted" aria-live="polite">
          {answered.length === questions.length ? `You got ${score} of ${questions.length}` : `${answered.length} of ${questions.length} answered`}
        </p>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <MCQBlock key={i} number={i + 1} {...q} onAnswered={(ok) => setResults((r) => ({ ...r, [i]: ok }))} />
        ))}
      </div>
    </section>
  );
}
