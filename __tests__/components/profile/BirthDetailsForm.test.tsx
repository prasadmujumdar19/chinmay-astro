import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BirthDetailsForm } from '@/components/profile/BirthDetailsForm';
import { mockBirthDetails } from '@/__tests__/fixtures/profile';

describe('BirthDetailsForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with all fields', () => {
    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/place of birth/i)).toBeInTheDocument();
  });

  it('should populate form with initial data', () => {
    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const placeInput = screen.getByLabelText(/place of birth/i) as HTMLInputElement;
    expect(placeInput.value).toBe('Mumbai, India');
  });

  it('should show validation error for empty date', async () => {
    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const dateInput = screen.getByLabelText(/date of birth/i);
    await userEvent.clear(dateInput);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid time format', async () => {
    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const timeInput = screen.getByLabelText(/time of birth/i);
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, '25:99');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid time format/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for empty place', async () => {
    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const placeInput = screen.getByLabelText(/place of birth/i);
    await userEvent.clear(placeInput);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/place of birth is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with valid data', async () => {
    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const placeInput = screen.getByLabelText(/place of birth/i);
    await userEvent.clear(placeInput);
    await userEvent.type(placeInput, 'Delhi, India');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          placeOfBirth: 'Delhi, India',
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable submit button while submitting', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <BirthDetailsForm
        initialData={mockBirthDetails}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
