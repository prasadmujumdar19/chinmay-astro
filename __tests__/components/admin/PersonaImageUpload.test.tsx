import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonaImageUpload } from '@/components/admin/PersonaImageUpload';

// Mock Firebase storage and API functions
vi.mock('@/lib/firebase/storage', () => ({
  uploadPersonaImage: vi.fn(() =>
    Promise.resolve({
      url: 'https://example.com/image.jpg',
      path: 'persona-images/test-user-123/image.jpg',
    })
  ),
  deletePersonaImage: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/api/users', () => ({
  updatePersonaImage: vi.fn(() => Promise.resolve()),
}));

describe('PersonaImageUpload', () => {
  const mockUserId = 'test-user-123';
  const mockOnUploadComplete = vi.fn();
  const mockOnError = vi.fn();

  // Get mocked functions
  let mockUploadPersonaImage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import mocked function
    const storage = await import('@/lib/firebase/storage');
    mockUploadPersonaImage = storage.uploadPersonaImage as ReturnType<typeof vi.fn>;

    mockUploadPersonaImage.mockResolvedValue({
      url: 'https://example.com/image.jpg',
      path: 'persona-images/test-user-123/image.jpg',
    });
  });

  it('should render file input', () => {
    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByLabelText(/upload persona image/i)).toBeInTheDocument();
  });

  it('should accept only image files', () => {
    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const fileInput = screen.getByLabelText(/upload persona image/i) as HTMLInputElement;
    expect(fileInput.accept).toContain('image');
  });

  it('should show error for non-image files', async () => {
    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload persona image/i);

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/only image files are allowed/i)).toBeInTheDocument();
    });

    expect(mockUploadPersonaImage).not.toHaveBeenCalled();
  });

  it('should show error for files larger than 5MB', async () => {
    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    // Create a mock file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large-image.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = screen.getByLabelText(/upload persona image/i);

    await userEvent.upload(fileInput, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/file size must be less than 5MB/i)).toBeInTheDocument();
    });

    expect(mockUploadPersonaImage).not.toHaveBeenCalled();
  });

  it('should upload valid image file', async () => {
    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['image content'], 'persona.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload persona image/i);

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadPersonaImage).toHaveBeenCalledWith(
        mockUserId,
        expect.any(File),
        expect.any(Function)
      );
    });
  });

  it('should show upload progress', async () => {
    mockUploadPersonaImage.mockImplementation((userId, file, onProgress) => {
      // Simulate progress callbacks
      onProgress(50);
      return Promise.resolve({
        url: 'https://example.com/image.jpg',
        path: 'persona-images/test-user-123/image.jpg',
      });
    });

    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['image content'], 'persona.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload persona image/i);

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  it('should call onUploadComplete after successful upload', async () => {
    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['image content'], 'persona.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload persona image/i);

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith('https://example.com/image.jpg');
    });
  });

  it('should show error message on upload failure', async () => {
    mockUploadPersonaImage.mockRejectedValueOnce(new Error('Upload failed'));

    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['image content'], 'persona.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload persona image/i);

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });

  it('should allow canceling upload', async () => {
    mockUploadPersonaImage.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(
            () =>
              resolve({
                url: 'https://example.com/image.jpg',
                path: 'persona-images/test-user-123/image.jpg',
              }),
            5000
          );
        })
    );

    render(
      <PersonaImageUpload
        userId={mockUserId}
        currentImagePath={null}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['image content'], 'persona.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload persona image/i);

    await userEvent.upload(fileInput, file);

    // Wait for upload to start
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });
});
