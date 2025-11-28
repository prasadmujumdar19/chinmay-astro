'use client';

import { use } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface ConsultationPageProps {
  params: Promise<{ id: string }>;
}

/**
 * User Consultation Page
 *
 * Displays a single consultation chat interface for users
 *
 * Reference: TDD section 11.5.1 "User Consultation Page" (lines 10711-10780)
 * Reference: PRD FR-CHAT-006
 */
export default function ConsultationPage({ params }: ConsultationPageProps) {
  const { id } = use(params);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ChatWindow consultationId={id} />
    </div>
  );
}
