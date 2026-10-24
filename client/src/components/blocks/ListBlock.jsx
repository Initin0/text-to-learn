import { Inline } from './inline.jsx';

export default function ListBlock({ items = [], ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`my-4 space-y-2 pl-6 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-pen`}>
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          <Inline text={item} />
        </li>
      ))}
    </Tag>
  );
}
