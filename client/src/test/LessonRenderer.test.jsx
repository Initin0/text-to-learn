import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LessonRenderer from '../components/LessonRenderer.jsx';

// stable object, like the memoised real hook
vi.mock('../hooks/useApi.js', () => {
  const api = { searchYouTube: async () => ({ videos: [], fallbackUrl: 'https://www.youtube.com/results?search_query=x' }) };
  return { useApi: () => api };
});

const content = [
  { type: 'heading', text: 'Introduction to AI' },
  { type: 'paragraph', text: 'AI is **a field** of computer science.' },
  { type: 'code', language: 'python', text: "print('Hello, AI!')" },
  { type: 'video', query: 'AI explained' },
  { type: 'unknown', text: 'should not render' },
  { type: 'mcq', question: 'What is AI?', options: ['A robot', 'A field of computer science', 'A language'], answer: 1, explanation: 'AI is a field of study.' },
  { type: 'mcq', question: 'Second?', options: ['yes', 'no'], answer: 0, explanation: '' },
];

describe('LessonRenderer', () => {
  it('renders each block type and skips unknown ones', async () => {
    render(<LessonRenderer content={content} />);
    expect(screen.getByRole('heading', { name: 'Introduction to AI' })).toBeInTheDocument();
    expect(screen.getByText('a field').tagName).toBe('STRONG');
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(await screen.findByText('Search YouTube for this lesson')).toBeInTheDocument();
    expect(screen.queryByText('should not render')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Check your understanding' })).toBeInTheDocument();
  });

  it('grades a quiz answer and shows the explanation', async () => {
    const user = userEvent.setup();
    render(<LessonRenderer content={content} />);
    await user.click(screen.getByLabelText('A robot'));
    await user.click(screen.getAllByRole('button', { name: 'Check answer' })[0]);
    expect(screen.getByText('Not quite.')).toBeInTheDocument();
    expect(screen.getByText('AI is a field of study.')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 answered')).toBeInTheDocument();
    await user.click(screen.getByLabelText('yes'));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('You got 1 of 2')).toBeInTheDocument();
  });
});
