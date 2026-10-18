import { render, screen } from '@testing-library/react';
import { LogoLoader } from './LogoLoader';

describe('LogoLoader', () => {
  it('announces loading and spins the Amaranth mark', () => {
    const { container } = render(<LogoLoader label="Loading the article" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the article');
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/amaranth-logo.svg');
    expect(img?.className).toMatch(/animate-\[spin/);
    expect(img?.className).toMatch(/motion-reduce:animate-pulse/);
  });
});
