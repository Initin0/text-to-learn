import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <h1 className="font-display text-4xl font-extrabold">This page is not in the syllabus</h1>
      <p className="mt-3 text-muted">The link may be old, or the course was deleted.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-pen px-4 py-2 font-semibold text-on-pen hover:bg-pen-strong">
        Go to your courses
      </Link>
    </div>
  );
}
