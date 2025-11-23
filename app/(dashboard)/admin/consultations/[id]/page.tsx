'use client';

import { use } from 'react';
import { AdminChatWindow } from '@/components/admin/AdminChatWindow';

interface AdminConsultationPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin Consultation Page
 *
 * Displays a single consultation with admin controls (Send & Close)
 *
 * Reference: TDD section 11.5.2 "Admin Consultation Page" (lines 10781-10850)
 * Reference: PRD FR-CHAT-009
 */
export default function AdminConsultationPage({ params }: AdminConsultationPageProps) {
  const { id } = use(params);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <AdminChatWindow consultationId={id} />
    </div>
  );
}
