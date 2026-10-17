import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fixtureComments } from '@/dev/fixtures';
import { Comments } from './Comments';

describe('Comments', () => {
  it('threads replies under their parent', () => {
    render(<Comments comments={fixtureComments} open onSubmit={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Comments/ })).toHaveTextContent('(2)');
    expect(screen.getByText(/Would love a follow-up/).closest('ul')?.closest('li')).toHaveTextContent('Ana');
  });

  it('submits and shows the moderation notice', async () => {
    const onSubmit = vi.fn().mockResolvedValue('id');
    render(<Comments comments={[]} open onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Name/ }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^Comment/ }), { target: { value: 'Great piece' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    await waitFor(() => expect(screen.getByText(/once an editor approves it/)).toBeInTheDocument());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana', body: 'Great piece', website: '', parentId: null }));
  });

  it('shows RPC errors such as rate limits', async () => {
    render(<Comments comments={[]} open onSubmit={vi.fn().mockRejectedValue({ message: 'Too many requests. Please try again later.' })} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Name/ }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^Comment/ }), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Too many requests'));
  });

  it('hides the form when comments are closed', () => {
    render(<Comments comments={[]} open={false} onSubmit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Post comment' })).not.toBeInTheDocument();
    expect(screen.getByText(/closed/)).toBeInTheDocument();
  });
});
