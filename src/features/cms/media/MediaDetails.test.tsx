import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MediaAssetRow } from '@/lib/database.types';
import { MediaDetails } from './MediaDetails';

const asset: MediaAssetRow = {
  id: 'a1', bucket: 'media', path: 'x.webp', kind: 'image', mime_type: 'image/webp', size_bytes: 1000, width: 100, height: 80,
  alt_text: '', caption: null, credit: null, variants: [], uploaded_by: 'u1', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
};

describe('MediaDetails', () => {
  it('flags missing alt text and saves edits', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<MediaDetails asset={asset} usage={0} canDelete onSave={onSave} onDelete={vi.fn()} />);
    expect(screen.getByText(/needed for accessibility/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /Alt text/ }), { target: { value: 'Students planting seedlings' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ id: 'a1', alt_text: 'Students planting seedlings', caption: null, credit: null }));
  });

  it('blocks deleting images that are in use', () => {
    render(<MediaDetails asset={asset} usage={3} canDelete onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByText('3 places')).toBeInTheDocument();
  });
});
