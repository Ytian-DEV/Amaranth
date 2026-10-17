import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ActivityPanel, RevisionsPanel } from './HistoryPanels';
import type { ActivityItem } from './history';

const items: ActivityItem[] = [
  { id: 3, action: 'status', from: 'in_review', to: 'draft', note: 'Needs a second source', actor: 'Nora News', createdAt: new Date().toISOString() },
  { id: 2, action: 'status', from: 'draft', to: 'submitted', note: null, actor: 'Wes Writer', createdAt: new Date().toISOString() },
  { id: 1, action: 'created', from: null, to: 'draft', note: null, actor: 'Wes Writer', createdAt: new Date().toISOString() },
];

describe('ActivityPanel', () => {
  it('describes workflow steps in plain words with notes', () => {
    render(<ActivityPanel items={items} />);
    expect(screen.getByText('returned it to draft')).toBeInTheDocument();
    expect(screen.getByText('submitted it for review')).toBeInTheDocument();
    expect(screen.getByText('Needs a second source')).toBeInTheDocument();
  });

  it('adds a note', async () => {
    const onAddNote = vi.fn().mockResolvedValue(undefined);
    render(<ActivityPanel items={[]} onAddNote={onAddNote} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Note to the newsroom' }), { target: { value: 'Check the quote' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    await waitFor(() => expect(onAddNote).toHaveBeenCalledWith('Check the quote'));
  });
});

describe('RevisionsPanel', () => {
  it('restores after confirmation', () => {
    const onRestore = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<RevisionsPanel items={[{ id: 9, kind: 'manual', title: 'T', savedBy: 'Ana', createdAt: new Date().toISOString() }]} canRestore onRestore={onRestore} />);
    fireEvent.click(screen.getByRole('button', { name: /Restore/ }));
    expect(onRestore).toHaveBeenCalledWith(9);
  });
});
