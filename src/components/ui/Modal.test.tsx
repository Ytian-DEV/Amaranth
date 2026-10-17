import { fireEvent, render, screen } from '@testing-library/react';
import { mediaProblem } from '@/features/cms/media/uploadMedia';
import { Modal } from './Modal';

// jsdom has no <dialog> methods
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
  };
});

describe('Modal', () => {
  it('ignores a nested dialog closing (the media picker inside a form)', () => {
    const onFormClose = vi.fn();
    const onPickerClose = vi.fn();
    render(
      <Modal open onClose={onFormClose} title="Edit faction">
        <dialog aria-label="Choose an image" onClose={onPickerClose} />
      </Modal>,
    );
    fireEvent(screen.getByLabelText('Choose an image', { selector: 'dialog' }), new Event('close'));
    expect(onPickerClose).toHaveBeenCalledTimes(1);
    expect(onFormClose).not.toHaveBeenCalled();
  });

  it('still closes when its own dialog closes', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Edit faction">
        <p>Body</p>
      </Modal>,
    );
    fireEvent(screen.getByRole('dialog', { hidden: true }), new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('mediaProblem', () => {
  const file = (name: string, type: string) => new File(['x'], name, { type });
  it('accepts the types the media bucket stores and explains the rest', () => {
    expect(mediaProblem(file('logo.png', 'image/png'))).toBeNull();
    expect(mediaProblem(file('photo.jpg', 'image/jpeg'))).toBeNull();
    expect(mediaProblem(file('logo.svg', 'image/svg+xml'))).toMatch(/can’t be used \(SVG\+XML\)/);
    expect(mediaProblem(file('IMG_1.heic', 'image/heic'))).toMatch(/Save it as PNG, JPG or WebP/);
    expect(mediaProblem(file('notes.pdf', 'application/pdf'))).toMatch(/not an image/);
  });
});
