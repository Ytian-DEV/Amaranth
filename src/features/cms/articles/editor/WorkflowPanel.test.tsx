import { fireEvent, render, screen } from '@testing-library/react';
import { WorkflowPanel } from './WorkflowPanel';

describe('WorkflowPanel', () => {
  it('requires a note to reject', () => {
    const onTransition = vi.fn();
    render(<WorkflowPanel status="in_review" publishedAt={null} options={['published', 'rejected']} busy={false} onTransition={onTransition} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: /Note/ }), { target: { value: 'Off-topic for News' } });
    fireEvent.click(confirm);
    expect(onTransition).toHaveBeenCalledWith('rejected', 'Off-topic for News', null);
  });

  it('needs a time to schedule', () => {
    const onTransition = vi.fn();
    render(<WorkflowPanel status="draft" publishedAt={null} options={['scheduled']} busy={false} onTransition={onTransition} />);
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Publish on'), { target: { value: '2030-01-05T08:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onTransition).toHaveBeenCalledWith('scheduled', null, new Date('2030-01-05T08:00').toISOString());
  });

  it('explains when nothing is allowed', () => {
    render(<WorkflowPanel status="submitted" publishedAt={null} options={[]} busy={false} onTransition={vi.fn()} />);
    expect(screen.getByText('Waiting for an editor.')).toBeInTheDocument();
  });
});
