/**
 * PersonaImage component - Displays user persona image with fallback
 * Reference: TDD section 10.2 "Firebase Storage Structure" (lines 8977-9030)
 */

'use client';

import Image from 'next/image';

interface PersonaImageProps {
  imageUrl: string | null;
  userName: string;
  size?: number;
}

export function PersonaImage({ imageUrl, userName, size = 200 }: PersonaImageProps) {
  const placeholderSrc = '/images/placeholder-persona.png';
  const imageSrc = imageUrl || placeholderSrc;
  const altText = imageUrl ? `${userName} persona` : 'Default persona placeholder';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={imageSrc}
        alt={altText}
        width={size}
        height={size}
        className="rounded-full object-cover border-4 border-gray-200"
        priority
        unoptimized={imageUrl !== null} // Firebase URLs are already optimized
      />
    </div>
  );
}
