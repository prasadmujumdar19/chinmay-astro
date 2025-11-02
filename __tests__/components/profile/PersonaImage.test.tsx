import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PersonaImage from '@/components/profile/PersonaImage';

describe('PersonaImage', () => {
  it('should render image with provided URL', () => {
    const imageUrl = 'https://example.com/persona.jpg';

    render(<PersonaImage imageUrl={imageUrl} alt="User Persona" />);

    const image = screen.getByAltText('User Persona');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toContain('persona.jpg');
  });

  it('should render placeholder when imageUrl is null', () => {
    render(<PersonaImage imageUrl={null} alt="User Persona" />);

    const image = screen.getByAltText('User Persona');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toContain('placeholder');
  });

  it('should render placeholder when imageUrl is undefined', () => {
    render(<PersonaImage imageUrl={undefined} alt="User Persona" />);

    const image = screen.getByAltText('User Persona');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toContain('placeholder');
  });

  it('should render placeholder when imageUrl is empty string', () => {
    render(<PersonaImage imageUrl="" alt="User Persona" />);

    const image = screen.getByAltText('User Persona');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toContain('placeholder');
  });

  it('should apply custom className', () => {
    render(
      <PersonaImage
        imageUrl="https://example.com/persona.jpg"
        alt="User Persona"
        className="custom-class"
      />
    );

    const image = screen.getByAltText('User Persona');
    expect(image.className).toContain('custom-class');
  });

  it('should have default size styling', () => {
    render(<PersonaImage imageUrl="https://example.com/persona.jpg" alt="User Persona" />);

    const imageContainer = screen.getByAltText('User Persona').parentElement;
    expect(imageContainer).toHaveClass('relative');
  });

  it('should support custom size prop', () => {
    render(
      <PersonaImage imageUrl="https://example.com/persona.jpg" alt="User Persona" size="lg" />
    );

    const imageContainer = screen.getByAltText('User Persona').parentElement;
    // Large size should have specific dimensions
    expect(imageContainer?.className).toContain('w-');
  });

  it('should render with rounded styling', () => {
    render(<PersonaImage imageUrl="https://example.com/persona.jpg" alt="User Persona" rounded />);

    const image = screen.getByAltText('User Persona');
    expect(image.className).toContain('rounded');
  });

  it('should handle loading state', () => {
    render(<PersonaImage imageUrl="https://example.com/persona.jpg" alt="User Persona" />);

    const image = screen.getByAltText('User Persona');
    // Next.js Image component should have loading attribute
    expect(image).toHaveAttribute('loading');
  });
});
