import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntakeDetailView } from './IntakePage';
import type { IntakeItem } from './intakeApi';

const item: IntakeItem = {
  id: 's1', kind: 'submission', title: 'A love letter to the Agri canteen', from: 'Juan Dela Cruz', email: 'juan@example.com',
  affiliation: 'BS Agriculture 3', section: 'Feature', summary: 'Four generations of students.', body: 'The canteen…',
  eventDate: null, venue: null, status: 'submitted', reviewNote: null, convertedArticleId: null, createdAt: new Date().toISOString(),
};

const renderView = (over: Partial<IntakeItem> = {}, handlers = { onStatus: vi.fn(), onConvert: vi.fn() }) => {
  render(
    <MemoryRouter>
      <IntakeDetailView item={{ ...item, ...over }} files={[]} categories={[{ id: 'c1', name: 'Campus Feature', sectionName: 'Feature' }]} busy={false} {...handlers} />
    </MemoryRouter>,
  );
  return handlers;
};

describe('IntakeDetailView', () => {
  it('converts to a draft in the chosen category', () => {
    const h = renderView();
    const create = screen.getByRole('button', { name: 'Create draft' });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Category for the new article' }), { target: { value: 'c1' } });
    fireEvent.click(create);
    expect(h.onConvert).toHaveBeenCalledWith('c1');
  });

  it('declines with the internal note', () => {
    const h = renderView();
    fireEvent.change(screen.getByRole('textbox', { name: 'Internal note' }), { target: { value: 'Duplicate of last week' } });
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    expect(h.onStatus).toHaveBeenCalledWith('declined', 'Duplicate of last week');
  });

  it('links to the draft once converted', () => {
    renderView({ status: 'converted', convertedArticleId: 'a9' });
    expect(screen.getByRole('link', { name: /Open the draft/ })).toHaveAttribute('href', '/admin/articles/a9');
    expect(screen.queryByRole('button', { name: 'Create draft' })).not.toBeInTheDocument();
  });
});
