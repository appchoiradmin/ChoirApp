import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChordProViewer from '../../src/components/ChordProViewer';

describe('ChordProViewer', () => {
  it('renders a title directive correctly', () => {
    const source = '{t: Amazing Grace}';
    render(<ChordProViewer source={source} />);
    const titleElement = screen.getByRole('heading', { name: /Amazing Grace/i });
    expect(titleElement).toBeInTheDocument();
  });

  it('renders a comment directive correctly', () => {
    const source = '{c: Chorus}';
    render(<ChordProViewer source={source} />);
    const commentElement = screen.getByText('Chorus');
    expect(commentElement).toBeInTheDocument();
    expect(commentElement.tagName).toBe('EM');
  });

  it('renders lyrics and chords correctly', () => {
    const source = '[G]Amazing [C]grace, how [G]sweet the [D]sound';
    render(<ChordProViewer source={source} />);
    
    const gChords = screen.getAllByText('G');
    expect(gChords).toHaveLength(2);

    expect(screen.getByText(/Amazing/i)).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText(/grace, how/i)).toBeInTheDocument();
    expect(screen.getByText(/sweet the/i)).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('sound')).toBeInTheDocument();
  });

  it('renders lines with only lyrics', () => {
    const source = 'That saved a wretch like me';
    render(<ChordProViewer source={source} />);
    expect(screen.getByText('That saved a wretch like me')).toBeInTheDocument();
  });

  it('handles empty source string gracefully', () => {
    render(<ChordProViewer source="" />);
    const viewer = screen.getByTestId('chord-pro-viewer'); // Assuming you add a data-testid
    expect(viewer).toBeEmptyDOMElement();
  });
});
