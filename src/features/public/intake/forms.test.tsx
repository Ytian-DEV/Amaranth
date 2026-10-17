import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { defaultSections } from '../nav';
import { ContactForm } from './ContactPage';
import { SubmitArticleForm } from './SubmitArticlePage';

const type = (name: RegExp, value: string) => fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } });

describe('SubmitArticleForm', () => {
  it('requires a body or attachment and consent', async () => {
    const onSubmit = vi.fn();
    render(<MemoryRouter><SubmitArticleForm sections={defaultSections} onSubmit={onSubmit} /></MemoryRouter>);
    type(/Your name/, 'Juan Dela Cruz');
    type(/Email/, 'juan@example.com');
    type(/^Title/, 'A love letter to the Agri canteen');
    fireEvent.click(screen.getByRole('button', { name: /Send to the editors/ }));
    expect(await screen.findByText(/Paste your article/)).toBeInTheDocument();
    expect(screen.getByText('Please confirm before sending.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends a complete submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue('id');
    render(<MemoryRouter><SubmitArticleForm sections={defaultSections} onSubmit={onSubmit} /></MemoryRouter>);
    type(/Your name/, 'Juan Dela Cruz');
    type(/Email/, 'juan@example.com');
    type(/^Title/, 'A love letter to the Agri canteen');
    type(/Your article/, 'The canteen behind the Agri building has fed four generations of students. '.repeat(2));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Send to the editors/ }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/with our editors/));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Juan Dela Cruz', files: [], website: '' }));
  });
});

describe('ContactForm', () => {
  it('validates email and shows server errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue({ message: 'Too many requests. Please try again later.' });
    render(<ContactForm onSubmit={onSubmit} />);
    type(/^Name/, 'Ana');
    type(/Email/, 'ana@');
    type(/Subject/, 'Hello');
    type(/Message/, 'I would like to join the staff.');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    type(/Email/, 'ana@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Too many requests'));
  });
});
