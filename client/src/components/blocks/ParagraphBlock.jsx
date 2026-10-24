import { Inline } from './inline.jsx';

export default function ParagraphBlock({ text }) {
  return (
    <p className="my-4">
      <Inline text={text} />
    </p>
  );
}
