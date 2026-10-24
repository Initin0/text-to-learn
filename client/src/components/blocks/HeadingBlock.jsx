export default function HeadingBlock({ text, level = 2 }) {
  const Tag = level === 3 ? 'h3' : level === 4 ? 'h4' : 'h2';
  const size = Tag === 'h2' ? 'text-2xl mt-10' : 'text-xl mt-8';
  return <Tag className={`${size} mb-3 font-display font-bold text-ink`}>{text}</Tag>;
}
