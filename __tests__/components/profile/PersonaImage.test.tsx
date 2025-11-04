import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonaImage } from '@/components/profile/PersonaImage';

describe('PersonaImage', () => {
  it('should render image with provided URL', () => {
    const imageUrl = 'https://example.com/persona.jpg';

    render(<PersonaImage imageUrl={imageUrl} userName="Test User" />);

    const image = screen.getByAltText(/Test User persona/i);
    expect(image).toBeInTheDocument();
  });

  it('should render placeholder when imageUrl is null', () => {
    render(<PersonaImage imageUrl={null} userName="Test User" />);

    const image = screen.getByAltText(/Default persona placeholder/i);
    expect(image).toBeInTheDocument();
  });

  it('should use provided size', () => {
    render(
      <PersonaImage imageUrl="https://example.com/persona.jpg" userName="Test User" size={300} />
    );

    const image = screen.getByAltText(/Test User persona/i);
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('width')).toBe('300');
  });

  it('should have default size of 200', () => {
    render(<PersonaImage imageUrl="https://example.com/persona.jpg" userName="Test User" />);

    const image = screen.getByAltText(/Test User persona/i);
    expect(image.getAttribute('width')).toBe('200');
  });

  it('should render with rounded styling', () => {
    render(<PersonaImage imageUrl="https://example.com/persona.jpg" userName="Test User" />);

    const image = screen.getByAltText(/Test User persona/i);
    expect(image.className).toContain('rounded-full');
  });
});
