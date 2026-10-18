import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fixtureArticle } from '@/dev/fixtures';
import { ArticleView } from '@/features/public/article/ArticleView';
import { CategoryPill } from './Tag';

describe('CategoryPill', () => {
  it('puts the specific category first, heavy, then the section', () => {
    const { container } = render(<CategoryPill label="News · Environment" />);
    const [lead, rest] = container.querySelectorAll('span > span');
    expect(lead).toHaveTextContent('Environment');
    expect(lead).toHaveClass('font-black');
    expect(rest).toHaveTextContent('News');
  });

  it('shows a single label on its own', () => {
    const { container } = render(<CategoryPill label="Sports" />);
    expect(container.querySelectorAll('span > span')).toHaveLength(1);
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });
});

describe('article byline chip', () => {
  it('reads "via names | Amaranth"', () => {
    render(
      <MemoryRouter>
        <ArticleView article={fixtureArticle} url="https://amaranth.example/a" related={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('via')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos and Paolo Reyes | Amaranth')).toBeInTheDocument();
  });
});
