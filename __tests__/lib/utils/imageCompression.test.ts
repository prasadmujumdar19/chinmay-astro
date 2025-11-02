import { describe, it, expect, beforeEach, vi } from 'vitest';
import { compressImage } from '@/lib/utils/imageCompression';

// Mock canvas and image APIs
const mockCanvas = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    canvas: {
      toBlob: vi.fn(callback => {
        const blob = new Blob(['compressed'], { type: 'image/jpeg' });
        callback(blob);
      }),
    },
  })),
  width: 0,
  height: 0,
};

const mockImage = {
  src: '',
  width: 2048,
  height: 2048,
  onload: null as (() => void) | null,
  onerror: null as ((error: Error) => void) | null,
};

beforeEach(() => {
  vi.clearAllMocks();

  // Mock document.createElement for canvas
  global.document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas as unknown as HTMLCanvasElement;
    }
    return {} as HTMLElement;
  });

  // Mock Image constructor

  global.Image = vi.fn().mockImplementation(() => {
    const img = { ...mockImage };
    // Simulate image load
    setTimeout(() => {
      if (img.onload) img.onload();
    }, 0);
    return img;
  }) as any;

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

describe('Image Compression', () => {
  it('should compress image to max 1024x1024', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const compressed = await compressImage(file);

    expect(compressed).toBeInstanceOf(Blob);
    expect(compressed.type).toBe('image/jpeg');
  });

  it('should maintain aspect ratio when resizing', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await compressImage(file);

    // Canvas should be created with correct dimensions
    expect(mockCanvas.width).toBeLessThanOrEqual(1024);
    expect(mockCanvas.height).toBeLessThanOrEqual(1024);
  });

  it('should use quality 0.8 for compression', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const context = mockCanvas.getContext('2d');

    await compressImage(file);

    // toBlob should be called with quality parameter
    expect(context?.canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8);
  });

  it('should handle images smaller than max dimensions', async () => {
    mockImage.width = 512;
    mockImage.height = 512;

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const compressed = await compressImage(file);

    expect(compressed).toBeInstanceOf(Blob);
  });

  it('should handle non-square images', async () => {
    mockImage.width = 2048;
    mockImage.height = 1024;

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await compressImage(file);

    // Should maintain aspect ratio
    const aspectRatio = 2048 / 1024;
    const expectedWidth = 1024;
    const expectedHeight = expectedWidth / aspectRatio;

    expect(mockCanvas.width).toBe(expectedWidth);
    expect(mockCanvas.height).toBe(expectedHeight);
  });

  it('should handle PNG files', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    const compressed = await compressImage(file, 'image/png');

    expect(compressed).toBeInstanceOf(Blob);
    expect(compressed.type).toBe('image/png');
  });

  it('should reject on image load error', async () => {
    global.Image = vi.fn().mockImplementation(() => {
      const img = { ...mockImage };
      setTimeout(() => {
        if (img.onerror) img.onerror(new Error('Failed to load'));
      }, 0);
      return img;
    }) as any;

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await expect(compressImage(file)).rejects.toThrow('Failed to load');
  });

  it('should create object URL from file', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await compressImage(file);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  it('should revoke object URL after compression', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await compressImage(file);

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should handle custom max dimensions', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await compressImage(file, 'image/jpeg', 512);

    expect(mockCanvas.width).toBeLessThanOrEqual(512);
    expect(mockCanvas.height).toBeLessThanOrEqual(512);
  });
});
