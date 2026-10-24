import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PromptForm from '../components/PromptForm.jsx';

describe('PromptForm', () => {
  it('blocks topics shorter than 3 characters', async () => {
    const onSubmit = vi.fn();
    render(<PromptForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Topic you want to learn'), 'ab');
    await userEvent.click(screen.getByRole('button', { name: 'Generate course' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Write at least 3 characters.')).toBeInTheDocument();
  });

  it('submits topic and chosen level', async () => {
    const onSubmit = vi.fn();
    render(<PromptForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Basics of Copyright Law' }));
    await userEvent.click(screen.getByLabelText('Advanced'));
    await userEvent.click(screen.getByRole('button', { name: 'Generate course' }));
    expect(onSubmit).toHaveBeenCalledWith({ topic: 'Basics of Copyright Law', level: 'advanced' });
  });
});
