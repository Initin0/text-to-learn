import HeadingBlock from './blocks/HeadingBlock.jsx';
import ParagraphBlock from './blocks/ParagraphBlock.jsx';
import ListBlock from './blocks/ListBlock.jsx';
import CodeBlock from './blocks/CodeBlock.jsx';
import CalloutBlock from './blocks/CalloutBlock.jsx';
import VideoBlock from './blocks/VideoBlock.jsx';
import QuizSection from './blocks/QuizSection.jsx';

const BLOCKS = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  list: ListBlock,
  code: CodeBlock,
  callout: CalloutBlock,
  video: VideoBlock,
};

// Renders the lesson's content array. Unknown block types are skipped, and all
// MCQs are gathered into one quiz section at the end.
export default function LessonRenderer({ content = [] }) {
  const questions = content.filter((b) => b.type === 'mcq');
  return (
    <div className="prose-lesson">
      {content.map((block, i) => {
        const Component = BLOCKS[block.type];
        return Component ? <Component key={i} {...block} /> : null;
      })}
      {questions.length > 0 && <QuizSection questions={questions} />}
    </div>
  );
}
